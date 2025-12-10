import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { generateNotesDraft, createChatSession } from './services/geminiService';
import { fetchCompanyData, submitSurveyData, sendTestChat } from './services/apiService';
import { translations } from './translations';
import { BRANDING } from './branding';
import { THEME } from './theme';
import type { Company, SurveyData, UserSession, UserRole, UserProfile } from './types';
import { Chat, GenerateContentResponse } from "@google/genai";
import { LoadingSpinner, JesStoneLogo, SparklesIcon, PaperAirplaneIcon, ChatBubbleIcon, XMarkIcon, DashboardIcon, PhotoIcon, LockClosedIcon, LogoutIcon, ClipboardListIcon, ClockIcon, BuildingBlocksIcon, CloudArrowUpIcon, TrashIcon, CalculatorIcon, ChartBarIcon, GlobeAltIcon } from './components/icons';
import { EstimatingModule } from './components/EstimatingModule';
import { ProjectManagementModule } from './components/ProjectManagementModule';

// --- MOCK ACCESS DATABASE ---
const MOCK_ACCESS_DB: Record<string, { role: UserRole, companyId: string, allowedPropertyIds: string[], profile?: UserProfile }> = {
    // Single Property Access (Site Manager)
    'PARKPLACE': { 
        role: 'site_manager', 
        companyId: 'knightvest', 
        allowedPropertyIds: ['kv-1'],
        profile: {
            firstName: 'Sarah',
            lastName: 'Connor',
            title: 'Property Manager',
            email: 'manager@parkplace.com',
            phone: '214-555-0199'
        }
    },
    'CANYON': { 
        role: 'site_manager', 
        companyId: 'knightvest', 
        allowedPropertyIds: ['kv-2'],
        profile: {
            firstName: 'Mike',
            lastName: 'Ross',
            title: 'Maintenance Lead',
            email: 'maint@canyoncreek.com',
            phone: '214-555-0200'
        }
    },

    // Regional Manager Demo (Access to both properties)
    'REGION1': { 
        role: 'regional_manager', 
        companyId: 'knightvest', 
        allowedPropertyIds: ['kv-1', 'kv-2'],
        profile: {
            firstName: 'John',
            lastName: 'Smith',
            title: 'Regional Director',
            email: 'jsmith@knightvest.com',
            phone: '214-555-9999'
        }
    },
    
    // Internal Admin (Company Portal)
    'ADMIN': { role: 'internal_admin', companyId: 'internal', allowedPropertyIds: [] },

    // Fallback Demo
    'DEMO': { role: 'site_manager', companyId: 'knightvest', allowedPropertyIds: ['kv-1'] }, 
};

// --- ERROR BOUNDARY COMPONENT ---
interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={`min-h-screen ${THEME.colors.background} flex items-center justify-center p-4`}>
          <div className={`${THEME.colors.surface} p-8 rounded-lg border ${THEME.colors.borderWarning} text-center max-w-lg shadow-2xl`}>
            <h1 className={`text-2xl font-bold ${THEME.colors.textWarning} mb-4`}>Something went wrong.</h1>
            <p className="mb-4 text-slate">The application encountered an unexpected error.</p>
            <button 
                onClick={() => {
                    window.location.hash = ''; // Reset route
                    window.location.reload();
                }} 
                className={`${THEME.colors.buttonPrimary} font-bold py-2 px-6 rounded transition-all`}
            >
                Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Navigation Handler ---
const handleNav = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const href = e.currentTarget.getAttribute('href');
    if (href) {
        window.location.hash = href;
    }
};

// --- Layout Components ---
interface HeaderProps {
    surveyUrl?: string;
    customTitle?: string;
    customSubtitle?: string;
    lang: 'en' | 'es';
    setLang: (lang: 'en' | 'es') => void;
}

const Header: React.FC<HeaderProps> = ({ surveyUrl, customTitle, customSubtitle, lang, setLang }) => {
    const t = translations[lang];
    return (
        <header className={`${THEME.colors.surface}/80 backdrop-blur-sm sticky top-0 z-20 shadow-lg`}>
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                <a href={surveyUrl || "#/"} onClick={handleNav} className="flex items-center gap-3">
                    {BRANDING.logoUrl ? (
                        <img src={BRANDING.logoUrl} alt={`${BRANDING.companyName} Logo`} className="h-12 w-auto object-contain" />
                    ) : (
                        <JesStoneLogo className="h-10 w-auto" />
                    )}
                    <div className="flex flex-col">
                        <span className={`text-lg font-bold ${THEME.colors.textMain} tracking-wider leading-tight`}>
                            {customTitle || BRANDING.companyName}
                        </span>
                        <span className={`text-sm ${THEME.colors.textSecondary} font-normal`}>
                            {customSubtitle || BRANDING.companySubtitle}
                        </span>
                    </div>
                </a>
                
                <button
                    onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full border ${THEME.colors.borderSubtle} ${THEME.colors.surfaceHighlight} hover:border-bright-cyan transition-colors`}
                >
                    <GlobeAltIcon className={`h-4 w-4 ${THEME.colors.textHighlight}`} />
                    <span className={`text-xs font-bold ${THEME.colors.textMain}`}>{t.languageToggle}</span>
                </button>
            </nav>
        </header>
    );
};

const Footer: React.FC = () => (
    <footer className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-12 border-t ${THEME.colors.borderSubtle} text-center`}>
        <div className="mb-6">
            <h3 className={`text-sm font-bold ${THEME.colors.textSecondary} tracking-widest uppercase mb-4`}>Internal Team Contacts</h3>
            <div className={`inline-block ${THEME.colors.surface} p-4 rounded-lg text-left`}>
                {BRANDING.teamContacts.map((contact, idx) => (
                    <div key={idx}>
                        <p className={`font-bold ${THEME.colors.textMain}`}>{contact.name}</p>
                        <p className={`text-sm ${THEME.colors.textHighlight}`}>{contact.role}</p>
                    </div>
                ))}
            </div>
        </div>
        <div className={`flex justify-between items-center text-xs ${THEME.colors.textSecondary}`}>
             <p>&copy; {new Date().getFullYear()} {BRANDING.companyName} {BRANDING.companySubtitle} | <a href={BRANDING.websiteUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">{new URL(BRANDING.websiteUrl).hostname}</a></p>
             <div className="flex items-center gap-2">
                <span>POWERED BY</span>
                {BRANDING.footerLogoUrl ? (
                    <img src={BRANDING.footerLogoUrl} alt="Powered By" className="h-6 opacity-70 hover:opacity-100 transition-opacity" />
                ) : (
                    <span className={`${THEME.colors.surface} px-2 py-1 rounded font-bold text-xs border ${THEME.colors.borderSubtle}`}>
                        {BRANDING.poweredByText}
                    </span>
                )}
             </div>
        </div>
    </footer>
);

// --- Survey Component (Restored Full Functionality) ---
interface SurveyProps {
    companies: Company[];
    isInternal?: boolean;
    embedded?: boolean;
    userProfile?: UserProfile;
    lang: 'en' | 'es';
}

const Survey: React.FC<SurveyProps> = ({ companies, isInternal, embedded, userProfile, lang }) => {
    const t = translations[lang];
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [formData, setFormData] = useState<SurveyData>({
        propertyId: '', firstName: '', lastName: '', title: '', phone: '', email: '',
        unitInfo: '', services: [], otherService: '', timeline: '', notes: '', contactMethods: [], attachments: []
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-select company if only one (e.g., from Access Code)
    useEffect(() => {
        if (companies.length === 1) {
            setSelectedCompanyId(companies[0].id);
        }
    }, [companies]);

    // Auto-fill user profile data if available
    useEffect(() => {
        if (userProfile && !formData.firstName) {
            setFormData(prev => ({
                ...prev,
                firstName: userProfile.firstName,
                lastName: userProfile.lastName,
                title: userProfile.title,
                email: userProfile.email,
                phone: userProfile.phone
            }));
        }
    }, [userProfile, formData.firstName]);

    const selectedCompany = companies.find(c => c.id === selectedCompanyId);
    
    // Safety check for properties
    const availableProperties = selectedCompany?.properties || [];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (field: 'services' | 'contactMethods', value: string) => {
        setFormData(prev => {
            const current = prev[field];
            const updated = current.includes(value)
                ? current.filter(item => item !== value)
                : [...current, value];
            return { ...prev, [field]: updated };
        });
    };

    const handleAIDraft = async () => {
        if (!selectedCompany) return;
        setIsGeneratingDraft(true);
        try {
            const draft = await generateNotesDraft(formData, [selectedCompany], BRANDING.companyName);
            setFormData(prev => ({ ...prev, notes: draft }));
        } catch (error) {
            console.error("AI Draft Error", error);
        } finally {
            setIsGeneratingDraft(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFiles(e.target.files);
        }
    };

    const handleFiles = (files: FileList) => {
         const newAttachments: {name: string, type: string, data: string}[] = [];
         
         Array.from(files).forEach(file => {
             if (file.size > 2 * 1024 * 1024) {
                 alert(`File ${file.name} is too large (Max 2MB)`);
                 return;
             }
             const reader = new FileReader();
             reader.onload = (e) => {
                 if (e.target?.result) {
                     newAttachments.push({
                         name: file.name,
                         type: file.type,
                         data: e.target.result as string
                     });
                     // Update state only after reading (simple batch handling)
                     if (newAttachments.length === files.length) {
                         setFormData(prev => ({ 
                             ...prev, 
                             attachments: [...(prev.attachments || []), ...newAttachments] 
                         }));
                     }
                 }
             };
             reader.readAsDataURL(file);
         });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // Find property details
        const property = availableProperties.find(p => p.id === formData.propertyId);
        
        const payload: SurveyData = {
            ...formData,
            propertyName: property?.name || 'Unknown Property',
            propertyAddress: property?.address || 'Unknown Address'
        };

        try {
            await submitSurveyData(BRANDING.defaultApiUrl, payload);
            setSubmissionStatus('success');
            // Cache form data for safety/recovery if needed
            localStorage.setItem('lastSurvey', JSON.stringify(payload));
        } catch (error) {
            console.error(error);
            setSubmissionStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setSubmissionStatus('idle');
        setFormData(prev => ({
            ...prev,
            // Keep contact info populated if userProfile exists, otherwise clear
            firstName: userProfile?.firstName || '',
            lastName: userProfile?.lastName || '',
            title: userProfile?.title || '',
            phone: userProfile?.phone || '',
            email: userProfile?.email || '',
            unitInfo: '', services: [], otherService: '', timeline: '', notes: '', attachments: []
        }));
    };

    if (submissionStatus === 'success') {
        const property = availableProperties.find(p => p.id === formData.propertyId);
        return (
            <div className={`max-w-3xl mx-auto p-8 text-center ${THEME.colors.surface} rounded-xl shadow-2xl border ${THEME.colors.borderHighlight} animate-in zoom-in duration-300 mt-10`}>
                <div className="flex justify-center mb-6">
                    <SparklesIcon className="h-16 w-16 text-bright-cyan animate-pulse" />
                </div>
                <h2 className={`text-3xl font-bold ${THEME.colors.textHighlight} mb-4`}>{t.submitSuccessTitle}</h2>
                <p className={`${THEME.colors.textMain} text-lg mb-2`}>
                   {formData.firstName}, {t.submitSuccessMessage1}
                </p>
                {property && <p className="text-slate mb-2 font-bold">{property.name}</p>}
                <p className={`${THEME.colors.textSecondary} mb-8`}>{t.submitSuccessMessage2}</p>
                
                {formData.attachments && formData.attachments.length > 0 && (
                     <div className="flex justify-center items-center gap-2 mb-8 bg-navy/50 py-2 rounded-full w-fit mx-auto px-6 border border-bright-cyan/30">
                        <CloudArrowUpIcon className="h-5 w-5 text-bright-cyan" />
                        <span className="text-bright-cyan text-sm font-bold">{t.photosUploadedBadge}</span>
                     </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button onClick={handleReset} className={`${THEME.colors.buttonSecondary} px-8 py-3 rounded-lg font-bold transition-all`}>
                        {t.submitAnotherButton}
                    </button>
                    {!embedded && (
                         <button onClick={() => window.location.hash = '#dashboard'} className={`${THEME.colors.buttonPrimary} px-8 py-3 rounded-lg font-bold shadow-lg hover:shadow-bright-cyan/20 transition-all`}>
                            {t.enterDashboardButton}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (submissionStatus === 'error') {
        return (
             <div className={`max-w-2xl mx-auto p-8 text-center ${THEME.colors.surface} rounded-xl border ${THEME.colors.borderWarning} mt-10`}>
                 <XMarkIcon className="h-16 w-16 text-bright-pink mx-auto mb-4" />
                <h2 className={`text-2xl font-bold ${THEME.colors.textWarning} mb-2`}>{t.submitErrorTitle}</h2>
                <p className={`${THEME.colors.textSecondary} mb-6`}>{t.submitErrorMessage1}</p>
                <button onClick={() => setSubmissionStatus('idle')} className={`${THEME.colors.buttonPrimary} px-6 py-2 rounded font-bold`}>
                    {t.tryAgainButton}
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className={`w-full max-w-4xl mx-auto ${embedded ? '' : 'mt-8 p-6 md:p-10'} ${THEME.colors.surface} rounded-xl ${THEME.effects.glow} border ${THEME.colors.borderSubtle}`}>
            {/* Header */}
            <div className="mb-8 border-b border-white/5 pb-4">
                <h2 className={`text-2xl font-bold ${THEME.colors.textMain}`}>{t.surveyTitle}</h2>
                <p className={`${THEME.colors.textSecondary}`}>
                     {t.surveySubtitle} <span className={`${THEME.colors.textHighlight} font-bold`}>{selectedCompany?.name || '...'}</span> {t.surveySubtitleProperties}
                </p>
            </div>

            {/* Property Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="col-span-2">
                    <label className={`block text-xs font-bold ${THEME.colors.textSecondary} uppercase tracking-wider mb-2`}>{t.propertyNameLabel}</label>
                     <select 
                        name="propertyId"
                        value={formData.propertyId}
                        onChange={handleChange}
                        required
                        className={`w-full p-3 rounded-lg border ${THEME.colors.inputBorder} ${THEME.colors.inputBg} ${THEME.colors.textMain} focus:outline-none focus:ring-2 ${THEME.colors.inputFocus}`}
                    >
                        <option value="">{t.propertySelectPlaceholder}</option>
                        {availableProperties.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6 bg-navy/30 rounded-lg border border-white/5">
                <h3 className={`col-span-2 text-sm font-bold ${THEME.colors.textHighlight} uppercase border-b border-white/5 pb-2`}>{t.contactInfoLegend}</h3>
                <input type="text" name="firstName" placeholder={t.firstNameLabel} value={formData.firstName} onChange={handleChange} required className={`p-3 rounded border ${THEME.colors.inputBorder} ${THEME.colors.inputBg} ${THEME.colors.textMain} focus:ring-1 ${THEME.colors.inputFocus}`} />
                <input type="text" name="lastName" placeholder={t.lastNameLabel} value={formData.lastName} onChange={handleChange} required className={`p-3 rounded border ${THEME.colors.inputBorder} ${THEME.colors.inputBg} ${THEME.colors.textMain} focus:ring-1 ${THEME.colors.inputFocus}`} />
                <input type="tel" name="phone" placeholder={t.phoneLabel} value={formData.phone} onChange={handleChange} required className={`p-3 rounded border ${THEME.colors.inputBorder} ${THEME.colors.inputBg} ${THEME.colors.textMain} focus:ring-1 ${THEME.colors.inputFocus}`} />
                <input type="email" name="email" placeholder={t.emailLabel} value={formData.email} onChange={handleChange} required className={`p-3 rounded border ${THEME.colors.inputBorder} ${THEME.colors.inputBg} ${THEME.colors.textMain} focus:ring-1 ${THEME.colors.inputFocus}`} />
                <div className="col-span-2">
                     <p className={`text-xs ${THEME.colors.textSecondary} mb-2 uppercase font-bold`}>{t.contactMethodLegend}</p>
                     <div className="flex flex-wrap gap-4">
                        {t.CONTACT_METHODS.map(method => (
                            <label key={method} className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                                <input 
                                    type="checkbox"
                                    checked={formData.contactMethods.includes(method)}
                                    onChange={() => handleCheckboxChange('contactMethods', method)}
                                    className="rounded border-slate bg-navy text-bright-cyan focus:ring-0" 
                                />
                                <span className={`text-sm ${THEME.colors.textSecondary}`}>{method}</span>
                            </label>
                        ))}
                     </div>
                </div>
            </div>

            {/* Scope & Details */}
            <div className="mb-8 space-y-6">
                <h3 className={`text-sm font-bold ${THEME.colors.textHighlight} uppercase border-b border-white/5 pb-2`}>{t.scopeTimelineLegend}</h3>
                
                {/* Unit Info */}
                <div>
                     <label className={`block text-xs font-bold ${THEME.colors.textSecondary} mb-2`}>{t.unitInfoLabel}</label>
                     <input type="text" name="unitInfo" placeholder={t.unitInfoPlaceholder} value={formData.unitInfo} onChange={handleChange} className={`w-full p-3 rounded border ${THEME.colors.inputBorder} ${THEME.colors.inputBg} ${THEME.colors.textMain} focus:ring-1 ${THEME.colors.inputFocus}`} />
                </div>

                {/* Services Checkboxes */}
                <div>
                    <label className={`block text-xs font-bold ${THEME.colors.textSecondary} mb-3`}>{t.serviceNeededLabel}</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {t.SERVICES.map(service => (
                            <label key={service} className={`flex items-center gap-3 p-3 rounded border ${formData.services.includes(service) ? `${THEME.colors.borderHighlight} bg-bright-cyan/5` : 'border-white/5 bg-navy/50'} cursor-pointer hover:bg-navy transition-colors`}>
                                <input 
                                    type="checkbox"
                                    checked={formData.services.includes(service)}
                                    onChange={() => handleCheckboxChange('services', service)}
                                    className="rounded border-slate bg-navy text-bright-cyan w-5 h-5 focus:ring-0"
                                />
                                <span className={`${THEME.colors.textMain}`}>{service}</span>
                            </label>
                        ))}
                    </div>
                    {formData.services.some(s => s.includes('Other')) && (
                        <input type="text" name="otherService" placeholder={t.otherServicePlaceholder} value={formData.otherService} onChange={handleChange} className={`mt-3 w-full p-2 rounded text-sm ${THEME.colors.inputBg} ${THEME.colors.textMain} border ${THEME.colors.borderSubtle}`} />
                    )}
                </div>

                {/* Timeline Dropdown */}
                <div>
                     <label className={`block text-xs font-bold ${THEME.colors.textSecondary} mb-2`}>{t.timelineLabel}</label>
                     <select name="timeline" value={formData.timeline} onChange={handleChange} className={`w-full p-3 rounded border ${THEME.colors.inputBorder} ${THEME.colors.inputBg} ${THEME.colors.textMain} focus:ring-1 ${THEME.colors.inputFocus}`}>
                         <option value="">{t.timelineSelectPlaceholder}</option>
                         {t.TIMELINES.map(tl => <option key={tl} value={tl}>{tl}</option>)}
                     </select>
                </div>

                {/* Photo Upload */}
                <div className="border border-dashed border-slate/30 rounded-lg p-6 text-center transition-colors hover:border-bright-cyan/50 hover:bg-navy/30"
                     onDragEnter={() => setDragActive(true)}
                     onDragLeave={() => setDragActive(false)}
                     onDragOver={(e) => e.preventDefault()}
                     onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
                >
                    <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <CloudArrowUpIcon className="h-10 w-10 text-slate" />
                        <span className={`text-sm ${THEME.colors.textMain} font-bold`}>{t.photosLabel}</span>
                        <span className="text-xs text-slate">{t.dragDropText}</span>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*" className="hidden" />
                    </div>
                    {formData.attachments && formData.attachments.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2 justify-center">
                            {formData.attachments.map((file, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-navy px-3 py-1 rounded border border-white/10 text-xs">
                                    <span className="text-bright-cyan max-w-[150px] truncate">{file.name}</span>
                                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, attachments: prev.attachments?.filter((_, i) => i !== idx) }))} className="text-bright-pink hover:text-white">
                                        <XMarkIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <p className="mt-2 text-[10px] text-slate opacity-50">{t.photosPermissionHint}</p>
                </div>

                {/* Notes & AI Draft */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className={`text-xs font-bold ${THEME.colors.textSecondary}`}>{t.notesLabel}</label>
                        <button type="button" onClick={handleAIDraft} disabled={isGeneratingDraft} className={`text-xs flex items-center gap-1 ${THEME.colors.textHighlight} hover:text-white transition-colors`}>
                            {isGeneratingDraft ? <LoadingSpinner /> : <SparklesIcon className="h-4 w-4" />}
                            {isGeneratingDraft ? t.generatingButton : t.generateAIDraftButton}
                        </button>
                    </div>
                    <textarea name="notes" rows={4} placeholder={t.notesPlaceholder} value={formData.notes} onChange={handleChange} className={`w-full p-3 rounded border ${THEME.colors.inputBorder} ${THEME.colors.inputBg} ${THEME.colors.textMain} focus:ring-1 ${THEME.colors.inputFocus}`} />
                </div>
            </div>

            <button type="submit" disabled={isSubmitting} className={`w-full py-4 rounded-lg font-bold text-lg shadow-lg tracking-wide transition-all ${isSubmitting ? 'opacity-70 cursor-wait' : `${THEME.colors.buttonPrimary} hover:scale-[1.01] hover:shadow-bright-cyan/25`}`}>
                {isSubmitting ? t.submittingButton : t.submitButton}
            </button>
        </form>
    );
};

// --- Client Dashboard (For Property Managers) ---
// STRICTLY NO ESTIMATING MODULE
const ClientDashboard: React.FC<{ user: UserSession; onLogout: () => void; lang: 'en' | 'es'; setLang: (l: 'en' | 'es') => void }> = ({ user, onLogout, lang, setLang }) => {
    const t = translations[lang];
    const [activeTab, setActiveTab] = useState('overview');
    
    // Safety: Ensure we have a valid company object
    if (!user.company) {
        return <div className="p-10 text-center text-white">Loading Portal Data...</div>;
    }

    const firstProp = user.company.properties[0];
    const dynamicTitle = firstProp ? firstProp.name : user.company.name;
    const dynamicSubtitle = firstProp ? user.company.name : '';

    return (
        <div className={`min-h-screen ${THEME.colors.background} flex flex-col`}>
             <Header 
                lang={lang} 
                setLang={setLang} 
                customTitle={dynamicTitle}
                customSubtitle={dynamicSubtitle}
            />
            <div className="flex flex-1">
                {/* Sidebar */}
                <aside className={`w-64 ${THEME.colors.surface} border-r ${THEME.colors.borderSubtle} hidden md:flex flex-col`}>
                    <div className="p-6 border-b border-white/5">
                        <h2 className={`text-xl font-bold ${THEME.colors.textMain} tracking-wider`}>{t.dashboardLoginTitle}</h2>
                        <p className={`text-xs ${THEME.colors.textHighlight} mt-1 truncate`}>{user.company.name}</p>
                        <p className="text-[10px] text-slate uppercase tracking-widest mt-1">
                            {user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : t.roleSiteManager}
                        </p>
                    </div>
                    <nav className="flex-1 p-4 space-y-2">
                        {[
                            { id: 'overview', label: t.tabOverview, icon: DashboardIcon },
                            { id: 'request', label: t.tabNewRequest, icon: ClipboardListIcon },
                            { id: 'projects', label: t.tabProjects, icon: BuildingBlocksIcon }, // Client Mode PM
                            { id: 'gallery', label: t.tabGallery, icon: PhotoIcon },
                            { id: 'history', label: t.tabHistory, icon: ClockIcon },
                        ].map(item => (
                            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-colors ${activeTab === item.id ? `${THEME.colors.buttonSecondary}` : `${THEME.colors.textSecondary} hover:text-white hover:bg-white/5`}`}>
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </button>
                        ))}
                    </nav>
                    <div className="p-4 border-t border-white/5">
                        <button onClick={onLogout} className={`w-full flex items-center gap-3 px-4 py-3 text-bright-pink hover:bg-bright-pink/10 rounded transition-colors`}>
                            <LogoutIcon className="h-5 w-5" />
                            {t.logout}
                        </button>
                    </div>
                </aside>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-6 md:p-10">
                    {activeTab === 'overview' && (
                        <div className="animate-in fade-in duration-300">
                            <h1 className={`text-3xl font-bold ${THEME.colors.textMain} mb-2`}>{t.tabOverview}</h1>
                            <p className={`${THEME.colors.textSecondary} mb-8`}>
                                Welcome back, <span className="text-white font-bold">{user.profile?.firstName || 'Manager'}</span>. Here is what is happening at <span className="text-white font-bold">{user.company.name}</span>.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className={`${THEME.colors.surface} p-6 rounded-xl border ${THEME.colors.borderSubtle}`}>
                                    <h3 className={`text-sm ${THEME.colors.textSecondary} uppercase tracking-wider mb-2`}>{t.statsActive}</h3>
                                    <p className={`text-4xl font-bold ${THEME.colors.textHighlight}`}>3</p>
                                </div>
                                <div className={`${THEME.colors.surface} p-6 rounded-xl border ${THEME.colors.borderSubtle}`}>
                                    <h3 className={`text-sm ${THEME.colors.textSecondary} uppercase tracking-wider mb-2`}>{t.statsCompleted}</h3>
                                    <p className={`text-4xl font-bold text-white`}>12</p>
                                </div>
                                <div className={`${THEME.colors.surface} p-6 rounded-xl border ${THEME.colors.borderSubtle}`}>
                                    <h3 className={`text-sm ${THEME.colors.textSecondary} uppercase tracking-wider mb-2`}>{t.statsPending}</h3>
                                    <p className={`text-4xl font-bold ${THEME.colors.textWarning}`}>1</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'request' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <Survey 
                                companies={[user.company]} 
                                isInternal={false} 
                                embedded 
                                userProfile={user.profile} 
                                lang={lang}
                            />
                        </div>
                    )}

                    {activeTab === 'projects' && (
                        <ProjectManagementModule mode="client" />
                    )}

                    {activeTab === 'gallery' && (
                        <div className="animate-in fade-in duration-300 text-center py-20">
                            <PhotoIcon className="h-20 w-20 text-slate mx-auto mb-4 opacity-20" />
                            <h2 className={`text-xl font-bold ${THEME.colors.textMain}`}>Photo Gallery</h2>
                            <p className="text-slate">Your project photos will appear here after sync.</p>
                        </div>
                    )}
                    {activeTab === 'history' && (
                        <div className="animate-in fade-in duration-300 text-center py-20">
                            <ClockIcon className="h-20 w-20 text-slate mx-auto mb-4 opacity-20" />
                            <h2 className={`text-xl font-bold ${THEME.colors.textMain}`}>History</h2>
                            <p className="text-slate">Past requests log.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

// --- Company Dashboard (For Jes Stone Admins) ---
// FULL ACCESS INCLUDING ESTIMATING & DATA SOURCES
const CompanyDashboard: React.FC<{ user: UserSession; onLogout: () => void; lang: 'en' | 'es'; setLang: (l: 'en' | 'es') => void }> = ({ user, onLogout, lang, setLang }) => {
    const t = translations[lang];
    const [activeTab, setActiveTab] = useState('overview');
    const [testStatus, setTestStatus] = useState<string>('');

    const handleTestChat = async () => {
        setTestStatus('Sending ping...');
        try {
            await sendTestChat(BRANDING.defaultApiUrl);
            setTestStatus('Success! Check Google Chat.');
            setTimeout(() => setTestStatus(''), 5000);
        } catch (e) {
            setTestStatus('Failed. Check console.');
        }
    };

    return (
        <div className={`min-h-screen ${THEME.colors.background} flex flex-col`}>
             <Header 
                lang={lang} 
                setLang={setLang} 
                customTitle={t.companyPortalTitle}
                customSubtitle={t.companyPortalSubtitle}
            />
            <div className="flex flex-1">
                <aside className={`w-64 bg-black/40 border-r ${THEME.colors.borderHighlight} hidden md:flex flex-col`}>
                    <div className="p-6 border-b border-white/10">
                        <h2 className={`text-xl font-bold ${THEME.colors.textHighlight} tracking-wider`}>{t.companyPortalTitle}</h2>
                        <p className={`text-xs ${THEME.colors.textSecondary} mt-1`}>{t.companyPortalSubtitle}</p>
                    </div>
                    <nav className="flex-1 p-4 space-y-2">
                        {[
                            { id: 'overview', label: 'Command Center', icon: DashboardIcon },
                            { id: 'data', label: t.tabDataSources, icon: ChartBarIcon },
                            { id: 'estimating', label: t.tabEstimating, icon: CalculatorIcon }, // ADMIN ONLY
                            { id: 'projects', label: 'Global Projects', icon: BuildingBlocksIcon },
                        ].map(item => (
                            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-colors ${activeTab === item.id ? `${THEME.colors.buttonPrimary}` : `${THEME.colors.textSecondary} hover:text-white hover:bg-white/5`}`}>
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </button>
                        ))}
                    </nav>
                    <div className="p-4 border-t border-white/10">
                        <button onClick={onLogout} className={`w-full flex items-center gap-3 px-4 py-3 text-slate hover:text-white hover:bg-white/5 rounded transition-colors`}>
                            <LogoutIcon className="h-5 w-5" />
                            {t.logout}
                        </button>
                    </div>
                </aside>

                <main className="flex-1 overflow-y-auto p-6 md:p-10">
                    {activeTab === 'overview' && (
                        <div className="animate-in fade-in duration-300">
                            <h1 className={`text-3xl font-bold ${THEME.colors.textMain} mb-8`}>Global Overview</h1>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className={`${THEME.colors.surface} p-6 rounded-xl border ${THEME.colors.borderSubtle}`}>
                                    <h3 className="text-bright-cyan font-bold mb-2">Total Active Projects</h3>
                                    <p className="text-5xl font-bold text-white">15</p>
                                </div>
                                <div className={`${THEME.colors.surface} p-6 rounded-xl border ${THEME.colors.borderSubtle}`}>
                                    <h3 className="text-bright-pink font-bold mb-2">Pending Estimates</h3>
                                    <p className="text-5xl font-bold text-white">4</p>
                                </div>
                                {/* SYSTEM STATUS CARD */}
                                <div className={`${THEME.colors.surface} p-6 rounded-xl border ${THEME.colors.borderSubtle}`}>
                                    <h3 className="text-white font-bold mb-2">{t.systemStatusTitle}</h3>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
                                        <span className="text-sm text-slate">API Online</span>
                                    </div>
                                    <button onClick={handleTestChat} className="text-xs bg-navy border border-bright-cyan text-bright-cyan px-3 py-2 rounded hover:bg-bright-cyan/10 transition-colors w-full">
                                        {t.testChatButton}
                                    </button>
                                    {testStatus && <p className="text-xs mt-2 text-center text-bright-cyan">{testStatus}</p>}
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'data' && (
                        <div className="animate-in fade-in duration-300">
                            <h1 className={`text-2xl font-bold ${THEME.colors.textMain} mb-6`}>{t.dataSourcesTitle}</h1>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <a href="https://docs.google.com/spreadsheets/u/0/" target="_blank" rel="noreferrer" className={`${THEME.colors.surface} p-8 rounded-xl border ${THEME.colors.borderSubtle} hover:border-green-400 group transition-all`}>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="bg-green-500/20 p-3 rounded-lg"><ClipboardListIcon className="h-8 w-8 text-green-400" /></div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg">{t.googleSheetLabel}</h3>
                                            <p className="text-slate text-sm">View all raw survey responses</p>
                                        </div>
                                    </div>
                                    <span className="text-green-400 font-bold text-sm group-hover:underline">{t.openSheetButton} &rarr;</span>
                                </a>
                                <a href="https://drive.google.com/drive/u/0/" target="_blank" rel="noreferrer" className={`${THEME.colors.surface} p-8 rounded-xl border ${THEME.colors.borderSubtle} hover:border-blue-400 group transition-all`}>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="bg-blue-500/20 p-3 rounded-lg"><PhotoIcon className="h-8 w-8 text-blue-400" /></div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg">{t.googleDriveLabel}</h3>
                                            <p className="text-slate text-sm">Access photo repository</p>
                                        </div>
                                    </div>
                                    <span className="text-blue-400 font-bold text-sm group-hover:underline">{t.openDriveButton} &rarr;</span>
                                </a>
                            </div>
                        </div>
                    )}
                    {activeTab === 'estimating' && <EstimatingModule />}
                    {activeTab === 'projects' && <ProjectManagementModule mode="company" />}
                </main>
            </div>
        </div>
    );
};


// --- LOGIN COMPONENT ---
const DashboardLogin: React.FC<{ onLogin: (code: string) => void, error?: string, lang: 'en' | 'es' }> = ({ onLogin, error, lang }) => {
    const [code, setCode] = useState('');
    const t = translations[lang];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(code.toUpperCase());
    };

    return (
        <div className={`min-h-screen ${THEME.colors.background} flex flex-col items-center justify-center p-4`}>
            <div className={`w-full max-w-md ${THEME.colors.surface} p-8 rounded-2xl border ${THEME.colors.borderHighlight} ${THEME.effects.glow} text-center`}>
                <div className="bg-navy/50 p-4 rounded-full w-fit mx-auto mb-6 border border-bright-cyan">
                    <LockClosedIcon className="h-8 w-8 text-bright-cyan" />
                </div>
                <h1 className={`text-2xl font-bold ${THEME.colors.textMain} mb-2`}>{t.dashboardLoginTitle}</h1>
                <p className={`${THEME.colors.textSecondary} mb-8`}>{t.dashboardLoginSubtitle}</p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="text-left">
                        <label className={`block text-xs font-bold ${THEME.colors.textSecondary} uppercase tracking-wider mb-2 ml-1`}>{t.accessCodeLabel}</label>
                        <input 
                            type="text" 
                            value={code} 
                            onChange={(e) => setCode(e.target.value)} 
                            placeholder="Enter Code..."
                            className={`w-full p-4 rounded-lg bg-navy border ${THEME.colors.inputBorder} ${THEME.colors.textHighlight} text-center text-xl font-bold tracking-[0.2em] focus:ring-2 ${THEME.colors.inputFocus} outline-none placeholder:text-slate/20`}
                        />
                    </div>
                    {error && <p className="text-bright-pink text-sm font-bold animate-pulse">{error}</p>}
                    <button 
                        type="submit" 
                        disabled={!code}
                        className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${!code ? `${THEME.colors.buttonSecondary} opacity-50 cursor-not-allowed` : `${THEME.colors.buttonPrimary} shadow-lg hover:shadow-bright-cyan/25`}`}
                    >
                        {t.loginButton}
                    </button>
                </form>

                <div className="mt-8 pt-8 border-t border-white/5 text-xs text-slate">
                    <p className="mb-2 font-bold opacity-50">Demo Codes:</p>
                    <p className="mb-2"><span className="text-bright-cyan font-bold cursor-pointer hover:underline text-sm border border-bright-cyan/30 px-2 py-1 rounded bg-navy" onClick={() => setCode('ADMIN')}>ADMIN</span> <span className="ml-2">(Jes Stone Internal)</span></p>
                    <p><span className="text-bright-cyan cursor-pointer hover:underline" onClick={() => setCode('PARKPLACE')}>PARKPLACE</span> (Property)</p>
                    <p><span className="text-bright-cyan cursor-pointer hover:underline" onClick={() => setCode('REGION1')}>REGION1</span> (Regional)</p>
                    
                    <button onClick={() => window.location.hash = ''} className="mt-6 text-white hover:underline opacity-50">
                        {t.returnHomeButton}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- CHAT WIDGET ---
const ChatWidget: React.FC<{ lang: 'en' | 'es' }> = ({ lang }) => {
    const t = translations[lang];
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const chatSession = useRef<Chat | null>(null);

    // Initialize Chat
    useEffect(() => {
        if (!chatSession.current) {
            chatSession.current = createChatSession();
        }
    }, []);

    const handleSend = async () => {
        if (!input.trim() || !chatSession.current) return;
        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsThinking(true);

        try {
            const result: GenerateContentResponse = await chatSession.current.sendMessage({ message: userMsg });
            const text = result.text || "";
            setMessages(prev => [...prev, { role: 'model', text }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting right now." }]);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {isOpen && (
                <div className={`mb-4 w-80 h-96 ${THEME.colors.surface} border ${THEME.colors.borderHighlight} rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300`}>
                    <div className="bg-navy p-4 border-b border-white/10 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                             <SparklesIcon className="h-4 w-4 text-bright-cyan" />
                             <h3 className={`font-bold ${THEME.colors.textMain}`}>{t.chatTitle}</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate hover:text-white"><XMarkIcon className="h-5 w-5" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center text-slate text-sm mt-10">
                                <p>Hello! I am the {BRANDING.assistantName}.</p>
                                <p className="text-xs mt-2">How can I help you today?</p>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-bright-cyan text-navy rounded-br-none' : 'bg-navy text-slate rounded-bl-none'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isThinking && <div className="text-xs text-slate animate-pulse ml-2">Thinking...</div>}
                    </div>
                    <div className="p-3 bg-navy border-t border-white/10 flex gap-2">
                        <input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={t.chatPlaceholder}
                            className={`flex-1 bg-black/20 border border-white/10 rounded px-3 py-2 text-sm ${THEME.colors.textMain} focus:outline-none focus:border-bright-cyan`}
                        />
                        <button onClick={handleSend} disabled={!input || isThinking} className="text-bright-cyan disabled:opacity-50 hover:scale-110 transition-transform">
                            <PaperAirplaneIcon className="h-5 w-5 rotate-90" />
                        </button>
                    </div>
                </div>
            )}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`${THEME.colors.buttonPrimary} p-4 rounded-full shadow-[0_0_20px_rgba(100,255,218,0.3)] hover:scale-110 transition-transform`}
            >
                {isOpen ? <XMarkIcon className="h-6 w-6" /> : <ChatBubbleIcon className="h-6 w-6" />}
            </button>
        </div>
    );
};

// --- MAIN APP ---
function App() {
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const t = translations[lang];
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [loginError, setLoginError] = useState('');
  
  // Routes: '' (Public Survey), '#dashboard' (Client Portal)
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
      const handleHashChange = () => setRoute(window.location.hash);
      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Handle Login Logic
  const handleLogin = (code: string) => {
      const access = MOCK_ACCESS_DB[code];
      if (access) {
          // Construct User Session based on Access Code
          const session: UserSession = {
              role: access.role,
              allowedPropertyIds: access.allowedPropertyIds,
              profile: access.profile,
              company: {
                  id: access.companyId,
                  // Simulate fetching company name based on ID (In real app this comes from API)
                  name: access.companyId === 'knightvest' ? 'Knightvest' : access.companyId === 'internal' ? 'Jes Stone' : 'Unknown',
                  // Pre-fill properties for demo codes so dashboard works immediately
                  properties: access.allowedPropertyIds.map(id => {
                      if (id === 'kv-1') return { id: 'kv-1', name: 'The Arts at Park Place', address: '1301 W Park Blvd' };
                      if (id === 'kv-2') return { id: 'kv-2', name: 'Canyon Creek', address: '5000 W Plano Pkwy' };
                      return { id, name: 'Unknown Property', address: '' };
                  })
              }
          };
          setCurrentUser(session);
          setLoginError('');
      } else {
          setLoginError('Invalid Access Code');
      }
  };

  const handleLogout = () => {
      setCurrentUser(null);
      window.location.hash = '';
  };

  // --- ROUTING LOGIC ---
  
  // 1. Dashboard Route
  if (route === '#dashboard') {
      if (!currentUser) {
          return <DashboardLogin onLogin={handleLogin} error={loginError} lang={lang} />;
      }
      
      // Strict Separation: Admin vs Client
      if (currentUser.role === 'internal_admin') {
          return <CompanyDashboard user={currentUser} onLogout={handleLogout} lang={lang} setLang={setLang} />;
      } else {
          return <ClientDashboard user={currentUser} onLogout={handleLogout} lang={lang} setLang={setLang} />;
      }
  }

  // 2. Default Route (Public Landing / Survey)
  return (
    <ErrorBoundary>
        <div className={`min-h-screen ${THEME.colors.background} font-sans selection:bg-bright-cyan selection:text-navy`}>
          <Header surveyUrl="#/" lang={lang} setLang={setLang} />

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Hero Section */}
            <div className="text-center mb-12 animate-in slide-in-from-bottom-8 duration-700">
                <h1 className={`text-4xl md:text-6xl font-extrabold ${THEME.colors.textMain} mb-4 tracking-tight ${THEME.effects.glowText}`}>
                    {BRANDING.companyName}
                </h1>
                <p className={`text-xl ${THEME.colors.textHighlight} font-medium tracking-widest uppercase`}>
                    {BRANDING.companySubtitle}
                </p>
            </div>

            {/* Campaign Selector / Landing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="order-2 md:order-1 animate-in slide-in-from-left duration-700 delay-100">
                    <Survey 
                        companies={[{id: 'knightvest', name: 'Knightvest', properties: [{id: 'kv-1', name: 'The Arts at Park Place', address: '1301 W Park Blvd'}]}]} 
                        isInternal={false}
                        lang={lang}
                    />
                </div>
                
                <div className="order-1 md:order-2 flex flex-col justify-center h-full space-y-8 animate-in slide-in-from-right duration-700 delay-200">
                    <div className={`${THEME.colors.surface} p-8 rounded-2xl border ${THEME.colors.borderHighlight} ${THEME.effects.glow}`}>
                        <h2 className={`text-2xl font-bold ${THEME.colors.textMain} mb-4`}>Property Manager Portal</h2>
                        <p className={`${THEME.colors.textSecondary} mb-6`}>
                            Track your requests, view project photos, and manage approvals in one secure place.
                        </p>
                        <button 
                            onClick={() => window.location.hash = '#dashboard'}
                            className={`w-full flex items-center justify-center gap-3 ${THEME.colors.buttonSecondary} py-4 rounded-lg font-bold text-lg transition-all`}
                        >
                            <LockClosedIcon className="h-6 w-6" />
                            {t.enterDashboardButton}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className={`${THEME.colors.surface} p-4 rounded-lg border ${THEME.colors.borderSubtle} text-center`}>
                            <ClockIcon className="h-8 w-8 text-bright-blue mx-auto mb-2" />
                            <h3 className={`font-bold ${THEME.colors.textMain}`}>Fast Turnaround</h3>
                            <p className="text-xs text-slate">24h Response Time</p>
                        </div>
                         <div className={`${THEME.colors.surface} p-4 rounded-lg border ${THEME.colors.borderSubtle} text-center`}>
                            <SparklesIcon className="h-8 w-8 text-bright-pink mx-auto mb-2" />
                            <h3 className={`font-bold ${THEME.colors.textMain}`}>Quality First</h3>
                            <p className="text-xs text-slate">Top-Tier Materials</p>
                        </div>
                    </div>
                </div>
            </div>
          </main>

          <Footer />
          <ChatWidget lang={lang} />
        </div>
    </ErrorBoundary>
  );
}

export default App;
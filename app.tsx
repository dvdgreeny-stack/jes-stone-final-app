import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { generateNotesDraft, createChatSession } from './services/geminiService';
import { fetchCompanyData, submitSurveyData, sendTestChat, fetchSurveyHistory } from './services/apiService';
import { translations } from './translations';
import { BRANDING } from './branding';
import { THEME } from './theme';
import type { Company, SurveyData, UserSession, UserRole, UserProfile, HistoryEntry } from './types';
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
    'DEMO': { 
        role: 'site_manager', 
        companyId: 'knightvest', 
        allowedPropertyIds: ['kv-1'],
        profile: {
            firstName: 'Demo',
            lastName: 'User',
            title: 'Site Manager',
            email: 'demo@example.com',
            phone: '555-0123'
        }
    }, 
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

// --- HELPER: Convert Drive Link to Image Src ---
const getDirectImageUrl = (url: string) => {
    // Converts Google Drive Viewer URL to a Direct Image URL for <img> tags
    try {
        if (url.includes('drive.google.com') && url.includes('/d/')) {
            // Extract ID
            const id = url.split('/d/')[1].split('/')[0];
            // Use Google's export=view endpoint which acts as an image source
            return `https://drive.google.com/uc?export=view&id=${id}`;
        }
        return url;
    } catch (e) {
        return url;
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
    const title = customTitle || BRANDING.companyName;
    const subtitle = customSubtitle || BRANDING.companySubtitle;

    return (
        <header className={`${THEME.colors.surface}/90 backdrop-blur-md sticky top-0 z-20 shadow-lg border-b ${THEME.colors.borderSubtle}`}>
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                <a href={surveyUrl || "#/"} onClick={handleNav} className="flex items-center gap-4 group">
                    {BRANDING.logoUrl ? (
                        <img src={BRANDING.logoUrl} alt={`${BRANDING.companyName} Logo`} className="h-12 w-auto object-contain" />
                    ) : (
                        <JesStoneLogo className="h-10 w-auto group-hover:scale-105 transition-transform" />
                    )}
                    <div className="flex flex-col">
                        <span className={`text-xl font-extrabold ${THEME.colors.textMain} tracking-widest leading-none uppercase ${THEME.effects.glowText}`}>
                            {title}
                        </span>
                        <span className={`text-xs ${THEME.colors.textHighlight} font-bold tracking-widest uppercase mt-1`}>
                            {subtitle}
                        </span>
                    </div>
                </a>
                
                <button
                    onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${THEME.colors.borderSubtle} ${THEME.colors.surfaceHighlight} hover:border-bright-cyan transition-all`}
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
            <div className={`inline-block ${THEME.colors.surface} p-4 rounded-lg text-left shadow-lg border border-white/5`}>
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

// --- Survey Component ---
interface SurveyProps {
    companies: Company[];
    isInternal?: boolean;
    embedded?: boolean;
    userProfile?: UserProfile;
    lang: 'en' | 'es';
    onSelectionChange?: (propertyName: string, companyName: string) => void;
}

const Survey: React.FC<SurveyProps> = ({ companies, isInternal, embedded, userProfile, lang, onSelectionChange }) => {
    const t = translations[lang];
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    
    // Initialize form data - USE PROFILE DIRECTLY to prevent flash of empty state
    const [formData, setFormData] = useState<SurveyData>(() => ({
        propertyId: '', 
        firstName: userProfile?.firstName || '', 
        lastName: userProfile?.lastName || '', 
        title: userProfile?.title || '', 
        phone: userProfile?.phone || '', 
        email: userProfile?.email || '',
        unitInfo: '', services: [], otherService: '', timeline: '', notes: '', contactMethods: [], attachments: []
    }));

    // Effect to forcibly re-apply profile data when component mounts or userProfile changes
    // This fixes the "Autofill failed" issue by ensuring state syncs even after resets
    useEffect(() => {
        if (userProfile) {
            setFormData(prev => ({
                ...prev,
                firstName: userProfile.firstName,
                lastName: userProfile.lastName,
                title: userProfile.title,
                phone: userProfile.phone,
                email: userProfile.email
            }));
        }
    }, [userProfile]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 1. Auto-select company if only one
    useEffect(() => {
        if (companies.length === 1) {
            setSelectedCompanyId(companies[0].id);
        }
    }, [companies]);

    const selectedCompany = companies.find(c => c.id === selectedCompanyId);
    const availableProperties = selectedCompany?.properties || [];

    // 2. Auto-select property if only one available
    useEffect(() => {
        if (availableProperties.length === 1) {
             const prop = availableProperties[0];
             // Only update if not already set to avoid loops
             if (formData.propertyId !== prop.id) {
                 setFormData(prev => ({ ...prev, propertyId: prop.id }));
             }
             // Trigger header update immediately
             if (onSelectionChange && selectedCompany) {
                 onSelectionChange(prop.name, selectedCompany.name);
             }
        }
    }, [availableProperties, formData.propertyId, selectedCompany, onSelectionChange]);

    // Notify parent when property is manually selected to update branding
    useEffect(() => {
        if (formData.propertyId && selectedCompany) {
            const prop = availableProperties.find(p => p.id === formData.propertyId);
            if (prop && onSelectionChange) {
                onSelectionChange(prop.name, selectedCompany.name);
            }
        }
    }, [formData.propertyId, selectedCompany, availableProperties, onSelectionChange]);


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
        
        const property = availableProperties.find(p => p.id === formData.propertyId);
        
        const payload: SurveyData = {
            ...formData,
            // Sanitize string fields to avoid undefined errors in backend
            unitInfo: formData.unitInfo || 'N/A',
            notes: formData.notes || 'N/A',
            propertyName: property?.name || 'Unknown Property',
            propertyAddress: property?.address || 'Unknown Address'
        };

        try {
            await submitSurveyData(BRANDING.defaultApiUrl, payload);
            setSubmissionStatus('success');
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
        setFormData({
            propertyId: availableProperties.length === 1 ? availableProperties[0].id : '',
            // Re-apply profile data immediately on reset
            firstName: userProfile?.firstName || '',
            lastName: userProfile?.lastName || '',
            title: userProfile?.title || '',
            phone: userProfile?.phone || '',
            email: userProfile?.email || '',
            unitInfo: '', services: [], otherService: '', timeline: '', notes: '', contactMethods: [], attachments: []
        });
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
                    {!embedded ? (
                        <button onClick={() => window.location.hash = '#dashboard'} className={`${THEME.colors.buttonPrimary} px-8 py-3 rounded-lg font-bold shadow-lg hover:shadow-bright-cyan/20 transition-all`}>
                            {t.enterDashboardButton}
                        </button>
                    ) : (
                         <button onClick={handleReset} className={`${THEME.colors.buttonPrimary} px-8 py-3 rounded-lg font-bold shadow-lg hover:shadow-bright-cyan/20 transition-all`}>
                            New Request
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

    // Dynamic Header Text logic (If logged in, show Company Name)
    const formHeader = selectedCompany?.name ? `For ${selectedCompany.name} Properties` : t.surveyTitle;

    return (
        <form onSubmit={handleSubmit} className={`w-full max-w-4xl mx-auto ${embedded ? '' : 'mt-8 p-6 md:p-10'} ${THEME.colors.surface} rounded-xl ${THEME.effects.glow} border ${THEME.colors.borderSubtle}`}>
            {/* Header */}
            <div className="mb-8 border-b border-white/5 pb-4">
                <h2 className={`text-2xl font-bold ${THEME.colors.textMain}`}>{formHeader}</h2>
                {selectedCompany?.name && (
                     <p className={`${THEME.colors.textSecondary} text-sm mt-1`}>
                        Please fill out the details below for your service request.
                     </p>
                )}
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
const ClientDashboard: React.FC<{ user: UserSession; onLogout: () => void; lang: 'en' | 'es'; setLang: (l: 'en' | 'es') => void }> = ({ user, onLogout, lang, setLang }) => {
    const t = translations[lang];
    const [activeTab, setActiveTab] = useState('overview');
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    
    // Header State lifted for dashboard
    const [headerTitle, setHeaderTitle] = useState('');
    const [headerSubtitle, setHeaderSubtitle] = useState('');

    useEffect(() => {
        if (user.company.properties.length > 0) {
            setHeaderTitle(user.company.properties[0].name);
            setHeaderSubtitle(user.company.name);
        } else {
            setHeaderTitle(user.company.name);
            setHeaderSubtitle('Client Portal');
        }
    }, [user]);

    // Update Header when Survey selects a property
    const handleSurveySelection = (propName: string, compName: string) => {
        if (propName) {
            setHeaderTitle(propName);
            setHeaderSubtitle(compName);
        }
    };

    // Fetch History when tab changes
    useEffect(() => {
        if (activeTab === 'history' || activeTab === 'gallery') {
            const propertyName = user.company.properties[0]?.name;
            if (propertyName) {
                setLoadingHistory(true);
                fetchSurveyHistory(BRANDING.defaultApiUrl, propertyName)
                    .then(data => setHistory(data))
                    .catch(err => console.error(err))
                    .finally(() => setLoadingHistory(false));
            }
        }
    }, [activeTab, user]);

    if (!user.company) return <div className="p-10 text-center text-white">Loading Portal Data...</div>;

    // Collect all photos from history for Gallery View
    const allPhotos = history.flatMap(entry => entry.photos);

    return (
        <div className={`min-h-screen ${THEME.colors.background} flex flex-col`}>
             <Header 
                lang={lang} 
                setLang={setLang} 
                customTitle={headerTitle}
                customSubtitle={headerSubtitle}
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
                            { id: 'projects', label: t.tabProjects, icon: BuildingBlocksIcon }, 
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
                                onSelectionChange={handleSurveySelection}
                            />
                        </div>
                    )}

                    {activeTab === 'projects' && (
                        <ProjectManagementModule mode="client" />
                    )}

                    {activeTab === 'gallery' && (
                        <div className="animate-in fade-in duration-300">
                            <h2 className={`text-2xl font-bold ${THEME.colors.textMain} mb-2`}>{t.galleryTitle}</h2>
                            <p className={`${THEME.colors.textSecondary} mb-8`}>{t.gallerySubtitle}</p>
                            
                            {loadingHistory ? (
                                <div className="flex justify-center p-20"><LoadingSpinner /></div>
                            ) : allPhotos.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {allPhotos.map((url, i) => {
                                        const directUrl = getDirectImageUrl(url);
                                        return (
                                            <a key={i} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-white/10 hover:border-bright-cyan transition-colors group relative aspect-square">
                                                <img 
                                                  src={directUrl} 
                                                  alt={`Project Photo ${i}`} 
                                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                                  referrerPolicy="no-referrer"
                                                />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <span className="text-white text-xs font-bold uppercase tracking-wider border border-white px-2 py-1 rounded">View</span>
                                                </div>
                                            </a>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-navy/30 rounded border border-white/5">
                                    <PhotoIcon className="h-16 w-16 text-slate mx-auto mb-4 opacity-20" />
                                    <p className="text-slate">No photos found in your history.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="animate-in fade-in duration-300">
                            <h2 className={`text-2xl font-bold ${THEME.colors.textMain} mb-6`}>{t.tabHistory}</h2>
                            {loadingHistory ? (
                                <div className="flex justify-center p-20"><LoadingSpinner /></div>
                            ) : history.length > 0 ? (
                                <div className="space-y-4">
                                    {history.map((entry, idx) => (
                                        <div key={idx} className={`${THEME.colors.surface} p-6 rounded-lg border ${THEME.colors.borderSubtle} hover:border-white/20 transition-colors`}>
                                            <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
                                                <div>
                                                    <span className={`text-xs font-bold ${THEME.colors.textHighlight} uppercase tracking-wider`}>
                                                        {new Date(entry.timestamp).toLocaleDateString()}
                                                    </span>
                                                    <h3 className={`text-lg font-bold ${THEME.colors.textMain} mt-1`}>
                                                        {entry.unitInfo || 'Service Request'}
                                                    </h3>
                                                </div>
                                                <span className="bg-navy px-3 py-1 rounded text-xs text-slate border border-white/10 mt-2 md:mt-0 w-fit">
                                                    Submitted
                                                </span>
                                            </div>
                                            <div className="text-sm text-slate mb-4">
                                                <span className="font-bold">Services:</span> {entry.services}
                                            </div>
                                            {entry.photos.length > 0 && (
                                                <div className="flex gap-3">
                                                    {entry.photos.map((url, i) => {
                                                        const directUrl = getDirectImageUrl(url);
                                                        return (
                                                            <a key={i} href={url} target="_blank" rel="noreferrer" className="block w-16 h-16 rounded overflow-hidden border border-white/20 hover:border-bright-cyan transition-all relative group">
                                                                <img 
                                                                    src={directUrl} 
                                                                    alt="Thumbnail" 
                                                                    className="w-full h-full object-cover" 
                                                                    referrerPolicy="no-referrer"
                                                                />
                                                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                                                            </a>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-navy/30 rounded border border-white/5">
                                    <ClockIcon className="h-16 w-16 text-slate mx-auto mb-4 opacity-20" />
                                    <p className="text-slate">No history found.</p>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

// --- Company Dashboard (For Jes Stone Admins) ---
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
                            { id: 'estimating', label: t.tabEstimating, icon: CalculatorIcon }, 
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
  
  // Lifted state for dynamic header on public page
  const [heroText, setHeroText] = useState('');
  const [heroSubText, setHeroSubText] = useState('');

  useEffect(() => {
      const handleHashChange = () => setRoute(window.location.hash);
      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Handle Login Logic
  const handleLogin = (code: string) => {
      const access = MOCK_ACCESS_DB[code];
      if (access) {
          const session: UserSession = {
              role: access.role,
              allowedPropertyIds: access.allowedPropertyIds,
              profile: access.profile,
              company: {
                  id: access.companyId,
                  name: access.companyId === 'knightvest' ? 'Knightvest' : access.companyId === 'internal' ? 'Jes Stone' : 'Unknown',
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
      setHeroText('');
      setHeroSubText('');
  };
  
  const handlePublicSurveySelection = (propName: string, compName: string) => {
      setHeroText(propName);
      setHeroSubText(compName);
  }

  // --- ROUTING LOGIC ---
  
  if (route === '#dashboard') {
      if (!currentUser) {
          return <DashboardLogin onLogin={handleLogin} error={loginError} lang={lang} />;
      }
      if (currentUser.role === 'internal_admin') {
          return <CompanyDashboard user={currentUser} onLogout={handleLogout} lang={lang} setLang={setLang} />;
      } else {
          return <ClientDashboard user={currentUser} onLogout={handleLogout} lang={lang} setLang={setLang} />;
      }
  }

  // Public Landing / Survey
  return (
    <ErrorBoundary>
        <div className={`min-h-screen ${THEME.colors.background} font-sans selection:bg-bright-cyan selection:text-navy`}>
          <Header 
            surveyUrl="#/" 
            lang={lang} 
            setLang={setLang} 
            customTitle={heroText}
            customSubtitle={heroSubText}
          />

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Hero Section */}
            <div className="text-center mb-12 animate-in slide-in-from-bottom-8 duration-700">
                <h1 className={`text-4xl md:text-6xl font-extrabold ${THEME.colors.textMain} mb-4 tracking-tight ${THEME.effects.glowText} uppercase`}>
                    {heroText || BRANDING.companyName}
                </h1>
                <p className={`text-xl ${THEME.colors.textHighlight} font-medium tracking-widest uppercase`}>
                    {heroSubText || BRANDING.companySubtitle}
                </p>
            </div>

            {/* Campaign Selector / Landing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="order-2 md:order-1 animate-in slide-in-from-left duration-700 delay-100">
                    <Survey 
                        companies={[{id: 'knightvest', name: 'Knightvest', properties: [{id: 'kv-1', name: 'The Arts at Park Place', address: '1301 W Park Blvd'}]}]} 
                        isInternal={false}
                        lang={lang}
                        onSelectionChange={handlePublicSurveySelection}
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
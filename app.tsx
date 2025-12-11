
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { generateNotesDraft, createChatSession } from './services/geminiService';
import { fetchCompanyData, submitSurveyData, sendTestChat, fetchSurveyHistory, login } from './services/apiService';
import { translations } from './translations';
import { BRANDING } from './branding';
import { THEME } from './theme';
import type { Company, SurveyData, UserSession, UserRole, UserProfile, HistoryEntry } from './types';
import { Chat, GenerateContentResponse } from "@google/genai";
import { LoadingSpinner, JesStoneLogo, SparklesIcon, PaperAirplaneIcon, ChatBubbleIcon, XMarkIcon, DashboardIcon, PhotoIcon, LockClosedIcon, LogoutIcon, ClipboardListIcon, ClockIcon, BuildingBlocksIcon, CloudArrowUpIcon, TrashIcon, CalculatorIcon, ChartBarIcon, GlobeAltIcon } from './components/icons';
import { EstimatingModule } from './components/EstimatingModule';
import { ProjectManagementModule } from './components/ProjectManagementModule';

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
          <div className={`${THEME.colors.surface} p-8 rounded-lg border ${THEME.colors.borderWarning} text-center max-w-lg ${THEME.effects.glow}`}>
            <h1 className={`text-2xl font-bold ${THEME.colors.textWarning} mb-4`}>Something went wrong.</h1>
            <p className={`mb-4 ${THEME.colors.textSecondary}`}>The application encountered an unexpected error.</p>
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
    try {
        if (url.includes('drive.google.com') && url.includes('/d/')) {
            const id = url.split('/d/')[1].split('/')[0];
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
        <header className={`${THEME.colors.surface}/80 backdrop-blur-md sticky top-0 z-20 shadow-sm border-b ${THEME.colors.borderSubtle}`}>
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                <a href={surveyUrl || "#/"} onClick={handleNav} className="flex items-center gap-4 group">
                    {BRANDING.logoUrl ? (
                        <img src={BRANDING.logoUrl} alt={`${BRANDING.companyName} Logo`} className="h-12 w-auto object-contain" />
                    ) : (
                        <JesStoneLogo className="h-10 w-auto group-hover:scale-105 transition-transform drop-shadow-md" />
                    )}
                    <div className="flex flex-col">
                        <span className={`text-xl font-extrabold ${THEME.colors.textMain} tracking-widest leading-none uppercase`}>
                            {title}
                        </span>
                        <span className={`text-xs ${THEME.colors.textHighlight} font-bold tracking-widest uppercase mt-1`}>
                            {subtitle}
                        </span>
                    </div>
                </a>
                
                <button
                    onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${THEME.colors.borderSubtle} ${THEME.colors.surfaceHighlight} hover:border-gold transition-all shadow-sm`}
                >
                    <GlobeAltIcon className={`h-4 w-4 ${THEME.colors.textSecondary}`} />
                    <span className={`text-xs font-bold ${THEME.colors.textMain}`}>{t.languageToggle}</span>
                </button>
            </nav>
        </header>
    );
};

const Footer: React.FC = () => (
    <footer className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-12 border-t ${THEME.colors.borderSubtle} text-center relative z-10`}>
        <div className="mb-6">
            <h3 className={`text-sm font-bold ${THEME.colors.textSecondary} tracking-widest uppercase mb-4`}>Internal Team Contacts</h3>
            <div className={`inline-block ${THEME.effects.card} p-6 text-left`}>
                {BRANDING.teamContacts.map((contact, idx) => (
                    <div key={idx}>
                        <p className={`font-bold ${THEME.colors.textMain}`}>{contact.name}</p>
                        <p className={`text-sm ${THEME.colors.textHighlight}`}>{contact.role}</p>
                    </div>
                ))}
            </div>
        </div>
        <div className={`flex justify-between items-center text-xs ${THEME.colors.textSecondary}`}>
             <p>&copy; {new Date().getFullYear()} {BRANDING.companyName} {BRANDING.companySubtitle} | <a href={BRANDING.websiteUrl} target="_blank" rel="noreferrer" className={`hover:${THEME.colors.textMain} transition-colors`}>{new URL(BRANDING.websiteUrl).hostname}</a></p>
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
    
    // Initialize form data
    const [formData, setFormData] = useState<SurveyData>(() => ({
        propertyId: '', 
        firstName: userProfile?.firstName || '', 
        lastName: userProfile?.lastName || '', 
        title: userProfile?.title || '', 
        phone: userProfile?.phone || '', 
        email: userProfile?.email || '',
        unitInfo: '', services: [], otherService: '', timeline: '', notes: '', contactMethods: [], attachments: []
    }));

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
    const [errorMessage, setErrorMessage] = useState<string>(''); // Added for debugging
    const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (companies.length === 1) {
            setSelectedCompanyId(companies[0].id);
        }
    }, [companies]);

    const selectedCompany = companies.find(c => c.id === selectedCompanyId);
    const availableProperties = selectedCompany?.properties || [];

    useEffect(() => {
        if (availableProperties.length === 1) {
             const prop = availableProperties[0];
             if (formData.propertyId !== prop.id) {
                 setFormData(prev => ({ ...prev, propertyId: prop.id }));
             }
             if (onSelectionChange && selectedCompany) {
                 onSelectionChange(prop.name, selectedCompany.name);
             }
        }
    }, [availableProperties, formData.propertyId, selectedCompany, onSelectionChange]);

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
        setErrorMessage('');
        
        const property = availableProperties.find(p => p.id === formData.propertyId);
        
        const payload: SurveyData = {
            ...formData,
            unitInfo: formData.unitInfo || 'N/A',
            notes: formData.notes || 'N/A',
            services: formData.services || [],
            propertyName: property?.name || 'Unknown Property',
            propertyAddress: property?.address || 'Unknown Address'
        };

        try {
            await submitSurveyData(BRANDING.defaultApiUrl, payload);
            setSubmissionStatus('success');
            localStorage.setItem('lastSurvey', JSON.stringify(payload));
        } catch (error: any) {
            console.error(error);
            setSubmissionStatus('error');
            setErrorMessage(error.message || 'Unknown network error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setSubmissionStatus('idle');
        setErrorMessage('');
        setFormData({
            propertyId: availableProperties.length === 1 ? availableProperties[0].id : '',
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
            <div className={`max-w-3xl mx-auto p-12 text-center ${THEME.effects.card} mt-10 relative overflow-hidden m-4`}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gold"></div>
                <div className="flex justify-center mb-6">
                    <SparklesIcon className="h-16 w-16 text-gold animate-pulse" />
                </div>
                <h2 className={`text-3xl font-bold ${THEME.colors.textMain} mb-4`}>{t.submitSuccessTitle}</h2>
                <p className={`${THEME.colors.textMain} text-lg mb-2`}>
                   {formData.firstName}, {t.submitSuccessMessage1}
                </p>
                {property && <p className={`${THEME.colors.textSecondary} mb-2 font-bold`}>{property.name}</p>}
                <p className={`${THEME.colors.textSecondary} mb-8`}>{t.submitSuccessMessage2}</p>
                
                {formData.attachments && formData.attachments.length > 0 && (
                     <div className={`flex justify-center items-center gap-2 mb-8 ${THEME.colors.surfaceHighlight} py-2 rounded-full w-fit mx-auto px-6 border ${THEME.colors.borderSubtle}`}>
                        <CloudArrowUpIcon className="h-5 w-5 text-gold" />
                        <span className={`text-gold text-sm font-bold`}>{t.photosUploadedBadge}</span>
                     </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button onClick={handleReset} className={`${THEME.colors.buttonSecondary} px-8 py-3 rounded-lg`}>
                        {t.submitAnotherButton}
                    </button>
                    {!embedded ? (
                        <button onClick={() => window.location.hash = '#dashboard'} className={`${THEME.colors.buttonPrimary} px-8 py-3 rounded-lg font-bold shadow-lg`}>
                            {t.enterDashboardButton}
                        </button>
                    ) : (
                         <button onClick={handleReset} className={`${THEME.colors.buttonPrimary} px-8 py-3 rounded-lg font-bold shadow-lg`}>
                            New Request
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (submissionStatus === 'error') {
        return (
             <div className={`max-w-2xl mx-auto p-8 text-center ${THEME.effects.card} border-2 ${THEME.colors.borderWarning} mt-10 m-4`}>
                 <XMarkIcon className="h-16 w-16 text-rose mx-auto mb-4" />
                <h2 className={`text-2xl font-bold ${THEME.colors.textWarning} mb-2`}>{t.submitErrorTitle}</h2>
                <p className={`${THEME.colors.textSecondary} mb-6`}>{t.submitErrorMessage1}</p>
                {errorMessage && (
                    <div className="bg-rose/10 border border-rose/30 p-3 rounded mb-6 text-sm text-rose font-mono break-all">
                        Error: {errorMessage}
                    </div>
                )}
                <button onClick={() => setSubmissionStatus('idle')} className={`${THEME.colors.buttonPrimary} px-6 py-2 rounded font-bold`}>
                    {t.tryAgainButton}
                </button>
            </div>
        );
    }

    const formHeader = selectedCompany?.name ? `For ${selectedCompany.name} Properties` : t.surveyTitle;

    return (
        <form onSubmit={handleSubmit} className={`w-full max-w-4xl mx-auto ${embedded ? '' : 'mt-8 p-6 md:p-12'} ${THEME.effects.card} relative overflow-hidden`}>
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent"></div>
            
            {/* Header */}
            <div className={`mb-8 border-b ${THEME.colors.borderSubtle} pb-4`}>
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
                        className={`w-full p-3 rounded-lg ${THEME.colors.inputBorder} ${THEME.colors.inputBg} ${THEME.colors.textMain} focus:outline-none ${THEME.colors.inputFocus} transition-all duration-300`}
                    >
                        <option value="">{t.propertySelectPlaceholder}</option>
                        {availableProperties.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Contact Info */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6 ${THEME.colors.surfaceHighlight} rounded-lg border ${THEME.colors.borderSubtle} shadow-inner`}>
                <h3 className={`col-span-2 text-sm font-bold ${THEME.colors.textHighlight} uppercase border-b ${THEME.colors.borderSubtle} pb-2`}>{t.contactInfoLegend}</h3>
                <input type="text" name="firstName" placeholder={t.firstNameLabel} value={formData.firstName} onChange={handleChange} required className={`p-3 rounded border ${THEME.colors.inputBorder} ${THEME.colors.inputBg} ${THEME.colors.textMain} ${THEME.colors.inputFocus}`} />
                <input type="text" name="lastName" placeholder={t.lastNameLabel} value={formData.lastName} onChange={handleChange} required className={`p-3 rounded border ${THEME.colors.inputBorder} ${THEME.colors.inputBg} ${THEME.colors.textMain} ${THEME.colors.inputFocus}`} />
                <input type="tel" name="phone" placeholder={t.phoneLabel} value={formData.phone} onChange={handleChange} required className={`p-3 rounded border ${THEME.colors.inputBorder} ${THEME.colors.inputBg} ${THEME.colors.textMain} ${THEME.colors.inputFocus}`} />
                <input type="email" name="email" placeholder={t.emailLabel} value={formData.email} onChange={handleChange} required className={`p-3 rounded border ${THEME.colors.inputBorder} ${THEME.colors.inputBg} ${THEME.colors.textMain} ${THEME.colors.inputFocus}`} />
                <div className="col-span-2">
                     <p className={`text-xs ${THEME.colors.textSecondary} mb-2 uppercase font-bold`}>{t.contactMethodLegend}</p>
                     <div className="flex flex-wrap gap-4">
                        {t.CONTACT_METHODS.map(method => (
                            <label key={method} className={`flex items-center gap-2 cursor-pointer hover:${THEME.colors.textMain} transition-colors group`}>
                                <input 
                                    type="checkbox"
                                    checked={formData.contactMethods.includes(method)}
                                    onChange={() => handleCheckboxChange('contactMethods', method)}
                                    className="rounded border-slate text-gold focus:ring-gold" 
                                />
                                <span className={`text-sm ${THEME.colors.textSecondary} group-hover:text-navy transition-colors`}>{method}</span>
                            </label>
                        ))}
                     </div>
                </div>
            </div>

            {/* Scope & Details */}
            <div className="mb-8 space-y-6">
                <h3 className={`text-sm font-bold ${THEME.colors.textHighlight} uppercase border-b ${THEME.colors.borderSubtle} pb-2`}>{t.scopeTimelineLegend}</h3>
                
                {/* Unit Info */}
                <div>
                     <label className={`block text-xs font-bold ${THEME.colors.textSecondary} mb-2`}>{t.unitInfoLabel}</label>
                     <input type="text" name="unitInfo" placeholder={t.unitInfoPlaceholder} value={formData.unitInfo} onChange={handleChange} className={`w-full p-3 rounded border ${THEME.colors.inputBorder} ${THEME.colors.inputBg} ${THEME.colors.textMain} ${THEME.colors.inputFocus}`} />
                </div>

                {/* Services Checkboxes */}
                <div>
                    <label className={`block text-xs font-bold ${THEME.colors.textSecondary} mb-3`}>{t.serviceNeededLabel}</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {t.SERVICES.map(service => (
                            <label key={service} className={`flex items-center gap-3 p-3 rounded border ${formData.services.includes(service) ? `${THEME.colors.borderHighlight} bg-gold/5 shadow-inner` : `${THEME.colors.borderSubtle} ${THEME.colors.surfaceHighlight}`} cursor-pointer hover:bg-white transition-all`}>
                                <input 
                                    type="checkbox"
                                    checked={formData.services.includes(service)}
                                    onChange={() => handleCheckboxChange('services', service)}
                                    className="rounded border-slate text-gold w-5 h-5 focus:ring-gold"
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
                     <select name="timeline" value={formData.timeline} onChange={handleChange} className={`w-full p-3 rounded border ${THEME.colors.inputBorder} ${THEME.colors.inputBg} ${THEME.colors.textMain} ${THEME.colors.inputFocus}`}>
                         <option value="">{t.timelineSelectPlaceholder}</option>
                         {t.TIMELINES.map(tl => <option key={tl} value={tl}>{tl}</option>)}
                     </select>
                </div>

                {/* Photo Upload */}
                <div className={`border border-dashed ${THEME.colors.borderSubtle} rounded-lg p-6 text-center transition-all hover:border-gold hover:bg-stone-light cursor-pointer group`}
                     onDragEnter={() => setDragActive(true)}
                     onDragLeave={() => setDragActive(false)}
                     onDragOver={(e) => e.preventDefault()}
                     onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
                     onClick={() => fileInputRef.current?.click()}
                >
                    <div className="flex flex-col items-center gap-2">
                        <CloudArrowUpIcon className="h-10 w-10 text-slate group-hover:text-gold transition-colors" />
                        <span className={`text-sm ${THEME.colors.textMain} font-bold`}>{t.photosLabel}</span>
                        <span className="text-xs text-slate">{t.dragDropText}</span>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*" className="hidden" />
                    </div>
                    {formData.attachments && formData.attachments.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2 justify-center">
                            {formData.attachments.map((file, idx) => (
                                <div key={idx} className={`flex items-center gap-2 ${THEME.colors.surfaceHighlight} px-3 py-1 rounded border ${THEME.colors.borderSubtle} text-xs shadow-sm`}>
                                    <span className={`${THEME.colors.textMain} max-w-[150px] truncate`}>{file.name}</span>
                                    <button type="button" onClick={(e) => {e.stopPropagation(); setFormData(prev => ({ ...prev, attachments: prev.attachments?.filter((_, i) => i !== idx) }))}} className="text-rose hover:text-red-700">
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
                        <button type="button" onClick={handleAIDraft} disabled={isGeneratingDraft} className={`text-xs flex items-center gap-1 ${THEME.colors.textHighlight} hover:${THEME.colors.textMain} transition-colors`}>
                            {isGeneratingDraft ? <LoadingSpinner /> : <SparklesIcon className="h-4 w-4" />}
                            {isGeneratingDraft ? t.generatingButton : t.generateAIDraftButton}
                        </button>
                    </div>
                    <textarea name="notes" rows={4} placeholder={t.notesPlaceholder} value={formData.notes} onChange={handleChange} className={`w-full p-3 rounded border ${THEME.colors.inputBorder} ${THEME.colors.inputBg} ${THEME.colors.textMain} ${THEME.colors.inputFocus}`} />
                </div>
            </div>

            <button type="submit" disabled={isSubmitting} className={`w-full py-4 rounded-lg font-bold text-lg shadow-md tracking-wide transition-all ${isSubmitting ? 'opacity-70 cursor-wait' : `${THEME.colors.buttonPrimary} hover:scale-[1.01]`}`}>
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

    const handleSurveySelection = (propName: string, compName: string) => {
        if (propName) {
            setHeaderTitle(propName);
            setHeaderSubtitle(compName);
        }
    };

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

    if (!user.company) return <div className="p-10 text-center text-navy">Loading Portal Data...</div>;

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
                <aside className={`w-64 ${THEME.effects.card} border-r ${THEME.colors.borderSubtle} hidden md:flex flex-col m-4 rounded-xl`}>
                    <div className={`p-6 border-b ${THEME.colors.borderSubtle}`}>
                        <h2 className={`text-xl font-bold ${THEME.colors.textMain} tracking-wider`}>{t.dashboardLoginTitle}</h2>
                        <p className={`text-xs ${THEME.colors.textHighlight} mt-1 truncate`}>{user.company.name}</p>
                        <p className={`text-[10px] ${THEME.colors.textSecondary} uppercase tracking-widest mt-1`}>
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
                            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-all duration-300 ${activeTab === item.id ? `${THEME.colors.surfaceHighlight} text-navy border-l-4 border-gold shadow-sm` : `${THEME.colors.textSecondary} hover:text-navy hover:bg-stone-light`}`}>
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </button>
                        ))}
                    </nav>
                    <div className={`p-4 border-t ${THEME.colors.borderSubtle}`}>
                        <button onClick={onLogout} className={`w-full flex items-center gap-3 px-4 py-3 text-rose hover:bg-rose/10 rounded transition-colors`}>
                            <LogoutIcon className="h-5 w-5" />
                            {t.logout}
                        </button>
                    </div>
                </aside>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-6 md:p-10 relative z-10">
                    {activeTab === 'overview' && (
                        <div className="animate-in fade-in duration-300">
                            <h1 className={`text-3xl font-bold ${THEME.colors.textMain} mb-2`}>{t.tabOverview}</h1>
                            <p className={`${THEME.colors.textSecondary} mb-8`}>
                                Welcome back, <span className={`${THEME.colors.textMain} font-bold`}>{user.profile?.firstName || 'Manager'}</span>. Here is what is happening at <span className={`${THEME.colors.textMain} font-bold`}>{user.company.name}</span>.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className={`${THEME.effects.card} p-6`}>
                                    <h3 className={`text-sm ${THEME.colors.textSecondary} uppercase tracking-wider mb-2`}>{t.statsActive}</h3>
                                    <p className={`text-4xl font-bold ${THEME.colors.textHighlight}`}>3</p>
                                </div>
                                <div className={`${THEME.effects.card} p-6`}>
                                    <h3 className={`text-sm ${THEME.colors.textSecondary} uppercase tracking-wider mb-2`}>{t.statsCompleted}</h3>
                                    <p className={`text-4xl font-bold ${THEME.colors.textMain}`}>12</p>
                                </div>
                                <div className={`${THEME.effects.card} p-6`}>
                                    <h3 className={`text-sm ${THEME.colors.textSecondary} uppercase tracking-wider mb-2`}>{t.statsPending}</h3>
                                    <p className={`text-4xl font-bold text-rose`}>1</p>
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
                                            <a key={i} href={url} target="_blank" rel="noreferrer" className={`block overflow-hidden rounded-lg border ${THEME.colors.borderSubtle} hover:border-gold transition-colors group relative aspect-square shadow-soft`}>
                                                <img 
                                                  src={directUrl} 
                                                  alt={`Project Photo ${i}`} 
                                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                                  referrerPolicy="no-referrer"
                                                />
                                                <div className="absolute inset-0 bg-navy/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <span className="text-white text-xs font-bold uppercase tracking-wider border border-white px-2 py-1 rounded bg-navy/50">View</span>
                                                </div>
                                            </a>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className={`text-center py-20 ${THEME.colors.surfaceHighlight} rounded border ${THEME.colors.borderSubtle}`}>
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
                                        <div key={idx} className={`${THEME.effects.card} p-6 transition-all`}>
                                            <div className="flex flex-col md:flex-row justify-between md:items-center mb-4">
                                                <div>
                                                    <span className={`text-xs font-bold ${THEME.colors.textHighlight} uppercase tracking-wider`}>
                                                        {new Date(entry.timestamp).toLocaleDateString()}
                                                    </span>
                                                    <h3 className={`text-lg font-bold ${THEME.colors.textMain} mt-1`}>
                                                        {entry.unitInfo || 'Service Request'}
                                                    </h3>
                                                </div>
                                                <span className={`bg-stone px-3 py-1 rounded text-xs ${THEME.colors.textSecondary} border ${THEME.colors.borderSubtle} mt-2 md:mt-0 w-fit`}>
                                                    Submitted
                                                </span>
                                            </div>
                                            <div className={`text-sm ${THEME.colors.textSecondary} mb-4`}>
                                                <span className="font-bold">Services:</span> {entry.services}
                                            </div>
                                            {entry.photos.length > 0 && (
                                                <div className="flex gap-3 mt-4">
                                                    {entry.photos.map((url, i) => {
                                                        const directUrl = getDirectImageUrl(url);
                                                        return (
                                                            <a key={i} href={url} target="_blank" rel="noreferrer" className="block w-20 h-20 rounded-lg overflow-hidden border border-stone-300 hover:border-gold transition-all relative group shadow-md">
                                                                <img 
                                                                    src={directUrl} 
                                                                    alt="Thumbnail" 
                                                                    className="w-full h-full object-cover" 
                                                                    referrerPolicy="no-referrer"
                                                                />
                                                            </a>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={`text-center py-20 ${THEME.colors.surfaceHighlight} rounded border ${THEME.colors.borderSubtle}`}>
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
            const result = await sendTestChat(BRANDING.defaultApiUrl);
            setTestStatus(result); // Will show "Signal Sent (Blind Mode)" if fell back
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
                <aside className={`w-64 bg-navy text-white border-r ${THEME.colors.borderSubtle} hidden md:flex flex-col`}>
                    <div className="p-6 border-b border-white/10">
                        <h2 className={`text-xl font-bold text-white tracking-wider`}>{t.companyPortalTitle}</h2>
                        <p className={`text-xs text-slate-300 mt-1`}>{t.companyPortalSubtitle}</p>
                    </div>
                    <nav className="flex-1 p-4 space-y-2">
                        {[
                            { id: 'overview', label: 'Command Center', icon: DashboardIcon },
                            { id: 'data', label: t.tabDataSources, icon: ChartBarIcon },
                            { id: 'estimating', label: t.tabEstimating, icon: CalculatorIcon }, 
                            { id: 'projects', label: 'Global Projects', icon: BuildingBlocksIcon },
                        ].map(item => (
                            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-white text-navy font-bold' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}>
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </button>
                        ))}
                    </nav>
                    <div className="p-4 border-t border-white/10">
                        <button onClick={onLogout} className={`w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors`}>
                            <LogoutIcon className="h-5 w-5" />
                            {t.logout}
                        </button>
                    </div>
                </aside>

                <main className="flex-1 overflow-y-auto p-6 md:p-10 relative z-10">
                    {activeTab === 'overview' && (
                        <div className="animate-in fade-in duration-300">
                            <h1 className={`text-3xl font-bold ${THEME.colors.textMain} mb-8`}>Global Overview</h1>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className={`${THEME.effects.card} p-6`}>
                                    <h3 className="text-gold font-bold mb-2">Total Active Projects</h3>
                                    <p className={`text-5xl font-bold ${THEME.colors.textMain}`}>15</p>
                                </div>
                                <div className={`${THEME.effects.card} p-6`}>
                                    <h3 className="text-rose font-bold mb-2">Pending Estimates</h3>
                                    <p className={`text-5xl font-bold ${THEME.colors.textMain}`}>4</p>
                                </div>
                                {/* SYSTEM STATUS CARD */}
                                <div className={`${THEME.effects.card} p-6`}>
                                    <h3 className={`${THEME.colors.textMain} font-bold mb-2`}>{t.systemStatusTitle}</h3>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
                                        <span className="text-sm text-slate">API Online</span>
                                    </div>
                                    <button onClick={handleTestChat} className={`text-xs ${THEME.colors.surface} border ${THEME.colors.borderHighlight} ${THEME.colors.textHighlight} px-3 py-2 rounded hover:bg-gold/10 transition-colors w-full`}>
                                        {t.testChatButton}
                                    </button>
                                    {testStatus && <p className={`text-xs mt-2 text-center ${THEME.colors.textHighlight} animate-pulse`}>{testStatus}</p>}
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'data' && (
                        <div className="animate-in fade-in duration-300">
                            <h1 className={`text-2xl font-bold ${THEME.colors.textMain} mb-6`}>{t.dataSourcesTitle}</h1>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <a href="https://docs.google.com/spreadsheets/u/0/" target="_blank" rel="noreferrer" className={`${THEME.effects.card} p-8 hover:border-green-400 group`}>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="bg-green-100 p-3 rounded-lg"><ClipboardListIcon className="h-8 w-8 text-green-600" /></div>
                                        <div>
                                            <h3 className={`font-bold ${THEME.colors.textMain} text-lg`}>{t.googleSheetLabel}</h3>
                                            <p className="text-slate text-sm">View all raw survey responses</p>
                                        </div>
                                    </div>
                                    <span className="text-green-600 font-bold text-sm group-hover:underline">{t.openSheetButton} &rarr;</span>
                                </a>
                                <a href="https://drive.google.com/drive/u/0/" target="_blank" rel="noreferrer" className={`${THEME.effects.card} p-8 hover:border-blue-400 group`}>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="bg-blue-100 p-3 rounded-lg"><PhotoIcon className="h-8 w-8 text-blue-600" /></div>
                                        <div>
                                            <h3 className={`font-bold ${THEME.colors.textMain} text-lg`}>{t.googleDriveLabel}</h3>
                                            <p className="text-slate text-sm">Access photo repository</p>
                                        </div>
                                    </div>
                                    <span className="text-blue-600 font-bold text-sm group-hover:underline">{t.openDriveButton} &rarr;</span>
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
    const [isLoading, setIsLoading] = useState(false);
    const t = translations[lang];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await onLogin(code.toLowerCase()); 
        setIsLoading(false);
    };

    return (
        <div className={`min-h-screen ${THEME.colors.background} flex flex-col items-center justify-center p-4 relative overflow-hidden`}>
             {/* Background Decoration */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className={`w-full max-w-md ${THEME.effects.card} p-10 text-center relative z-10`}>
                <div className={`${THEME.colors.surfaceHighlight} p-4 rounded-full w-fit mx-auto mb-6 border ${THEME.colors.borderHighlight} shadow-inner-light`}>
                    <LockClosedIcon className="h-8 w-8 text-gold" />
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
                            className={`w-full p-4 rounded-lg ${THEME.colors.inputBg} border ${THEME.colors.inputBorder} ${THEME.colors.textMain} text-center text-xl font-bold tracking-[0.2em] focus:outline-none ${THEME.colors.inputFocus} placeholder:text-slate/30 transition-all duration-300`}
                        />
                    </div>
                    {error && <p className="text-rose text-sm font-bold animate-pulse">{error}</p>}
                    <button 
                        type="submit" 
                        disabled={!code || isLoading}
                        className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${!code || isLoading ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : `${THEME.colors.buttonPrimary} shadow-md`}`}
                    >
                        {isLoading ? 'Verifying...' : t.loginButton}
                    </button>
                </form>

                <div className="mt-8 pt-8 border-t ${THEME.colors.borderSubtle} text-xs text-slate">
                    <p className="mb-2 font-bold opacity-50">Admin Access:</p>
                    <p className="mb-2"><span className="text-navy font-bold cursor-pointer hover:underline text-sm border border-navy/20 px-2 py-1 rounded bg-stone-200" onClick={() => { setCode('ADMIN'); }}>ADMIN</span> <span className="ml-2">(Jes Stone Internal)</span></p>
                    
                    <button onClick={() => window.location.hash = ''} className="mt-6 text-navy hover:underline opacity-50">
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
                <div className={`mb-4 w-80 h-96 ${THEME.effects.card} flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300`}>
                    <div className="bg-navy p-4 border-b border-white/10 flex justify-between items-center text-white">
                        <div className="flex items-center gap-2">
                             <SparklesIcon className="h-4 w-4 text-gold" />
                             <h3 className="font-bold">{t.chatTitle}</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-white"><XMarkIcon className="h-5 w-5" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-light/50">
                        {messages.length === 0 && (
                            <div className="text-center text-slate text-sm mt-10">
                                <p>Hello! I am the {BRANDING.assistantName}.</p>
                                <p className="text-xs mt-2">How can I help you today?</p>
                            </div>
                        )}
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-lg text-sm shadow-sm ${msg.role === 'user' ? 'bg-navy text-white rounded-br-none' : 'bg-white text-navy rounded-bl-none border border-stone-200'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isThinking && <div className="text-xs text-slate animate-pulse ml-2">Thinking...</div>}
                    </div>
                    <div className="p-3 bg-white border-t border-stone-200 flex gap-2">
                        <input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={t.chatPlaceholder}
                            className={`flex-1 bg-stone-100 border border-stone-200 rounded px-3 py-2 text-sm ${THEME.colors.textMain} focus:outline-none focus:border-gold`}
                        />
                        <button onClick={handleSend} disabled={!input || isThinking} className="text-navy disabled:opacity-50 hover:scale-110 transition-transform">
                            <PaperAirplaneIcon className="h-5 w-5 rotate-90" />
                        </button>
                    </div>
                </div>
            )}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`${THEME.colors.buttonPrimary} p-4 rounded-full shadow-lg hover:scale-110 transition-transform`}
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
  
  const [route, setRoute] = useState(window.location.hash);
  const [heroText, setHeroText] = useState('');
  const [heroSubText, setHeroSubText] = useState('');
  
  // New state to track if we are in demo/offline mode
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
      const handleHashChange = () => setRoute(window.location.hash);
      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLogin = async (code: string) => {
      setLoginError('');
      if (code === 'ADMIN') {
          setCurrentUser({ role: 'internal_admin', companyId: 'internal', allowedPropertyIds: [], company: {id: 'internal', name: 'Jes Stone', properties: []} } as any);
          setIsDemoMode(false);
          return;
      }

      try {
          const result = await login(BRANDING.defaultApiUrl, code);
          setCurrentUser(result.session);
          setIsDemoMode(result.isFallback); // Set demo mode based on API result
      } catch (e) {
          setLoginError('Invalid Access Code');
      }
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setIsDemoMode(false);
      window.location.hash = '';
      setHeroText('');
      setHeroSubText('');
  };
  
  const handlePublicSurveySelection = (propName: string, compName: string) => {
      setHeroText(propName);
      setHeroSubText(compName);
  }
  
  if (route === '#dashboard') {
      if (!currentUser) {
          return <DashboardLogin onLogin={handleLogin} error={loginError} lang={lang} />;
      }
      return (
          <>
            {isDemoMode && (
                <div className="fixed bottom-4 left-4 z-50 bg-rose text-white text-xs font-bold px-3 py-1 rounded shadow-lg animate-pulse pointer-events-none">
                    ⚠ Demo / Offline Mode
                </div>
            )}
            {currentUser.role === 'internal_admin' ? (
                <CompanyDashboard user={currentUser} onLogout={handleLogout} lang={lang} setLang={setLang} />
            ) : (
                <ClientDashboard user={currentUser} onLogout={handleLogout} lang={lang} setLang={setLang} />
            )}
          </>
      );
  }

  // Public Landing / Survey
  return (
    <ErrorBoundary>
        <div className={`min-h-screen ${THEME.colors.background} font-sans selection:bg-gold selection:text-white`}>
          <Header 
            surveyUrl="#/" 
            lang={lang} 
            setLang={setLang} 
            customTitle={heroText}
            customSubtitle={heroSubText}
          />

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
            {/* Hero Section */}
            <div className="text-center mb-12 animate-in slide-in-from-bottom-8 duration-700">
                <h1 className={`text-4xl md:text-6xl font-extrabold ${THEME.colors.textMain} mb-4 tracking-tight uppercase`}>
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
                    <div className={`${THEME.effects.card} p-10 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500`}>
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <LockClosedIcon className="h-32 w-32 text-navy" />
                        </div>
                        <h2 className={`text-2xl font-bold ${THEME.colors.textMain} mb-4 relative z-10`}>Property Manager Portal</h2>
                        <p className={`${THEME.colors.textSecondary} mb-6 relative z-10`}>
                            Track your requests, view project photos, and manage approvals in one secure place.
                        </p>
                        <button 
                            onClick={() => window.location.hash = '#dashboard'}
                            className={`w-full flex items-center justify-center gap-3 ${THEME.colors.buttonSecondary} py-4 rounded-lg font-bold text-lg transition-all relative z-10`}
                        >
                            <LockClosedIcon className="h-6 w-6" />
                            {t.enterDashboardButton}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className={`${THEME.effects.card} p-4 text-center`}>
                            <ClockIcon className="h-8 w-8 text-gold mx-auto mb-2" />
                            <h3 className={`font-bold ${THEME.colors.textMain}`}>Fast Turnaround</h3>
                            <p className="text-xs text-slate">24h Response Time</p>
                        </div>
                         <div className={`${THEME.effects.card} p-4 text-center`}>
                            <SparklesIcon className="h-8 w-8 text-navy mx-auto mb-2" />
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

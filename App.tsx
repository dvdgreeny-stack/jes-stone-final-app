import React, { useState, useEffect, useRef } from 'react';
import { generateNotesDraft, createChatSession } from './services/geminiService';
import { fetchCompanyData, submitSurveyData, login } from './services/apiService';
import { translations } from './translations';
import { BRANDING } from './branding';
import { THEME } from './theme';
import type { Company, SurveyData, UserSession, UserProfile, Property } from './types';
import { Chat, GenerateContentResponse } from "@google/genai";
import { LoadingSpinner, JesStoneLogo, SparklesIcon, PaperAirplaneIcon, ChatBubbleIcon, XMarkIcon, DashboardIcon, PhotoIcon, LockClosedIcon, LogoutIcon, ClipboardListIcon, BuildingBlocksIcon, CloudArrowUpIcon, ChartBarIcon, GlobeAltIcon, UsersIcon, CalculatorIcon } from './components/icons';
import { ProjectManagementModule } from './components/ProjectManagementModule';
import { EstimatingModule } from './components/EstimatingModule';

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

// --- Login Card Component ---
const LoginCard: React.FC<{ lang: 'en' | 'es', onLogin: (session: UserSession) => void }> = ({ lang, onLogin }) => {
    const t = translations[lang];
    const [accessCode, setAccessCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { session } = await login(BRANDING.defaultApiUrl, accessCode);
            onLogin(session);
        } catch (error) {
            alert('Invalid access code or network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`${THEME.colors.surface} p-8 rounded-xl border ${THEME.colors.borderSubtle} ${THEME.effects.card} sticky top-24`}>
            <div className="text-center mb-6">
                <div className="inline-block p-3 rounded-full bg-slate-50 mb-3">
                    <LockClosedIcon className="h-8 w-8 text-gold" />
                </div>
                <h2 className={`text-xl font-bold ${THEME.colors.textMain}`}>{t.dashboardLoginTitle}</h2>
                <p className={`text-sm ${THEME.colors.textSecondary} mt-1`}>{t.dashboardLoginSubtitle}</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
                <input 
                    type="password" 
                    placeholder={t.accessCodeLabel}
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    className={`w-full p-3 rounded border ${THEME.colors.inputBorder} ${THEME.colors.inputFocus} text-center tracking-widest`}
                />
                <button disabled={loading} className={`w-full ${THEME.colors.buttonPrimary} py-3 rounded-lg`}>
                    {loading ? <LoadingSpinner /> : t.loginButton}
                </button>
            </form>
        </div>
    );
};

// --- Survey Component ---
interface SurveyProps {
    companies: Company[];
    isInternal?: boolean;
    embedded?: boolean;
    userProfile?: UserProfile;
    lang: 'en' | 'es';
    onSelectionChange?: (propertyName: string, companyName: string) => void;
    onPropertySelect?: (property: Property) => void;
}

const Survey: React.FC<SurveyProps> = ({ companies, isInternal, embedded, userProfile, lang, onSelectionChange, onPropertySelect }) => {
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
    const [errorMessage, setErrorMessage] = useState<string>(''); 
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

    // Auto-select property if only one is available
    useEffect(() => {
        if (availableProperties.length === 1) {
             const prop = availableProperties[0];
             if (formData.propertyId !== prop.id) {
                 setFormData(prev => ({ ...prev, propertyId: prop.id }));
             }
        }
    }, [availableProperties, formData.propertyId]);

    // Update Header Title based on Property Selection
    useEffect(() => {
        if (selectedCompany) {
             const prop = availableProperties.find(p => p.id === formData.propertyId);
             if (prop) {
                 // Update header with Property Name as main title
                 if (onSelectionChange) onSelectionChange(prop.name, selectedCompany.name);
                 // Notify App parent to update Chat context
                 if (onPropertySelect) onPropertySelect(prop);
             } else {
                 // Default to Company Name if no property selected
                 if (onSelectionChange) onSelectionChange(selectedCompany.name, t.surveySubtitleProperties);
             }
        }
    }, [formData.propertyId, selectedCompany, availableProperties, onSelectionChange, onPropertySelect, t.surveySubtitleProperties]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleServiceChange = (service: string) => {
        // Multi-select Toggle logic
        setFormData(prev => {
            const isSelected = prev.services.includes(service);
            if (isSelected) {
                return { ...prev, services: prev.services.filter(s => s !== service) };
            } else {
                return { ...prev, services: [...prev.services, service] };
            }
        });
    };

    const handleCheckboxChange = (field: 'contactMethods', value: string) => {
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
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    };

    const handleFiles = (files: FileList) => {
         const fileArray = Array.from(files);
         
         const promises = fileArray.map(file => {
             return new Promise<{name: string, type: string, data: string}>((resolve, reject) => {
                 if (file.size > 2 * 1024 * 1024) {
                     alert(`File ${file.name} is too large (Max 2MB)`);
                     resolve({ name: '', type: '', data: '' }); // Resolve empty to filter out later
                     return;
                 }
                 
                 const reader = new FileReader();
                 reader.onload = (e) => {
                     resolve({
                         name: file.name,
                         type: file.type || 'application/octet-stream',
                         data: e.target?.result as string || ''
                     });
                 };
                 reader.onerror = () => reject(new Error('File reading failed'));
                 reader.readAsDataURL(file);
             });
         });

         Promise.all(promises).then(newAttachments => {
             // Filter out failed or too large files
             const validAttachments = newAttachments.filter(a => a.data && a.data !== '');
             
             if (validAttachments.length > 0) {
                 setFormData(prev => ({ 
                     ...prev, 
                     attachments: [...(prev.attachments || []), ...validAttachments] 
                 }));
             }
         }).catch(err => {
             console.error("Error processing files:", err);
         });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');
        
        if (formData.contactMethods.length === 0) {
            setErrorMessage("Please select at least one contact method.");
            setSubmissionStatus('error');
            return;
        }

        if (formData.services.length === 0 && !formData.otherService.trim()) {
            setErrorMessage("Please select a service or describe other services needed.");
            setSubmissionStatus('error');
            return;
        }

        if (!formData.unitInfo.trim()) {
            setErrorMessage("Please provide unit information or site directions.");
            setSubmissionStatus('error');
            return;
        }

         if (!formData.timeline) {
            setErrorMessage("Please select a timeline.");
            setSubmissionStatus('error');
            return;
        }

        setIsSubmitting(true);
        
        const property = availableProperties.find(p => p.id === formData.propertyId);
        
        const payload: SurveyData = {
            ...formData,
            unitInfo: formData.unitInfo,
            notes: formData.notes || 'N/A',
            // Send selected services array directly
            services: formData.services,
            // Send other service description
            otherService: formData.otherService || '', 
            propertyName: property?.name || 'Unknown Property',
            propertyAddress: property?.address || 'Unknown Address',
            // Strip base64 prefix
            attachments: formData.attachments?.map(a => ({
                name: a.name || 'image.jpg',
                type: a.type && a.type !== '' ? a.type : 'application/octet-stream', 
                data: a.data.includes('base64,') ? a.data.split('base64,')[1] : a.data
            })) || []
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
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    if (submissionStatus === 'success') {
        const property = availableProperties.find(p => p.id === formData.propertyId);
        return (
            <div className={`max-w-3xl mx-auto p-12 text-center ${THEME.colors.surface} mt-10 relative overflow-hidden m-4 rounded-xl shadow-lg border ${THEME.colors.borderSubtle}`}>
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
                     <div className={`flex flex-col items-center gap-2 mb-8 ${THEME.colors.surfaceHighlight} py-4 rounded-xl w-fit mx-auto px-8 border ${THEME.colors.borderSubtle}`}>
                        <div className="flex items-center gap-2">
                            <CloudArrowUpIcon className="h-5 w-5 text-gold" />
                            <span className={`text-gold text-sm font-bold`}>{t.photosUploadedBadge}</span>
                        </div>
                        <div className="flex gap-2 mt-2">
                             {formData.attachments.slice(0, 3).map((a, i) => (
                                 <img key={i} src={a.data.includes('base64,') ? a.data : `data:${a.type};base64,${a.data}`} alt="thumbnail" className="h-10 w-10 object-cover rounded border border-slate-300" />
                             ))}
                             {formData.attachments.length > 3 && <span className="text-xs text-slate-400 self-center">+{formData.attachments.length - 3}</span>}
                        </div>
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

    // Common Label Style for consistency
    const labelStyle = `text-xs font-bold ${THEME.colors.textSecondary} uppercase mb-1`;
    const inputStyle = `w-full p-3 rounded border ${THEME.colors.inputBorder} ${THEME.colors.inputFocus} bg-white`;

    const property = availableProperties.find(p => p.id === formData.propertyId);

    return (
        <form onSubmit={handleSubmit} className="space-y-8 mt-2 pb-12">
            {/* Property Selection */}
            {companies.length > 0 && (
                <div className={`${THEME.colors.surface} p-6 rounded-xl border ${THEME.colors.borderSubtle} ${THEME.effects.card}`}>
                    <div className={`text-lg font-bold ${THEME.colors.textMain} mb-6 flex items-center gap-2 border-b ${THEME.colors.borderSubtle} pb-2`}>
                        <BuildingBlocksIcon className="h-5 w-5 text-gold" /> {t.propertyIdLegend}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {companies.length > 1 && (
                            <div className="flex flex-col">
                                <label className={labelStyle}>Management Company</label>
                                <select 
                                    value={selectedCompanyId} 
                                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                                    className={inputStyle}
                                >
                                    <option value="">Select Company...</option>
                                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        )}
                        <div className={`flex flex-col ${companies.length > 1 ? '' : 'md:col-span-2'}`}>
                            <label className={labelStyle}>{t.propertyNameLabel}</label>
                            <select 
                                name="propertyId" 
                                value={formData.propertyId} 
                                onChange={handleChange}
                                required
                                className={inputStyle}
                            >
                                <option value="">{t.propertySelectPlaceholder}</option>
                                {availableProperties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        
                         {/* ADDRESS LOGIC: Populates when property is selected */}
                        {property && property.address && (
                            <div className="md:col-span-2 animate-in fade-in slide-in-from-top-1">
                                <label className={labelStyle}>{t.propertyAddressLabel}</label>
                                <div className={`flex items-center gap-2 w-full p-3 rounded border ${THEME.colors.inputBorder} bg-slate-50 text-slate-700`}>
                                    <GlobeAltIcon className="h-4 w-4 text-gold" />
                                    <span>{property.address}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Contact Info */}
            <div className={`${THEME.colors.surface} p-6 rounded-xl border ${THEME.colors.borderSubtle} ${THEME.effects.card}`}>
                 <div className={`text-lg font-bold ${THEME.colors.textMain} mb-6 flex items-center gap-2 border-b ${THEME.colors.borderSubtle} pb-2`}>
                    <UsersIcon className="h-5 w-5 text-gold" /> {t.contactInfoLegend}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col">
                        <label className={labelStyle}>{t.firstNameLabel}</label>
                        <input name="firstName" value={formData.firstName} onChange={handleChange} required className={inputStyle} />
                    </div>
                    <div className="flex flex-col">
                        <label className={labelStyle}>{t.lastNameLabel}</label>
                        <input name="lastName" value={formData.lastName} onChange={handleChange} required className={inputStyle} />
                    </div>
                    <div className="flex flex-col">
                        <label className={labelStyle}>{t.titleRoleLabel}</label>
                        <select name="title" value={formData.title} onChange={handleChange} className={inputStyle}>
                            <option value="">{t.roleSelectPlaceholder}</option>
                            {t.TITLES.map(title => <option key={title} value={title}>{title}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <label className={labelStyle}>{t.emailLabel}</label>
                        <input name="email" type="text" placeholder={t.emailPlaceholder} value={formData.email} onChange={handleChange} required className={inputStyle} />
                    </div>
                    <div className="flex flex-col md:col-span-2">
                        <label className={labelStyle}>{t.phoneLabel}</label>
                        <input name="phone" type="tel" value={formData.phone} onChange={handleChange} className={inputStyle} />
                    </div>
                </div>
            </div>

            {/* Scope & Timeline */}
             <div className={`${THEME.colors.surface} p-6 rounded-xl border ${THEME.colors.borderSubtle} ${THEME.effects.card}`}>
                 <div className={`text-lg font-bold ${THEME.colors.textMain} mb-6 flex items-center gap-2 border-b ${THEME.colors.borderSubtle} pb-2`}>
                    <ClipboardListIcon className="h-5 w-5 text-gold" /> {t.scopeTimelineLegend}
                </div>
                
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Column 1: Predefined Services (Multi-Select Checkboxes) */}
                        <div className="flex flex-col">
                            <label className={`block text-sm font-bold ${THEME.colors.textSecondary} mb-3 uppercase tracking-wider`}>{t.serviceNeededLabel}</label>
                            <div className="flex flex-col gap-2">
                                {t.SERVICES.map(service => (
                                    <label key={service} className="flex items-center space-x-3 cursor-pointer p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors group">
                                        <input 
                                            type="checkbox" 
                                            name="service_selection"
                                            checked={formData.services.includes(service)} 
                                            onChange={() => handleServiceChange(service)}
                                            className="w-4 h-4 rounded text-navy focus:ring-gold border-slate-300"
                                        />
                                        <span className={`${THEME.colors.textMain} font-medium group-hover:text-navy`}>{service}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Column 2: Other Services (Textarea) */}
                        <div className="flex flex-col">
                            <label className={`block text-sm font-bold ${THEME.colors.textSecondary} mb-3 uppercase tracking-wider`}>{t.otherServicesLabel}</label>
                            <textarea 
                                name="otherService" 
                                rows={8}
                                value={formData.otherService} 
                                onChange={handleChange} 
                                placeholder={t.otherServicePlaceholder} 
                                className={`${inputStyle} h-full resize-none`} 
                            />
                        </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100">
                        <label className={`block text-sm font-bold ${THEME.colors.textSecondary} mb-2`}>{t.unitInfoLabel}</label>
                        <input name="unitInfo" placeholder={t.unitInfoPlaceholder} value={formData.unitInfo} onChange={handleChange} required className={inputStyle} />
                    </div>

                    <div>
                        <label className={`block text-sm font-bold ${THEME.colors.textSecondary} mb-2`}>{t.timelineLabel}</label>
                        <select name="timeline" value={formData.timeline} onChange={handleChange} required className={inputStyle}>
                            <option value="">{t.timelineSelectPlaceholder}</option>
                            {t.TIMELINES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>

                    <div>
                         <div className="flex justify-between items-center mb-2">
                             <label className={`block text-sm font-bold ${THEME.colors.textSecondary}`}>{t.notesLabel}</label>
                             <button type="button" onClick={handleAIDraft} disabled={isGeneratingDraft} className={`text-xs flex items-center gap-1 ${THEME.colors.textLink}`}>
                                {isGeneratingDraft ? <LoadingSpinner /> : <SparklesIcon className="h-3 w-3" />}
                                {isGeneratingDraft ? t.generatingButton : t.generateAIDraftButton}
                             </button>
                         </div>
                         <textarea name="notes" rows={4} placeholder={t.notesPlaceholder} value={formData.notes} onChange={handleChange} className={inputStyle} />
                    </div>
                </div>
            </div>

             {/* Photos */}
             <div className={`${THEME.colors.surface} p-6 rounded-xl border ${THEME.colors.borderSubtle} ${THEME.effects.card}`}>
                 <div className={`text-lg font-bold ${THEME.colors.textMain} mb-6 flex items-center gap-2 border-b ${THEME.colors.borderSubtle} pb-2`}>
                    <PhotoIcon className="h-5 w-5 text-gold" /> {t.photosLegend}
                </div>
                <div 
                    className={`border-2 border-dashed ${dragActive ? THEME.colors.borderHighlight : THEME.colors.borderSubtle} rounded-lg p-8 text-center transition-colors cursor-pointer bg-slate-50`}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <CloudArrowUpIcon className="h-10 w-10 mx-auto text-slate-400 mb-2" />
                    <p className={`${THEME.colors.textSecondary} font-bold`}>{t.dragDropText}</p>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*" className="hidden" />
                </div>
                {formData.attachments && formData.attachments.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {formData.attachments.map((file, idx) => (
                            <div key={idx} className="relative group">
                                <img src={file.data} alt="preview" className="h-24 w-full object-cover rounded shadow-sm" />
                                <button 
                                    type="button" 
                                    onClick={() => setFormData(prev => ({ ...prev, attachments: prev.attachments?.filter((_, i) => i !== idx) }))}
                                    className="absolute top-1 right-1 bg-rose text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <XMarkIcon className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
             </div>

             {/* Contact Methods */}
             <div className={`${THEME.colors.surface} p-6 rounded-xl border ${THEME.colors.borderSubtle} ${THEME.effects.card}`}>
                 <div className={`text-lg font-bold ${THEME.colors.textMain} mb-6 flex items-center gap-2 border-b ${THEME.colors.borderSubtle} pb-2`}>
                    <ChatBubbleIcon className="h-5 w-5 text-gold" /> {t.contactMethodLegend}
                </div>
                <div className="flex flex-wrap gap-4">
                     {t.CONTACT_METHODS.map(method => (
                        <label key={method} className="flex items-center space-x-2 cursor-pointer border p-3 rounded hover:bg-slate-50 transition-colors">
                            <input 
                                type="checkbox" 
                                checked={formData.contactMethods.includes(method)} 
                                onChange={() => handleCheckboxChange('contactMethods', method)}
                                className="rounded text-navy focus:ring-gold"
                            />
                            <span className={THEME.colors.textMain}>{method}</span>
                        </label>
                    ))}
                </div>
             </div>

             {errorMessage && (
                 <div className={`p-4 rounded bg-rose-50 text-rose border border-rose-200 text-center font-bold`}>
                     {errorMessage}
                 </div>
             )}

             <button 
                type="submit" 
                disabled={isSubmitting} 
                className={`w-full py-4 rounded-lg text-lg ${THEME.colors.buttonPrimary} shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all`}
             >
                {isSubmitting ? <span className="flex items-center justify-center gap-2"><LoadingSpinner /> {t.submittingButton}</span> : t.submitButton}
             </button>

        </form>
    );
};

// --- Dashboard Component ---
const Dashboard: React.FC<{companies: Company[], lang: 'en'|'es', session: UserSession | null, setSession: (s: UserSession | null) => void}> = ({ companies, lang, session, setSession }) => {
    const t = translations[lang];
    const [accessCode, setAccessCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    // Internal login handler for direct dashboard access route (not used in side-by-side view but good for robustness)
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { session } = await login(BRANDING.defaultApiUrl, accessCode);
            setSession(session);
        } catch (error) {
            alert('Invalid access code or network error');
        } finally {
            setLoading(false);
        }
    };

    if (!session) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-4">
                <div className={`${THEME.colors.surface} p-8 rounded-xl shadow-2xl max-w-md w-full border ${THEME.colors.borderSubtle}`}>
                    <div className="text-center mb-8">
                        <LockClosedIcon className="h-12 w-12 text-gold mx-auto mb-4" />
                        <h2 className={`text-2xl font-bold ${THEME.colors.textMain}`}>{t.dashboardLoginTitle}</h2>
                        <p className={THEME.colors.textSecondary}>{t.dashboardLoginSubtitle}</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input 
                            type="password" 
                            placeholder={t.accessCodeLabel}
                            value={accessCode}
                            onChange={(e) => setAccessCode(e.target.value)}
                            className={`w-full p-3 rounded border ${THEME.colors.inputBorder} ${THEME.colors.inputFocus} text-center tracking-widest`}
                        />
                        <button disabled={loading} className={`w-full ${THEME.colors.buttonPrimary} py-3 rounded-lg`}>
                            {loading ? <LoadingSpinner /> : t.loginButton}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const isAdmin = session.role === 'internal_admin' || session.role === 'executive';

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className={`text-3xl font-bold ${THEME.colors.textMain}`}>
                        {session.profile?.firstName ? `Welcome, ${session.profile.firstName}` : 'Dashboard'}
                    </h1>
                    <div className="flex items-center gap-2">
                         <p className={THEME.colors.textSecondary}>{session.company.name} | {session.role.replace('_', ' ').toUpperCase()}</p>
                         {session.profile?.email && (
                             <span className={`text-xs ${THEME.colors.textHighlight} bg-slate-100 px-2 py-0.5 rounded-full border ${THEME.colors.borderSubtle}`}>
                                 {session.profile.email}
                             </span>
                         )}
                    </div>
                </div>
                <button onClick={() => setSession(null)} className={`flex items-center gap-2 ${THEME.colors.textSecondary} hover:${THEME.colors.textWarning}`}>
                    <LogoutIcon className="h-5 w-5" /> {t.logout}
                </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-4 mb-6 border-b border-slate-200">
                {[
                    { id: 'overview', label: t.tabOverview, icon: DashboardIcon },
                    { id: 'projects', label: t.tabProjects, icon: ChartBarIcon },
                    { id: 'estimating', label: t.tabEstimating, icon: CalculatorIcon },
                    { id: 'new', label: t.tabNewRequest, icon: ClipboardListIcon },
                    { id: 'gallery', label: t.tabGallery, icon: PhotoIcon },
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? `${THEME.colors.buttonPrimary}` : `text-slate-500 hover:bg-slate-100`}`}
                    >
                        <tab.icon className="h-4 w-4" /> {tab.label}
                    </button>
                ))}
            </div>

            <div className="min-h-[500px]">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
                        <div className={`${THEME.colors.surface} p-6 rounded-lg shadow border ${THEME.colors.borderSubtle}`}>
                            <h3 className={`text-sm uppercase font-bold ${THEME.colors.textSecondary} mb-2`}>{t.statsActive}</h3>
                            <p className={`text-4xl font-bold ${THEME.colors.textMain}`}>3</p>
                        </div>
                        <div className={`${THEME.colors.surface} p-6 rounded-lg shadow border ${THEME.colors.borderSubtle}`}>
                            <h3 className={`text-sm uppercase font-bold ${THEME.colors.textSecondary} mb-2`}>{t.statsPending}</h3>
                            <p className={`text-4xl font-bold ${THEME.colors.textHighlight}`}>1</p>
                        </div>
                        <div className={`${THEME.colors.surface} p-6 rounded-lg shadow border ${THEME.colors.borderSubtle}`}>
                            <h3 className={`text-sm uppercase font-bold ${THEME.colors.textSecondary} mb-2`}>{t.recentActivity}</h3>
                            <ul className="text-sm space-y-2">
                                <li className="flex justify-between"><span>Unit 104 Remodel</span> <span className="text-xs bg-green-100 text-green-800 px-2 rounded">Complete</span></li>
                                <li className="flex justify-between"><span>Lobby Floor</span> <span className="text-xs bg-yellow-100 text-yellow-800 px-2 rounded">In Progress</span></li>
                            </ul>
                        </div>
                    </div>
                )}
                
                {activeTab === 'new' && (
                    <Survey 
                        companies={[session.company]} 
                        isInternal={true} 
                        embedded={true} 
                        userProfile={session.profile} 
                        lang={lang} 
                    />
                )}
                
                {activeTab === 'projects' && <ProjectManagementModule mode={isAdmin ? 'company' : 'client'} lang={lang} />}

                {activeTab === 'estimating' && <EstimatingModule session={session} lang={lang} />}

                {activeTab === 'gallery' && (
                    <div className="text-center py-20 text-slate-400">
                        <PhotoIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
                        <p>{t.gallerySubtitle}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Chat Widget ---
interface ChatWidgetProps {
    selectedProperty?: Property;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ selectedProperty }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatRef = useRef<Chat | null>(null);

    // Initialize/Re-initialize Chat when property changes
    useEffect(() => {
        const propertyContext = selectedProperty 
            ? `User is currently viewing Property: ${selectedProperty.name} at ${selectedProperty.address}.`
            : "User has not selected a property yet.";
            
        chatRef.current = createChatSession(propertyContext);
        
        // Optional: Reset messages if property changes? 
        // For now, we keep history but update the system prompt for future messages.
    }, [selectedProperty]);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(scrollToBottom, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || !chatRef.current) return;
        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setLoading(true);

        try {
            const resultStream = await chatRef.current.sendMessageStream({ message: userMsg });
            
            let modelResponseText = "";
            setMessages(prev => [...prev, { role: 'model', text: "" }]); // Placeholder

            for await (const chunk of resultStream) {
                const c = chunk as GenerateContentResponse;
                const text = c.text;
                if (text) {
                    modelResponseText += text;
                    setMessages(prev => {
                        const newArr = [...prev];
                        newArr[newArr.length - 1].text = modelResponseText;
                        return newArr;
                    });
                }
            }
        } catch (error) {
            console.error("Chat Error", error);
            setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting right now." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className={`fixed bottom-6 right-6 ${THEME.colors.buttonPrimary} p-4 rounded-full shadow-2xl z-50 hover:scale-110 transition-transform`}
            >
                {isOpen ? <XMarkIcon className="h-6 w-6" /> : <ChatBubbleIcon className="h-6 w-6" />}
            </button>

            {isOpen && (
                <div className={`fixed bottom-24 right-6 w-80 md:w-96 h-[500px] ${THEME.colors.surface} rounded-xl shadow-2xl border ${THEME.colors.borderSubtle} flex flex-col z-50 animate-in slide-in-from-bottom-10 fade-in duration-300`}>
                    <div className={`${THEME.colors.background} p-4 rounded-t-xl border-b ${THEME.colors.borderSubtle} flex justify-between items-center`}>
                        <div className="flex items-center gap-2">
                             <JesStoneLogo className="h-6 w-6" />
                             <span className={`font-bold ${THEME.colors.textMain}`}>Assistant</span>
                        </div>
                        <button onClick={() => setIsOpen(false)}><XMarkIcon className={`h-5 w-5 ${THEME.colors.textSecondary}`} /></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                        {messages.length === 0 && (
                            <p className={`text-center text-sm ${THEME.colors.textSecondary} mt-10`}>
                                Hello! How can I help you with Jes Stone services today?
                                {selectedProperty && <br/>}<span className="font-bold text-xs">{selectedProperty ? `Regarding: ${selectedProperty.name}` : ''}</span>
                            </p>
                        )}
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${m.role === 'user' ? 'bg-navy text-white' : 'bg-white border border-slate-200 text-slate-800'}`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {loading && <div className="text-xs text-slate-400 ml-2">Thinking...</div>}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-3 border-t border-slate-200 bg-white rounded-b-xl">
                        <div className="flex gap-2">
                            <input 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Type a message..."
                                className={`flex-1 p-2 text-sm border ${THEME.colors.inputBorder} rounded focus:outline-none focus:border-navy`}
                            />
                            <button onClick={handleSend} disabled={loading} className={`${THEME.colors.buttonPrimary} p-2 rounded`}>
                                <PaperAirplaneIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// --- App Component Export ---
export default function App() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [lang, setLang] = useState<'en' | 'es'>('en');
    const [currentRoute, setCurrentRoute] = useState(window.location.hash);
    const [headerTitles, setHeaderTitles] = useState({ title: '', subtitle: '' });
    const [session, setSession] = useState<UserSession | null>(null);
    const [selectedProperty, setSelectedProperty] = useState<Property | undefined>(undefined);

    useEffect(() => {
        const handleHashChange = () => setCurrentRoute(window.location.hash);
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    useEffect(() => {
        fetchCompanyData(BRANDING.defaultApiUrl).then(({data}) => setCompanies(data));
    }, []);

    const handleSelectionChange = (propName: string, companyName: string) => {
        setHeaderTitles({ title: propName, subtitle: companyName });
    };

    // Determine if we show Dashboard view or Main view
    const isDashboard = currentRoute.includes('dashboard') || session !== null;

    return (
        <ErrorBoundary>
            <div className={`min-h-screen ${THEME.colors.background} font-sans text-slate-800`}>
                <Header 
                    lang={lang} 
                    setLang={setLang} 
                    customTitle={headerTitles.title}
                    customSubtitle={headerTitles.subtitle}
                />
                
                <main className="animate-in fade-in duration-500">
                    {isDashboard ? (
                        <Dashboard 
                            companies={companies} 
                            lang={lang} 
                            session={session} 
                            setSession={setSession} 
                        />
                    ) : (
                        <div className="max-w-7xl mx-auto px-4 py-8">
                            <div className="text-center mb-10">
                                <h1 className={`text-4xl font-extrabold ${THEME.colors.textMain} tracking-tight mb-2 uppercase`}>
                                    {translations[lang].surveyTitle}
                                </h1>
                                <p className={`text-lg ${THEME.colors.textSecondary} max-w-2xl mx-auto`}>
                                    Submit your service requests directly to our production team.
                                </p>
                            </div>
                            
                            {/* SIDE BY SIDE GRID LAYOUT */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                                {/* LEFT: SURVEY FORM (2/3 width) */}
                                <div className="lg:col-span-2">
                                    <Survey 
                                        companies={companies} 
                                        lang={lang} 
                                        onSelectionChange={handleSelectionChange}
                                        onPropertySelect={setSelectedProperty}
                                    />
                                </div>

                                {/* RIGHT: LOGIN CARD (1/3 width) */}
                                <div className="lg:col-span-1">
                                    <LoginCard lang={lang} onLogin={setSession} />
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                <ChatWidget selectedProperty={selectedProperty} />
                <Footer />
            </div>
        </ErrorBoundary>
    );
}
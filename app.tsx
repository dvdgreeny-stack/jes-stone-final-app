import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { generateNotesDraft } from './services/geminiService';
import { fetchCompanyData, submitSurveyData } from './services/apiService';
import { translations } from './translations';
import type { Company, SurveyData } from './types';
import { LoadingSpinner, JesStoneLogo, SparklesIcon, PaperAirplaneIcon } from './components/icons';

// --- ACTION REQUIRED ---
// Paste your deployed Google Apps Script Web App URL here.
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwlTxJzHJiJvLFkK1UkFCgrfnuwxspsMBFBigh3IXwkW8ZI1PPkjUWuFm9lz1-zsk59/exec'; 

// --- Navigation Handler ---
const handleNav = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const href = e.currentTarget.getAttribute('href');
    if (href) {
        window.location.hash = href;
    }
};

// --- Layout Components ---
const Header: React.FC<{ surveyUrl: string }> = ({ surveyUrl }) => (
    <header className="bg-light-navy/80 backdrop-blur-sm sticky top-0 z-20 shadow-lg">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-3">
            <a href="#/" onClick={handleNav} className="flex items-center gap-3">
                <JesStoneLogo className="h-10 w-auto" />
                <span className="text-lg font-bold text-lightest-slate tracking-wider">JES STONE <span className="text-slate font-normal">MARKETING</span></span>
            </a>
            <div className="flex items-center space-x-2 sm:space-x-4">
                <a href="#/" onClick={handleNav} className="text-sm sm:text-base font-medium text-lightest-slate bg-lightest-navy/50 px-3 py-2 rounded-md hover:bg-lightest-navy transition-colors">Email Flyer</a>
                <a href={surveyUrl} onClick={handleNav} className="text-sm sm:text-base font-medium text-lightest-slate bg-lightest-navy/50 px-3 py-2 rounded-md hover:bg-lightest-navy transition-colors">Live Survey</a>
            </div>
        </nav>
    </header>
);

const Footer: React.FC = () => (
    <footer className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-12 border-t border-lightest-navy text-center">
        <div className="mb-6">
            <h3 className="text-sm font-bold text-slate tracking-widest uppercase mb-4">Internal Team Contacts</h3>
            <div className="inline-block bg-light-navy p-4 rounded-lg text-left">
                <p className="font-bold text-lightest-slate">David Greenstein</p>
                <p className="text-sm text-bright-cyan">Business Development</p>
            </div>
        </div>
        <div className="flex justify-between items-center text-xs text-slate">
            <p>&copy; {new Date().getFullYear()} Jes Stone Remodeling and Granite | <a href="https://www.jesstone.net" target="_blank" rel="noopener noreferrer" className="hover:text-bright-cyan">www.jesstone.net</a></p>
            <div className="flex items-center gap-2">
                <span>POWERED BY</span>
                <span className="bg-slate text-navy font-bold text-xs px-2 py-1 rounded-sm">AI STUDIO</span>
            </div>
        </div>
    </footer>
);

// --- Main App Component ---
const App: React.FC = () => {
    const [companyData, setCompanyData] = useState<Company[]>([]);
    const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [route, setRoute] = useState({ page: 'campaign', companyId: null as string | null });

    const getRouteFromHash = useCallback((data: Company[]) => {
        const hash = window.location.hash;
        const surveyMatch = hash.match(/^#\/survey\/([a-zA-Z0-9_-]+)/);
        if (surveyMatch && data.find(c => c.id === surveyMatch[1])) {
            return { page: 'survey' as const, companyId: surveyMatch[1] };
        }
        return { page: 'campaign' as const, companyId: null };
    }, []);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await fetchCompanyData(APPS_SCRIPT_URL);
                setCompanyData(data);
                if (data.length > 0) {
                    setSelectedCompanyId(data[0].id);
                }
                setStatus('success');
                setRoute(getRouteFromHash(data));
            } catch (error) {
                console.error("Failed to load company data:", error);
                setStatus('error');
            }
        };
        loadData();
    }, [getRouteFromHash]);
    
    useEffect(() => {
        const handleHashChange = () => {
            if (companyData.length > 0) {
                setRoute(getRouteFromHash(companyData));
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [companyData, getRouteFromHash]);

    const surveyUrlForHeader = `#/survey/${selectedCompanyId}`;

    const renderContent = () => {
        if (status === 'loading') {
            return <div className="text-center py-20"><LoadingSpinner /> <p className="mt-4">Loading Property Data...</p></div>;
        }
        if (status === 'error') {
            return <div className="text-center py-20 text-red-400">
                <h2 className="text-2xl font-bold">Failed to Load Data</h2>
                <p>Please check your APPS_SCRIPT_URL and ensure the Google Script is deployed correctly.</p>
            </div>;
        }
        if (route.page === 'campaign') {
            return <CampaignSuite 
                companyData={companyData}
                onCompanyChange={setSelectedCompanyId} 
                initialCompanyId={selectedCompanyId || (companyData.length > 0 ? companyData[0].id : '')} 
            />;
        }
        if (route.page === 'survey' && route.companyId) {
            return <Survey companyId={route.companyId} companyData={companyData} />;
        }
        return null;
    };

    return (
        <div className="dark min-h-screen bg-navy text-light-slate font-sans">
            <Header surveyUrl={surveyUrlForHeader} />
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {renderContent()}
            </main>
            <Footer />
        </div>
    );
};

// --- Page Components ---
const CampaignSuite: React.FC<{ companyData: Company[], onCompanyChange: (id: string) => void, initialCompanyId: string }> = ({ companyData, onCompanyChange, initialCompanyId }) => {
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(companyData.find(c => c.id === initialCompanyId) || companyData[0] || null);

    const surveyUrl = useMemo(() => {
        if (!selectedCompany) return '#/';
        return `#/survey/${selectedCompany.id}`;
    }, [selectedCompany]);

    const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const company = companyData.find(c => c.id === e.target.value) || null;
        setSelectedCompany(company);
        if (company) {
            onCompanyChange(company.id);
        }
    };
    
    return (
        <div className="bg-light-navy p-6 rounded-lg shadow-2xl">
            <h2 className="text-3xl font-bold text-lightest-slate mb-2">Service Assistant</h2>
            <p className="mb-6 text-bright-cyan">For {selectedCompany?.name || 'DFW'} Properties</p>

            <div className="mb-8">
                <label htmlFor="company-select" className="block text-sm font-medium text-light-slate mb-2">Select Target Company:</label>
                <select id="company-select" value={selectedCompany?.id || ''} onChange={handleCompanyChange} className="w-full bg-navy text-lightest-slate p-3 border border-lightest-navy rounded-md focus:outline-none focus:ring-2 focus:ring-bright-cyan">
                    {companyData.map(company => (
                        <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                </select>
            </div>
            
            <div className="bg-navy p-8 rounded-lg flex flex-col items-center">
                 <div className="bg-platinum text-navy w-full max-w-md p-8 rounded-lg shadow-xl text-center">
                    <div className="flex items-center justify-center gap-4 bg-navy p-4 rounded-md mb-8">
                        <JesStoneLogo className="h-12 w-auto text-bright-cyan" />
                        <span className="text-2xl font-bold text-lightest-slate tracking-wider">JES STONE SERVICES</span>
                    </div>
                    <a href={surveyUrl} onClick={handleNav} className="block w-full bg-navy text-platinum font-bold py-4 px-6 rounded-md hover:bg-lightest-navy transition-all text-lg">
                        Service/ Repair/ Renovation Assistant
                    </a>
                </div>
            </div>
        </div>
    );
};

const Survey: React.FC<{ companyId: string, companyData: Company[] }> = ({ companyId, companyData }) => {
    const [lang, setLang] = useState<'en' | 'es'>('en');
    const t = useMemo(() => translations[lang], [lang]);

    const company = useMemo(() => companyData.find(c => c.id === companyId), [companyId, companyData]);
    
    const getInitialFormData = useCallback(() => {
        const params = new URLSearchParams(window.location.hash.split('?')[1]);
        const firstName = params.get('firstName');
        const email = params.get('email');
        return {
            propertyId: '', 
            firstName: firstName ? decodeURIComponent(firstName) : '', 
            lastName: '', 
            title: '', 
            phone: '', 
            email: email ? decodeURIComponent(email) : '',
            unitInfo: '', 
            services: [], 
            otherService: '', 
            timeline: '', 
            notes: '', 
            contactMethods: [],
        };
    }, []);

    const [formData, setFormData] = useState<SurveyData>(getInitialFormData);
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        setFormData(getInitialFormData());
    }, [companyId, getInitialFormData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (group: 'services' | 'contactMethods', value: string) => {
        setFormData(prev => {
            const currentGroup = prev[group];
            const newGroup = currentGroup.includes(value) ? currentGroup.filter(item => item !== value) : [...currentGroup, value];
            return { ...prev, [group]: newGroup };
        });
    };
    
    const handleGenerateNotes = useCallback(async () => {
        setIsGenerating(true);
        try {
            const draft = await generateNotesDraft(formData, companyData, company?.name || '');
            setFormData(prev => ({ ...prev, notes: draft }));
        } catch (error) {
            console.error("Failed to generate notes:", error);
            setFormData(prev => ({ ...prev, notes: "Sorry, we couldn't generate a draft right now. Please check your API key and try again." }));
        } finally {
            setIsGenerating(false);
        }
    }, [formData, company, companyData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmissionStatus('submitting');
        try {
            await submitSurveyData(APPS_SCRIPT_URL, formData);
            setSubmissionStatus('success');
        } catch (error) {
            console.error('Survey Submission Failed:', error);
            setSubmissionStatus('error');
        }
    };

    if (!company) return <div className="text-center text-red-400">Company not found.</div>;
    const selectedProperty = company.properties.find(p => p.id === formData.propertyId);

    if (submissionStatus === 'success') {
        return (
            <div className="bg-light-navy p-8 rounded-lg shadow-2xl text-center">
                <h2 className="text-3xl font-bold text-bright-cyan mb-4">Thank You!</h2>
                <p className="text-lightest-slate text-lg">Your request has been received.</p>
                <p className="text-slate mt-2">A representative from Jes Stone will contact you shortly for an immediate reply.</p>
                <a href="#/" onClick={handleNav} className="mt-8 inline-block bg-bright-cyan text-navy font-bold py-3 px-6 rounded-md hover:bg-opacity-90 transition-all">
                    Return Home
                </a>
            </div>
        );
    }
    
    if (submissionStatus === 'error') {
         return (
            <div className="bg-light-navy p-8 rounded-lg shadow-2xl text-center">
                <h2 className="text-3xl font-bold text-red-400 mb-4">Submission Failed</h2>
                <p className="text-lightest-slate text-lg">We couldn't submit your request at this time.</p>
                <p className="text-slate mt-2">Please try again later or contact us directly.</p>
                <button onClick={() => setSubmissionStatus('idle')} className="mt-8 inline-block bg-bright-cyan text-navy font-bold py-3 px-6 rounded-md hover:bg-opacity-90 transition-all">
                    Try Again
                </button>
            </div>
        );
    }
  
    return (
      <div className="bg-light-navy p-6 rounded-lg shadow-2xl">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-lightest-slate mb-1">{t.surveyTitle}</h2>
                <p className="mb-6 text-slate">{t.surveySubtitle} <span className="font-bold text-bright-blue">{company.name}</span> {t.surveySubtitleProperties}</p>
            </div>
            <button onClick={() => setLang(lang === 'en' ? 'es' : 'en')} className="text-sm font-medium text-bright-cyan hover:text-opacity-80">
                {t.languageToggle}
            </button>
        </div>
  
        <form onSubmit={handleSubmit} className="space-y-6">
            <fieldset className="p-4 border border-lightest-navy rounded-md">
                <legend className="px-2 text-lg font-semibold text-bright-cyan">{t.propertyIdLegend}</legend>
                <div className="grid md:grid-cols-2 gap-4 mt-2">
                    <div>
                        <label htmlFor="propertyId" className="block text-sm font-medium text-light-slate mb-1">{t.propertyNameLabel}</label>
                        <select id="propertyId" name="propertyId" value={formData.propertyId} onChange={handleInputChange} required className="w-full bg-navy p-2 border border-lightest-navy rounded-md focus:outline-none focus:ring-2 focus:ring-bright-cyan">
                            <option value="">{t.propertySelectPlaceholder} {company.name}{t.propertySelectPlaceholderProperty}</option>
                            {company.properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-light-slate mb-1">{t.propertyAddressLabel}</label>
                        <div className="w-full bg-navy p-2 border border-lightest-navy rounded-md flex items-start text-slate min-h-[40px]">
                            {selectedProperty ? selectedProperty.address : t.addressPlaceholder}
                        </div>
                    </div>
                </div>
            </fieldset>

            <fieldset className="p-4 border border-lightest-navy rounded-md">
                <legend className="px-2 text-lg font-semibold text-bright-cyan">{t.contactInfoLegend}</legend>
                <div className="grid md:grid-cols-2 gap-4 mt-2">
                    <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-light-slate mb-1">{t.firstNameLabel}</label>
                        <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} required className="w-full bg-navy p-2 border border-lightest-navy rounded-md focus:outline-none focus:ring-2 focus:ring-bright-cyan"/>
                    </div>
                    <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-light-slate mb-1">{t.lastNameLabel}</label>
                        <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} required className="w-full bg-navy p-2 border border-lightest-navy rounded-md focus:outline-none focus:ring-2 focus:ring-bright-cyan"/>
                    </div>
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-light-slate mb-1">{t.titleRoleLabel}</label>
                        <select id="title" name="title" value={formData.title} onChange={handleInputChange} required className="w-full bg-navy p-2 border border-lightest-navy rounded-md focus:outline-none focus:ring-2 focus:ring-bright-cyan">
                            <option value="">{t.roleSelectPlaceholder}</option>
                            {t.TITLES.map(title => <option key={title} value={title}>{title}</option>)}
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-light-slate mb-1">{t.phoneLabel}</label>
                        <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} required className="w-full bg-navy p-2 border border-lightest-navy rounded-md focus:outline-none focus:ring-2 focus:ring-bright-cyan"/>
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="email" className="block text-sm font-medium text-light-slate mb-1">{t.emailLabel}</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full bg-navy p-2 border border-lightest-navy rounded-md focus:outline-none focus:ring-2 focus:ring-bright-cyan"/>
                    </div>
                </div>
            </fieldset>

            <fieldset className="p-4 border border-lightest-navy rounded-md">
                <legend className="px-2 text-lg font-semibold text-bright-cyan">{t.scopeTimelineLegend}</legend>
                <div className="space-y-4 mt-2">
                    <div>
                        <label htmlFor="unitInfo" className="block text-sm font-medium text-light-slate mb-1">{t.unitInfoLabel}</label>
                        <input type="text" id="unitInfo" name="unitInfo" value={formData.unitInfo} onChange={handleInputChange} placeholder={t.unitInfoPlaceholder} required className="w-full bg-navy p-2 border border-lightest-navy rounded-md focus:outline-none focus:ring-2 focus:ring-bright-cyan"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-light-slate mb-2">{t.serviceNeededLabel}</label>
                        <div className="grid sm:grid-cols-2 gap-2">
                            {t.SERVICES.map(service => (
                                <label key={service} className={`flex items-center space-x-3 p-3 rounded-md cursor-pointer transition-colors ${formData.services.includes(service) ? 'bg-bright-cyan/20 ring-2 ring-bright-cyan' : 'bg-navy hover:bg-lightest-navy'}`}>
                                    <input type="checkbox" checked={formData.services.includes(service)} onChange={() => handleCheckboxChange('services', service)} className="hidden"/>
                                    <div className={`w-5 h-5 border-2 ${formData.services.includes(service) ? 'border-bright-cyan bg-bright-cyan' : 'border-slate'} rounded-sm flex-shrink-0 flex items-center justify-center`}>
                                        {formData.services.includes(service) && <svg className="w-3 h-3 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7"/></svg>}
                                    </div>
                                    <span>{service}</span>
                                </label>
                            ))}
                        </div>
                        {formData.services.includes(translations.en.SERVICES[7]) && <input type="text" name="otherService" value={formData.otherService} onChange={handleInputChange} placeholder={t.otherServicePlaceholder} className="mt-2 w-full bg-navy p-2 border border-lightest-navy rounded-md focus:outline-none focus:ring-2 focus:ring-bright-cyan"/>}
                    </div>
                    <div>
                        <label htmlFor="timeline" className="block text-sm font-medium text-light-slate mb-1">{t.timelineLabel}</label>
                        <select id="timeline" name="timeline" value={formData.timeline} onChange={handleInputChange} required className="w-full bg-navy p-2 border border-lightest-navy rounded-md focus:outline-none focus:ring-2 focus:ring-bright-cyan">
                            <option value="">{t.timelineSelectPlaceholder}</option>
                            {t.TIMELINES.map(timeline => <option key={timeline} value={timeline}>{timeline}</option>)}
                        </select>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor="notes" className="block text-sm font-medium text-light-slate">{t.notesLabel}</label>
                            <button type="button" onClick={handleGenerateNotes} disabled={isGenerating} className="flex items-center gap-1 text-xs text-bright-pink hover:text-opacity-80 disabled:text-slate">
                                {isGenerating ? <><LoadingSpinner />{t.generatingButton}</> : <><SparklesIcon className="h-4 w-4" /> {t.generateAIDraftButton}</>}
                            </button>
                        </div>
                        <textarea id="notes" name="notes" rows={4} value={formData.notes} onChange={handleInputChange} placeholder={t.notesPlaceholder} className="w-full bg-navy p-2 border border-lightest-navy rounded-md focus:outline-none focus:ring-2 focus:ring-bright-cyan"></textarea>
                    </div>
                </div>
            </fieldset>
            
            <fieldset className="p-4 border border-lightest-navy rounded-md">
                <legend className="px-2 text-lg font-semibold text-bright-cyan">{t.contactMethodLegend}</legend>
                 <div className="grid sm:grid-cols-2 gap-2 mt-2">
                    {t.CONTACT_METHODS.map(method => (
                        <label key={method} className={`flex items-center space-x-3 p-3 rounded-md cursor-pointer transition-colors ${formData.contactMethods.includes(method) ? 'bg-bright-cyan/20 ring-2 ring-bright-cyan' : 'bg-navy hover:bg-lightest-navy'}`}>
                            <input type="checkbox" checked={formData.contactMethods.includes(method)} onChange={() => handleCheckboxChange('contactMethods', method)} className="hidden"/>
                            <div className={`w-5 h-5 border-2 ${formData.contactMethods.includes(method) ? 'border-bright-cyan bg-bright-cyan' : 'border-slate'} rounded-sm flex-shrink-0 flex items-center justify-center`}>
                                {formData.contactMethods.includes(method) && <svg className="w-3 h-3 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7"/></svg>}
                                    </div>
                                    <span>{method}</span>
                                </label>
                            ))}
                </div>
            </fieldset>

            <button type="submit" disabled={submissionStatus === 'submitting'} className="w-full flex items-center justify-center gap-2 bg-bright-cyan text-navy font-bold py-3 px-6 rounded-md hover:bg-opacity-90 transition-all text-lg disabled:bg-slate disabled:cursor-not-allowed">
                {submissionStatus === 'submitting' ? <><LoadingSpinner /> {t.submittingButton}</> : <>{t.submitButton} <PaperAirplaneIcon className="h-5 w-5" /></>}
            </button>
            <p className="text-center text-xs text-slate">Data secured for Jes Stone internal use only.</p>
        </form>
      </div>
    );
};
  
export default App;
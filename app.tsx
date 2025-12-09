import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { generateNotesDraft, createChatSession } from './services/geminiService';
import { fetchCompanyData, submitSurveyData } from './services/apiService';
import { translations } from './translations';
import type { Company, SurveyData } from './types';
import { Chat, GenerateContentResponse } from "@google/genai";
import { LoadingSpinner, JesStoneLogo, SparklesIcon, PaperAirplaneIcon, ChatBubbleIcon, XMarkIcon } from './components/icons';

// --- LOGO CONFIGURATION ---
// 1. PASTE YOUR JES STONE LOGO URL INSIDE THE QUOTES BELOW (e.g., "https://example.com/logo.png")
// Leave empty "" to use the default Triangle placeholder.
const JES_STONE_LOGO_URL = ""; 

// 2. PASTE YOUR DFWSA / AI STUDIO LOGO URL INSIDE THE QUOTES BELOW
// Leave empty "" to use the default AI STUDIO text badge.
const FOOTER_LOGO_URL = ""; 

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

// --- Shared Styles ---
const GLOW_CLASSES = "shadow-[0_5px_15px_rgba(100,255,218,0.4)] hover:shadow-[0_8px_25px_rgba(100,255,218,0.6)] transition-all";

// --- Layout Components ---
const Header: React.FC<{ surveyUrl: string }> = ({ surveyUrl }) => (
    <header className="bg-light-navy/80 backdrop-blur-sm sticky top-0 z-20 shadow-lg">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-center items-center">
            <a href="#/" onClick={handleNav} className="flex items-center gap-3">
                {JES_STONE_LOGO_URL ? (
                    <img src={JES_STONE_LOGO_URL} alt="Jes Stone Logo" className="h-12 w-auto object-contain" />
                ) : (
                    <JesStoneLogo className="h-10 w-auto" />
                )}
                <span className="text-lg font-bold text-lightest-slate tracking-wider text-center">JES STONE <span className="text-slate font-normal">REMODELING & GRANITE</span></span>
            </a>
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
                {FOOTER_LOGO_URL ? (
                    <img src={FOOTER_LOGO_URL} alt="Partner Logo" className="h-8 w-auto object-contain" />
                ) : (
                    <span className="bg-slate text-navy font-bold text-xs px-2 py-1 rounded-sm">AI STUDIO</span>
                )}
            </div>
        </div>
    </footer>
);

// --- Chat Widget Component ---
const ChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatSessionRef = useRef<Chat | null>(null);

    // Initialize chat session on mount
    useEffect(() => {
        chatSessionRef.current = createChatSession();
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !chatSessionRef.current) return;

        const userMessage = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setIsLoading(true);

        try {
            const result = await chatSessionRef.current.sendMessageStream({ message: userMessage });
            
            let fullText = '';
            setMessages(prev => [...prev, { role: 'model', text: '' }]);

            for await (const chunk of result) {
                const c = chunk as GenerateContentResponse;
                const text = c.text || '';
                fullText += text;
                
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    if (lastMsg && lastMsg.role === 'model') {
                        lastMsg.text = fullText;
                    }
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Chat Error", error);
            setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting right now." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {isOpen && (
                <div className="bg-light-navy border border-lightest-navy rounded-lg shadow-2xl w-80 sm:w-96 mb-4 flex flex-col max-h-[500px] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
                    <div className="bg-lightest-navy/50 p-4 border-b border-lightest-navy flex justify-between items-center">
                        <h3 className="font-bold text-lightest-slate">Jes Stone Assistant</h3>
                        <button onClick={() => setIsOpen(false)} className="text-slate hover:text-bright-cyan">
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
                        {messages.length === 0 && (
                            <p className="text-slate text-center text-sm mt-8">
                                Hello! I can help you understand our remodeling services or fill out the survey. How can I help?
                            </p>
                        )}
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-lg text-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-bright-cyan/20 text-lightest-slate rounded-br-none' 
                                    : 'bg-navy border border-lightest-navy text-slate rounded-bl-none'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-navy border border-lightest-navy p-3 rounded-lg rounded-bl-none">
                                    <LoadingSpinner />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleSend} className="p-3 border-t border-lightest-navy bg-navy/50 flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-navy text-lightest-slate text-sm p-2 border border-lightest-navy rounded-md focus:outline-none focus:ring-1 focus:ring-bright-cyan"
                        />
                        <button 
                            type="submit" 
                            disabled={isLoading || !input.trim()}
                            className="bg-bright-cyan/20 text-bright-cyan p-2 rounded-md hover:bg-bright-cyan/30 disabled:opacity-50 transition-colors"
                        >
                            <PaperAirplaneIcon className="h-5 w-5" />
                        </button>
                    </form>
                </div>
            )}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-bright-cyan text-navy p-4 rounded-full shadow-lg hover:bg-bright-cyan/90 transition-all hover:scale-105 active:scale-95"
            >
                {isOpen ? <XMarkIcon className="h-6 w-6" /> : <ChatBubbleIcon className="h-6 w-6" />}
            </button>
        </div>
    );
};

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
        <div className="dark min-h-screen bg-navy text-light-slate font-sans relative">
            <Header surveyUrl={surveyUrlForHeader} />
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {renderContent()}
            </main>
            <Footer />
            <ChatWidget />
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
            <p className="mb-6 text-bright-cyan">For CushWake Properties</p>

            <div className="mb-8">
                <label htmlFor="company-select" className="block text-sm font-medium text-light-slate mb-2">Select Target Company:</label>
                <select 
                    id="company-select" 
                    value={selectedCompany?.id || ''} 
                    onChange={handleCompanyChange} 
                    className={`w-full bg-navy text-lightest-slate p-3 border border-lightest-navy rounded-md focus:outline-none focus:ring-2 focus:ring-bright-cyan ${GLOW_CLASSES}`}
                >
                    {companyData.map(company => (
                        <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                </select>
            </div>
            
            <div className="bg-navy p-8 rounded-lg flex flex-col items-center">
                 <a 
                    href={surveyUrl} 
                    onClick={handleNav} 
                    className={`block w-full max-w-md bg-navy text-platinum font-bold py-4 px-6 rounded-md text-lg text-center hover:-translate-y-1 ${GLOW_CLASSES}`}
                >
                    Service/ Repair/ Renovation Assistant
                </a>
            </div>
        </div>
    );
};

const Survey: React.FC<{ companyId: string, companyData: Company[] }> = ({ companyId, companyData }) => {
    const [lang, setLang] = useState<'en' | 'es'>('en');
    const t = useMemo(() => translations[lang], [lang]);

    const company = useMemo(() => companyData.find(c => c.id === companyId), [companyId, companyData]);
    
    const getInitialFormData = useCallback(() => {
        // 1. Get URL Params
        const params = new URLSearchParams(window.location.hash.split('?')[1]);
        const urlData = {
            firstName: params.get('firstName') ? decodeURIComponent(params.get('firstName')!) : undefined,
            email: params.get('email') ? decodeURIComponent(params.get('email')!) : undefined,
        };

        // 2. Get Local Storage Data (Persisted Session)
        const savedJSON = localStorage.getItem('jes_stone_survey_draft');
        const savedData = savedJSON ? JSON.parse(savedJSON) : {};

        // 3. Defaults
        const defaults = {
            propertyId: '', 
            firstName: '', 
            lastName: '', 
            title: '', 
            phone: '', 
            email: '',
            unitInfo: '', 
            services: [], 
            otherService: '', 
            timeline: '', 
            notes: '', 
            contactMethods: [],
        };

        // Merge: Defaults -> Saved Data -> URL Params (URL takes priority for specific fields)
        return {
            ...defaults,
            ...savedData,
            ...Object.fromEntries(Object.entries(urlData).filter(([_, v]) => v !== undefined))
        };
    }, []);

    const [formData, setFormData] = useState<SurveyData>(getInitialFormData);
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [isGenerating, setIsGenerating] = useState(false);

    // Smart logic for phone number requirement
    const isPhoneRequired = useMemo(() => {
        return formData.contactMethods.includes('Phone Call (immediate)') || formData.contactMethods.includes('Text Message (SMS)');
    }, [formData.contactMethods]);

    // Persist to Local Storage
    useEffect(() => {
        localStorage.setItem('jes_stone_survey_draft', JSON.stringify(formData));
    }, [formData]);

    // Clear Local Storage on Success
    useEffect(() => {
        if (submissionStatus === 'success') {
            localStorage.removeItem('jes_stone_survey_draft');
        }
    }, [submissionStatus]);

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
            <div className={`bg-light-navy p-8 rounded-lg text-center ${GLOW_CLASSES}`}>
                <h2 className="text-3xl font-bold text-bright-cyan mb-4">{t.submitSuccessTitle}</h2>
                <p className="text-lightest-slate text-lg">{t.submitSuccessMessage1}</p>
                <p className="text-slate mt-2">{t.submitSuccessMessage2}</p>
                <a href="#/" onClick={handleNav} className={`mt-8 inline-block bg-bright-cyan text-navy font-bold py-3 px-6 rounded-md hover:bg-opacity-90 transition-all ${GLOW_CLASSES}`}>
                    {t.returnHomeButton}
                </a>
            </div>
        );
    }
    
    if (submissionStatus === 'error') {
         return (
            <div className={`bg-light-navy p-8 rounded-lg text-center ${GLOW_CLASSES}`}>
                <h2 className="text-3xl font-bold text-red-400 mb-4">{t.submitErrorTitle}</h2>
                <p className="text-lightest-slate text-lg">{t.submitErrorMessage1}</p>
                <p className="text-slate mt-2">{t.submitErrorMessage2}</p>
                <button onClick={() => setSubmissionStatus('idle')} className={`mt-8 inline-block bg-bright-cyan text-navy font-bold py-3 px-6 rounded-md hover:bg-opacity-90 transition-all ${GLOW_CLASSES}`}>
                    {t.tryAgainButton}
                </button>
            </div>
        );
    }
  
    return (
      <div className={`bg-light-navy p-6 rounded-lg ${GLOW_CLASSES}`}>
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-lightest-slate mb-1">{t.surveyTitle}</h2>
                <p className="mb-6 text-slate">For <span className="font-bold text-bright-cyan">CushWake</span> Properties</p>
            </div>
            <button onClick={() => setLang(lang === 'en' ? 'es' : 'en')} className="text-sm font-medium text-bright-cyan hover:text-opacity-80 px-3 py-1 rounded-md border border-bright-cyan/50">
                {t.languageToggle}
            </button>
        </div>
  
        <form onSubmit={handleSubmit} className="space-y-6">
            <fieldset className="p-4 border border-lightest-navy rounded-md">
                <legend className="px-2 text-lg font-semibold text-bright-cyan">{t.propertyIdLegend}</legend>
                <div className="grid md:grid-cols-2 gap-4 mt-2">
                    <div>
                        <label htmlFor="propertyId" className="block text-sm font-medium text-light-slate mb-1">{t.propertyNameLabel}</label>
                        <select 
                            id="propertyId" 
                            name="propertyId" 
                            value={formData.propertyId} 
                            onChange={handleInputChange} 
                            required 
                            className={`w-full bg-navy p-2 border border-lightest-navy rounded-md focus:outline-none focus:ring-2 focus:ring-bright-cyan ${GLOW_CLASSES}`}
                        >
                            <option value="">{t.propertySelectPlaceholder}</option>
                            {company.properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-light-slate mb-1">{t.propertyAddressLabel}</label>
                        <div className={`w-full bg-navy p-2 border border-lightest-navy rounded-md flex items-start text-slate min-h-[40px] ${GLOW_CLASSES}`}>
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
                        <input 
                            type="text" 
                            id="firstName" 
                            name="firstName" 
                            value={formData.firstName} 
                            onChange={handleInputChange} 
                            required 
                            className={`w-full bg-navy p-2 border border-lightest-navy rounded-md focus:outline-none focus:ring-2 focus:ring-bright-cyan ${GLOW_CLASSES}`}
                        />
                    </div>
                    <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-light-slate mb-1">{t.lastNameLabel}</label>
                        <input 
                            type="text" 
                            id="lastName" 
                            name="lastName" 
                            value={formData.lastName} 
                            onChange={handleInputChange} 
                            required 
                            className={`w-full bg-navy p-2 border border-lightest-navy rounded-md focus:outline-none focus:ring-2 focus:ring-bright-cyan ${GLOW_CLASSES}`}
                        />
                    </div>
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-light-slate mb-1">{t.titleRoleLabel}</label>
                        <select 
                            id="title" 
                            name="title" 
                            value={formData.title} 
                            onChange={handleInputChange} 
                            required 
                            className={`w-full bg-navy p-2 border border-lightest-navy rounded-md focus:outline-none focus:ring-2 focus:ring-bright-cyan ${GLOW_CLASSES}`}
                        >
                            <option value="">{t.roleSelectPlaceholder}</option>
                            {t.TITLES.map(title => <option key={title} value={title}>{title}</option>)}
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-light-slate mb-1">
                            {t.phoneLabel} 
                            {isPhoneRequired && <span className="text-bright-pink ml-1">*</span>}
                        </label>
                        <input 
                            type="tel" 
                            id="phone" 
                            name="phone" 
                            value={formData.phone} 
                            onChange={handleInputChange} 
                            required={isPhoneRequired} 
                            className={`w-full bg-navy p-2 border border-lightest-navy rounded-md focus:outline-none focus:ring-2 focus:ring-bright-cyan ${GLOW_CLASSES}`}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="email" className="block text-sm font-medium text-light-slate mb-1">{t.emailLabel}</label>
                        <input 
                            type="email" 
                            id="email" 
                            name="email" 
                            value={formData.email} 
                            onChange={handleInputChange} 
                            required 
                            className={`w-full bg-navy p-2 border border-lightest-navy rounded-md focus:outline-none focus:ring-2 focus:ring-bright-cyan ${GLOW_CLASSES}`}
                        />
                    </div>
                </div>
            </fieldset>

            <fieldset className="p-4 border border-lightest-navy rounded-md">
                <legend className="px-2 text-lg font-semibold text-bright-cyan">{t.scopeTimelineLegend}</legend>
                <div className="space-y-4 mt-2">
                    <div>
                        <label htmlFor="unitInfo" className="block text-sm font-medium text-light-slate mb-1">{t.unitInfoLabel}</label>
                        <input 
                            type="text" 
                            id="unitInfo" 
                            name="unitInfo" 
                            value={formData.unitInfo} 
                            onChange={handleInputChange} 
                            placeholder={t.unitInfoPlaceholder} 
                            required 
                            className={`w-full bg-navy p-2 border border-lightest-navy rounded-md focus:outline-none focus:ring-2 focus:ring-bright-cyan ${GLOW_CLASSES}`}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-light-slate mb-2">{t.serviceNeededLabel}</label>
                        <div className="grid sm:grid-cols-2 gap-2">
                            {t.SERVICES.map(service => (
                                <label key={service} className={`flex items-center space-x-3 p-3 rounded-md cursor-pointer transition-colors ${formData.services.includes(service) ? 'bg-bright-cyan/20 ring-2 ring-bright-cyan' : 'bg-navy hover:bg-lightest-navy'} ${GLOW_CLASSES}`}>
                                    <input type="checkbox" checked={formData.services.includes(service)} onChange={() => handleCheckboxChange('services', service)} className="hidden"/>
                                    <div className={`w-5 h-5 border-2 ${formData.services.includes(service) ? 'border-bright-cyan bg-bright-cyan' : 'border-slate'} rounded-sm flex-shrink-0 flex items-center justify-center`}>
                                        {formData.services.includes(service) && <svg className="w-3 h-3 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7"/></svg>}
                                    </div>
                                    <span>{service}</span>
                                </label>
                            ))}
                        </div>
                        {formData.services.some(s => s.startsWith('Other') || s.startsWith('Otro')) && <input type="text" name="otherService" value={formData.otherService} onChange={handleInputChange} placeholder={t.otherServicePlaceholder} className={`mt-2 w-full bg-navy p-2 border border-lightest-navy rounded-md focus:outline-none focus:ring-2 focus:ring-bright-cyan ${GLOW_CLASSES}`}/>}
                    </div>
                    <div>
                        <label htmlFor="timeline" className="block text-sm font-medium text-light-slate mb-1">{t.timelineLabel}</label>
                        <select 
                            id="timeline" 
                            name="timeline" 
                            value={formData.timeline} 
                            onChange={handleInputChange} 
                            required 
                            className={`w-full bg-navy p-2 border border-lightest-navy rounded-md focus:outline-none focus:ring-2 focus:ring-bright-cyan ${GLOW_CLASSES}`}
                        >
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
                        <textarea 
                            id="notes" 
                            name="notes" 
                            rows={4} 
                            value={formData.notes} 
                            onChange={handleInputChange} 
                            placeholder={t.notesPlaceholder} 
                            className={`w-full bg-navy p-2 border border-lightest-navy rounded-md focus:outline-none focus:ring-2 focus:ring-bright-cyan ${GLOW_CLASSES}`}
                        ></textarea>
                    </div>
                </div>
            </fieldset>
            
            <fieldset className="p-4 border border-lightest-navy rounded-md">
                <legend className="px-2 text-lg font-semibold text-bright-cyan">{t.contactMethodLegend}</legend>
                 <div className="grid sm:grid-cols-2 gap-2 mt-2">
                    {t.CONTACT_METHODS.map(method => (
                        <label key={method} className={`flex items-center space-x-3 p-3 rounded-md cursor-pointer transition-colors ${formData.contactMethods.includes(method) ? 'bg-bright-cyan/20 ring-2 ring-bright-cyan' : 'bg-navy hover:bg-lightest-navy'} ${GLOW_CLASSES}`}>
                            <input type="checkbox" checked={formData.contactMethods.includes(method)} onChange={() => handleCheckboxChange('contactMethods', method)} className="hidden"/>
                            <div className={`w-5 h-5 border-2 ${formData.contactMethods.includes(method) ? 'border-bright-cyan bg-bright-cyan' : 'border-slate'} rounded-sm flex-shrink-0 flex items-center justify-center`}>
                                {formData.contactMethods.includes(method) && <svg className="w-3 h-3 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7"/></svg>}
                                    </div>
                                    <span>{method}</span>
                                </label>
                            ))}
                </div>
            </fieldset>

            <button type="submit" disabled={submissionStatus === 'submitting'} className={`w-full flex items-center justify-center gap-2 bg-bright-cyan text-navy font-bold py-3 px-6 rounded-md hover:bg-opacity-90 transition-all text-lg disabled:bg-slate disabled:cursor-not-allowed ${GLOW_CLASSES}`}>
                {submissionStatus === 'submitting' ? <><LoadingSpinner /> {t.submittingButton}</> : <>{t.submitButton} <PaperAirplaneIcon className="h-5 w-5" /></>}
            </button>
            <p className="text-center text-xs text-slate">Data secured for Jes Stone internal use only.</p>
        </form>
      </div>
    );
};
  
export default App;
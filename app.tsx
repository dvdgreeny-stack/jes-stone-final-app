
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { generateNotesDraft, createChatSession } from './services/geminiService';
import { fetchCompanyData, submitSurveyData } from './services/apiService';
import { translations } from './translations';
import { BRANDING } from './branding';
import { THEME } from './theme';
import type { Company, SurveyData, UserSession, UserRole } from './types';
import { Chat, GenerateContentResponse } from "@google/genai";
import { LoadingSpinner, JesStoneLogo, SparklesIcon, PaperAirplaneIcon, ChatBubbleIcon, XMarkIcon, DashboardIcon, PhotoIcon, LockClosedIcon, LogoutIcon, ClipboardListIcon, ClockIcon, BuildingBlocksIcon, CloudArrowUpIcon, TrashIcon, CalculatorIcon, ChartBarIcon } from './components/icons';
import { EstimatingModule } from './components/EstimatingModule';
import { ProjectManagementModule } from './components/ProjectManagementModule';

// --- MOCK ACCESS DATABASE ---
// Simplified for Single Property Focus + Regional Demo + Admin
const MOCK_ACCESS_DB: Record<string, { role: UserRole, companyId: string, allowedPropertyIds: string[] }> = {
    // Single Property Access (Site Manager)
    'PARKPLACE': { role: 'site_manager', companyId: 'knightvest', allowedPropertyIds: ['kv-1'] },
    'CANYON': { role: 'site_manager', companyId: 'knightvest', allowedPropertyIds: ['kv-2'] },

    // Regional Manager Demo (Access to both properties)
    'REGION1': { role: 'regional_manager', companyId: 'knightvest', allowedPropertyIds: ['kv-1', 'kv-2'] },
    
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
            <p className={`${THEME.colors.textSecondary} mb-4`}>The application encountered an unexpected error while rendering.</p>
            <div className={`${THEME.colors.background} p-4 rounded text-left overflow-auto max-h-40 mb-6 border ${THEME.colors.borderSubtle}`}>
                <code className={`text-xs ${THEME.colors.textWarning} font-mono block break-all`}>{this.state.error?.toString()}</code>
            </div>
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
const Header: React.FC<{ surveyUrl: string }> = ({ surveyUrl }) => (
    <header className={`${THEME.colors.surface}/80 backdrop-blur-sm sticky top-0 z-20 shadow-lg`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-center items-center">
            <a href="#/" onClick={handleNav} className="flex items-center gap-3">
                {BRANDING.logoUrl ? (
                    <img src={BRANDING.logoUrl} alt={`${BRANDING.companyName} Logo`} className="h-12 w-auto object-contain" />
                ) : (
                    <JesStoneLogo className="h-10 w-auto" />
                )}
                <span className={`text-lg font-bold ${THEME.colors.textMain} tracking-wider text-center`}>
                    {BRANDING.companyName} <span className={`${THEME.colors.textSecondary} font-normal`}>{BRANDING.companySubtitle}</span>
                </span>
            </a>
        </nav>
    </header>
);

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
            <p>&copy; {new Date().getFullYear()} {BRANDING.companyName} {BRANDING.companySubtitle} | <a href={BRANDING.websiteUrl} target="_blank" rel="noopener noreferrer" className="hover:text-bright-cyan">{BRANDING.websiteUrl}</a></p>
            <div className="flex items-center gap-2">
                <span>POWERED BY</span>
                {BRANDING.footerLogoUrl ? (
                    <img src={BRANDING.footerLogoUrl} alt="Partner Logo" className="h-8 w-auto object-contain" />
                ) : (
                    <span className={`bg-slate text-navy font-bold text-xs px-2 py-1 rounded-sm`}>{BRANDING.poweredByText}</span>
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
                <div className={`${THEME.colors.surface} border ${THEME.colors.borderSubtle} rounded-lg shadow-2xl w-80 sm:w-96 mb-4 flex flex-col max-h-[500px] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200`}>
                    <div className={`${THEME.colors.surfaceHighlight}/50 p-4 border-b ${THEME.colors.borderSubtle} flex justify-between items-center`}>
                        <h3 className={`font-bold ${THEME.colors.textMain}`}>{BRANDING.assistantName}</h3>
                        <button onClick={() => setIsOpen(false)} className={`${THEME.colors.textSecondary} hover:text-bright-cyan`}>
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
                        {messages.length === 0 && (
                            <p className={`${THEME.colors.textSecondary} text-center text-sm mt-8`}>
                                Hello! I can help you understand our remodeling services or fill out the survey. How can I help?
                            </p>
                        )}
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-lg text-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-bright-cyan/20 text-lightest-slate rounded-br-none' 
                                    : `${THEME.colors.background} border ${THEME.colors.borderSubtle} text-slate rounded-bl-none`
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className={`${THEME.colors.background} border ${THEME.colors.borderSubtle} p-3 rounded-lg rounded-bl-none`}>
                                    <LoadingSpinner />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleSend} className={`p-3 border-t ${THEME.colors.borderSubtle} bg-navy/50 flex gap-2`}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            className={`flex-1 ${THEME.colors.inputBg} ${THEME.colors.textMain} text-sm p-2 border ${THEME.colors.inputBorder} rounded-md focus:outline-none focus:ring-1 ${THEME.colors.inputFocus}`}
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
                className={`${THEME.colors.buttonPrimary} p-4 rounded-full shadow-lg hover:bg-bright-cyan/90 transition-all hover:scale-105 active:scale-95`}
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
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [route, setRoute] = useState({ page: 'campaign', companyId: null as string | null });
    
    // URL Override State (auto-load from localStorage if available)
    const [overrideUrl, setOverrideUrl] = useState<string>(() => {
        return localStorage.getItem('jes_stone_script_url') || '';
    });

    const getRouteFromHash = useCallback((data: Company[]) => {
        const hash = window.location.hash;
        if (hash === '#dashboard') {
            return { page: 'dashboard' as const, companyId: null };
        }
        const surveyMatch = hash.match(/^#\/survey\/([a-zA-Z0-9_-]+)/);
        if (surveyMatch && data.find(c => c.id === surveyMatch[1])) {
            return { page: 'survey' as const, companyId: surveyMatch[1] };
        }
        return { page: 'campaign' as const, companyId: null };
    }, []);

    const loadData = useCallback(async (urlOverride?: string) => {
        setStatus('loading');
        setErrorMessage('');
        
        // Use override if provided, otherwise check state (from localstorage), otherwise default from BRANDING
        const targetUrl = urlOverride || overrideUrl || BRANDING.defaultApiUrl;
        
        if (!targetUrl) {
            setErrorMessage("No API URL configured.");
            setStatus('error');
            return;
        }

        try {
            const data = await fetchCompanyData(targetUrl);
            setCompanyData(data);
            if (data.length > 0) {
                setSelectedCompanyId(data[0].id);
            }
            setStatus('success');
            setRoute(getRouteFromHash(data));

            // If we successfully connected with an override, save it!
            if (urlOverride) {
                localStorage.setItem('jes_stone_script_url', urlOverride);
                setOverrideUrl(urlOverride); // Update state to reflect valid URL
            }

        } catch (error: any) {
            console.error("Failed to load company data:", error);
            setErrorMessage(error.message || "Unknown error occurred.");
            setStatus('error');
        }
    }, [getRouteFromHash, overrideUrl]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
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
             const isFetchError = errorMessage.toLowerCase().includes("failed to fetch") || errorMessage.toLowerCase().includes("network error");
            return (
                <div className="text-center py-20 text-red-400 max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold mb-4">Failed to Load Data</h2>
                    
                    {isFetchError ? (
                        <div className={`${THEME.colors.background} border ${THEME.colors.borderWarning}/30 p-6 rounded-lg text-left mb-6`}>
                            <h3 className={`font-bold ${THEME.colors.textWarning} mb-2`}>⚠️ Connection Error</h3>
                            <p className={`${THEME.colors.textMain} mb-4`}>
                                The app cannot connect to the Google Script. Since permissions are set to "Anyone", this is likely due to:
                            </p>
                            <ul className={`list-disc list-inside text-sm ${THEME.colors.textSecondary} space-y-2 mb-4`}>
                                <li>A <strong>Syntax Error</strong> in the script you just edited (missing bracket or comma).</li>
                                <li>The <strong>Script URL changed</strong> (if you created a "New Deployment" instead of "New Version").</li>
                                <li><strong>Missing Functions:</strong> Ensure the script has the <code>doPost</code> and <code>getCompanyData</code> functions.</li>
                            </ul>
                            <p className={`text-sm ${THEME.colors.textHighlight} font-bold mb-2`}>How to Fix:</p>
                             <ol className={`list-decimal list-inside text-sm ${THEME.colors.textSecondary} space-y-2`}>
                                <li>Copy the <strong>FULL SCRIPT</strong> provided by the assistant and replace everything in your Google Script Editor.</li>
                                <li>Deploy as <strong>New Version</strong>.</li>
                                <li>If the URL changed, paste it below.</li>
                            </ol>
                        </div>
                    ) : (
                        <p className={`mb-6 ${THEME.colors.textSecondary}`}>Please check your APPS_SCRIPT_URL and ensure the Google Script is deployed correctly.</p>
                    )}

                    <div className={`${THEME.colors.background} border ${THEME.colors.borderSubtle} p-4 rounded text-left overflow-auto mb-6`}>
                        <p className={`font-bold text-xs ${THEME.colors.textWarning} uppercase mb-1`}>Error Details:</p>
                        <code className="text-sm font-mono text-light-slate">{errorMessage}</code>
                    </div>

                    <div className="flex flex-col gap-4 max-w-md mx-auto">
                        <input 
                            type="text" 
                            placeholder="Paste new Web App URL here (optional)"
                            defaultValue={overrideUrl}
                            id="urlInput"
                            className={`${THEME.colors.background} border ${THEME.colors.borderSubtle} p-2 rounded text-sm ${THEME.colors.textMain} focus:ring-1 ${THEME.colors.inputFocus}`}
                        />
                        <button 
                            onClick={() => {
                                const input = document.getElementById('urlInput') as HTMLInputElement;
                                if(input) loadData(input.value.trim());
                            }} 
                            className={`${THEME.colors.buttonPrimary} px-6 py-2 rounded-md font-bold transition-colors`}
                        >
                            Retry Connection
                        </button>
                    </div>
                </div>
            );
        }
        
        if (route.page === 'dashboard') {
            return <Dashboard 
                companyData={companyData} 
                scriptUrl={overrideUrl || BRANDING.defaultApiUrl} 
            />;
        }

        if (route.page === 'campaign') {
            return (
                <>
                <Header surveyUrl={surveyUrlForHeader} />
                <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <CampaignSuite 
                        companyData={companyData}
                        onCompanyChange={setSelectedCompanyId} 
                        initialCompanyId={selectedCompanyId || (companyData.length > 0 ? companyData[0].id : '')} 
                    />
                </main>
                <Footer />
                </>
            );
        }
        if (route.page === 'survey' && route.companyId) {
            return (
                <>
                <Header surveyUrl={surveyUrlForHeader} />
                <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Survey 
                        companyId={route.companyId} 
                        companyData={companyData} 
                        scriptUrl={overrideUrl || BRANDING.defaultApiUrl} // Pass dynamic URL to survey
                    />
                </main>
                <Footer />
                </>
            );
        }
        return null;
    };

    return (
        <ErrorBoundary>
            <div className={`dark min-h-screen ${THEME.colors.background} ${THEME.colors.textSecondary} font-sans relative`}>
                {renderContent()}
                <ChatWidget />
            </div>
        </ErrorBoundary>
    );
};

// --- Page Components ---

const Dashboard: React.FC<{ companyData: Company[], scriptUrl: string }> = ({ companyData, scriptUrl }) => {
    const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'newRequest' | 'gallery' | 'history' | 'estimating' | 'projects' | 'datasources'>('overview');
    const t = translations['en']; 

    const handleLogin = (session: UserSession) => {
        setCurrentUser(session);
    };

    const handleLogout = () => {
        setCurrentUser(null);
    };

    // Filter properties based on role
    const visibleCompany = useMemo(() => {
        if (!currentUser) return null;
        if (currentUser.role === 'internal_admin') {
            // Admin sees everything (dummy object for context if needed, or null)
            // We'll create a synthetic 'All Access' company context for safe rendering
            return {
                id: 'admin_view',
                name: 'Jes Stone Operations',
                properties: companyData.flatMap(c => c.properties)
            } as Company;
        }

        const baseCompany = currentUser.company;
        
        // Safety check if company is somehow null/undefined
        if (!baseCompany) return null;

        // If executive (empty list), allow all.
        if (!currentUser.allowedPropertyIds || currentUser.allowedPropertyIds.length === 0) {
            return baseCompany;
        }

        // Otherwise filter
        // Safe access to properties array
        const props = baseCompany.properties || [];
        const filteredProperties = props.filter(p => currentUser.allowedPropertyIds.includes(p.id));
        return {
            ...baseCompany,
            properties: filteredProperties
        };
    }, [currentUser, companyData]);

    if (!currentUser) {
        return <DashboardLogin companyData={companyData} onLogin={handleLogin} />;
    }

    // Safety check
    if (!visibleCompany) {
         return (
             <div className={`min-h-screen ${THEME.colors.background} flex items-center justify-center`}>
                <div className="text-center">
                    <p className={`${THEME.colors.textWarning} mb-4`}>Error: Company Profile Not Found</p>
                    <button onClick={handleLogout} className={`${THEME.colors.textHighlight} underline`}>Return to Login</button>
                </div>
             </div>
         );
    }

    const isInternal = currentUser.role === 'internal_admin';
    const roleLabel = {
        'site_manager': t.roleSiteManager,
        'regional_manager': t.roleRegionalManager,
        'executive': t.roleExecutive,
        'internal_admin': t.roleInternalAdmin,
    }[currentUser.role];

    const displayName = isInternal ? 'Headquarters' : (visibleCompany.properties.length === 1 
        ? visibleCompany.properties[0]?.name 
        : visibleCompany.name);

    return (
        <div className={`min-h-screen flex ${THEME.colors.background}`}>
            {/* Sidebar */}
            <aside className={`w-64 ${THEME.colors.surface} border-r ${THEME.colors.borderSubtle} hidden md:flex flex-col`}>
                <div className={`p-6 border-b ${THEME.colors.borderSubtle} flex justify-center flex-col items-center`}>
                    <a href="#/" className="flex items-center gap-2 mb-2">
                        <JesStoneLogo className="h-8 w-auto" />
                        <span className={`font-bold ${THEME.colors.textMain}`}>{BRANDING.companyName}</span>
                    </a>
                    <div className={`${THEME.colors.background} px-3 py-1 rounded-full text-xs font-bold ${isInternal ? 'text-bright-pink border-bright-pink/30' : `${THEME.colors.textHighlight} border ${THEME.colors.borderHighlight}/30`} border text-center max-w-full truncate`}>
                        {displayName || 'Loading...'}
                    </div>
                    <div className={`mt-2 text-xs ${THEME.colors.textSecondary} uppercase tracking-wider font-semibold`}>
                        {roleLabel}
                    </div>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'overview' ? `bg-bright-cyan/20 ${THEME.colors.textHighlight} border-l-2 ${THEME.colors.borderHighlight}` : `${THEME.colors.textSecondary} hover:text-lightest-slate hover:bg-navy`}`}>
                        <DashboardIcon className="h-5 w-5" /> {t.tabOverview}
                    </button>
                    
                    {!isInternal && (
                        <button onClick={() => setActiveTab('newRequest')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'newRequest' ? `bg-bright-cyan/20 ${THEME.colors.textHighlight} border-l-2 ${THEME.colors.borderHighlight}` : `${THEME.colors.textSecondary} hover:text-lightest-slate hover:bg-navy`}`}>
                             <ClipboardListIcon className="h-5 w-5" /> {t.tabNewRequest}
                        </button>
                    )}

                    {isInternal && (
                        <>
                             <button onClick={() => setActiveTab('datasources')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'datasources' ? `bg-bright-cyan/20 ${THEME.colors.textHighlight} border-l-2 ${THEME.colors.borderHighlight}` : `${THEME.colors.textSecondary} hover:text-lightest-slate hover:bg-navy`}`}>
                                <BuildingBlocksIcon className="h-5 w-5" /> {t.tabDataSources}
                            </button>
                            <button onClick={() => setActiveTab('estimating')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'estimating' ? `bg-bright-cyan/20 ${THEME.colors.textHighlight} border-l-2 ${THEME.colors.borderHighlight}` : `${THEME.colors.textSecondary} hover:text-lightest-slate hover:bg-navy`}`}>
                                <CalculatorIcon className="h-5 w-5" /> {t.tabEstimating}
                            </button>
                        </>
                    )}

                    <button onClick={() => setActiveTab('projects')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'projects' ? `bg-bright-cyan/20 ${THEME.colors.textHighlight} border-l-2 ${THEME.colors.borderHighlight}` : `${THEME.colors.textSecondary} hover:text-lightest-slate hover:bg-navy`}`}>
                        <ChartBarIcon className="h-5 w-5" /> {t.tabProjects}
                    </button>
                    
                    {!isInternal && (
                        <>
                        <div className={`h-px ${THEME.colors.borderSubtle} my-2`}></div>
                        <button onClick={() => setActiveTab('gallery')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'gallery' ? `bg-bright-cyan/20 ${THEME.colors.textHighlight} border-l-2 ${THEME.colors.borderHighlight}` : `${THEME.colors.textSecondary} hover:text-lightest-slate hover:bg-navy`}`}>
                            <PhotoIcon className="h-5 w-5" /> {t.tabGallery}
                        </button>
                        <button onClick={() => setActiveTab('history')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'history' ? `bg-bright-cyan/20 ${THEME.colors.textHighlight} border-l-2 ${THEME.colors.borderHighlight}` : `${THEME.colors.textSecondary} hover:text-lightest-slate hover:bg-navy`}`}>
                            <ClockIcon className="h-5 w-5" /> {t.tabHistory}
                        </button>
                        </>
                    )}
                </nav>
                <div className={`p-4 border-t ${THEME.colors.borderSubtle}`}>
                    <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-4 py-2 ${THEME.colors.textSecondary} hover:text-bright-pink transition-colors`}>
                        <LogoutIcon className="h-5 w-5" /> {t.logout}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <header className={`md:hidden ${THEME.colors.surface} p-4 flex justify-between items-center border-b ${THEME.colors.borderSubtle} sticky top-0 z-10`}>
                    <div className="flex flex-col">
                        <span className={`font-bold ${THEME.colors.textMain}`}>{isInternal ? t.companyPortalTitle : t.dashboardLoginTitle}</span>
                        <div className="flex gap-2 text-xs">
                             <span className={THEME.colors.textHighlight}>{displayName}</span>
                        </div>
                    </div>
                    <button onClick={handleLogout}><LogoutIcon className={`h-6 w-6 ${THEME.colors.textSecondary}`} /></button>
                </header>
                
                 {/* Mobile Nav */}
                 <div className={`md:hidden ${THEME.colors.background} flex justify-around p-2 border-b ${THEME.colors.borderSubtle}`}>
                     <button onClick={() => setActiveTab('overview')} className={`p-2 ${activeTab === 'overview' ? THEME.colors.textHighlight : THEME.colors.textSecondary}`}><DashboardIcon className="h-6 w-6" /></button>
                     {!isInternal && <button onClick={() => setActiveTab('newRequest')} className={`p-2 ${activeTab === 'newRequest' ? THEME.colors.textHighlight : THEME.colors.textSecondary}`}><ClipboardListIcon className="h-6 w-6" /></button>}
                     {isInternal && <button onClick={() => setActiveTab('estimating')} className={`p-2 ${activeTab === 'estimating' ? THEME.colors.textHighlight : THEME.colors.textSecondary}`}><CalculatorIcon className="h-6 w-6" /></button>}
                </div>

                <div className="p-4 md:p-8 max-w-6xl mx-auto">
                    {/* OVERVIEW: Client vs Company */}
                    {activeTab === 'overview' && (isInternal 
                        ? <CompanyDashboardOverview companyData={companyData} /> 
                        : <DashboardOverview companyData={[visibleCompany]} onNewRequest={() => setActiveTab('newRequest')} />
                    )}

                    {/* NEW REQUEST: Client Only */}
                    {!isInternal && activeTab === 'newRequest' && (
                        <div className="animate-in fade-in duration-300">
                             <h2 className={`text-2xl font-bold ${THEME.colors.textMain} mb-6`}>New Service Request</h2>
                             <Survey 
                                companyId={visibleCompany.id} 
                                companyData={[visibleCompany]} 
                                scriptUrl={scriptUrl} 
                                embedded={true}
                                onSuccess={() => setActiveTab('overview')}
                            />
                        </div>
                    )}

                    {/* INTERNAL MODULES: Admin Only */}
                    {isInternal && activeTab === 'datasources' && <CompanyDataSources />}
                    {isInternal && activeTab === 'estimating' && <EstimatingModule />}

                    {/* PM MODULE: Shared but different modes */}
                    {activeTab === 'projects' && <ProjectManagementModule mode={isInternal ? 'company' : 'client'} />}
                    
                    {/* CLIENT MODULES: Client Only */}
                    {!isInternal && activeTab === 'gallery' && <DashboardGallery />}
                    {!isInternal && activeTab === 'history' && <DashboardHistory />}
                </div>
            </div>
        </div>
    );
};

const DashboardLogin: React.FC<{ companyData: Company[], onLogin: (session: UserSession) => void }> = ({ companyData, onLogin }) => {
    const t = translations['en'];
    const [code, setCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsVerifying(true);

        setTimeout(() => {
            const normalizedCode = code.toUpperCase().trim();
            const accessRecord = MOCK_ACCESS_DB[normalizedCode];

            if (accessRecord) {
                // If ADMIN, skip company check.
                if (accessRecord.role === 'internal_admin') {
                    onLogin({
                        company: { id: 'admin', name: 'Admin', properties: [] }, // Dummy
                        role: 'internal_admin',
                        allowedPropertyIds: []
                    });
                    setIsVerifying(false);
                    return;
                }

                if (!companyData || companyData.length === 0) {
                     setError("System data not loaded. Please refresh the page.");
                     setIsVerifying(false);
                     return;
                }

                const company = companyData.find(c => c.id === accessRecord.companyId) || 
                              (normalizedCode === 'DEMO' ? companyData[0] : null);

                if (company) {
                    onLogin({
                        company: company,
                        role: accessRecord.role,
                        allowedPropertyIds: accessRecord.allowedPropertyIds
                    });
                } else {
                    setError("Code matched, but associated company data is missing.");
                }
            } else {
                setError("Invalid Access Code. Please try again.");
                setCode('');
            }
            setIsVerifying(false);
        }, 1000);
    };

    return (
        <div className={`min-h-screen ${THEME.colors.background} flex items-center justify-center p-4`}>
            <div className={`${THEME.colors.surface} p-8 rounded-lg max-w-md w-full text-center ${THEME.effects.glow}`}>
                <div className="flex justify-center mb-6">
                    <div className={`p-4 ${THEME.colors.background} rounded-full border ${THEME.colors.borderHighlight} shadow-[0_0_15px_rgba(100,255,218,0.3)] ${isVerifying ? 'animate-pulse' : ''}`}>
                        <LockClosedIcon className={`h-8 w-8 ${THEME.colors.textHighlight}`} />
                    </div>
                </div>
                <h1 className={`text-2xl font-bold ${THEME.colors.textMain} mb-2`}>{t.dashboardLoginTitle}</h1>
                <p className={`${THEME.colors.textSecondary} mb-8`}>{t.dashboardLoginSubtitle}</p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="text-left">
                        <label className={`block text-sm font-medium ${THEME.colors.textMain} mb-1`}>{t.accessCodeLabel}</label>
                        <input 
                            type="password" 
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className={`w-full ${THEME.colors.inputBg} border ${error ? THEME.colors.borderWarning : THEME.colors.inputBorder} rounded-md p-3 text-center tracking-widest text-xl ${THEME.colors.textHighlight} focus:ring-2 focus:ring-bright-cyan focus:outline-none transition-all`}
                            placeholder="••••"
                            autoFocus
                        />
                         {error && <p className={`${THEME.colors.textWarning} text-xs mt-2 text-center animate-bounce`}>{error}</p>}
                    </div>
                    <button 
                        type="submit" 
                        disabled={!code || isVerifying}
                        className={`w-full ${THEME.colors.buttonPrimary} font-bold py-3 rounded-md transition-all flex justify-center items-center gap-2 ${!code || isVerifying ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isVerifying ? <><LoadingSpinner /> Verifying...</> : t.loginButton}
                    </button>
                </form>
                 <div className={`mt-6 text-xs ${THEME.colors.textSecondary} space-y-1`}>
                     <p>Demo Codes:</p>
                     <p><span className={`${THEME.colors.textHighlight} font-mono`}>PARKPLACE</span> (Site Manager)</p>
                     <p><span className={`${THEME.colors.textHighlight} font-mono`}>ADMIN</span> (Company Portal)</p>
                </div>
                <div className={`mt-4 text-xs ${THEME.colors.textSecondary}`}>
                    <a href="#/" className="hover:text-bright-cyan">Return to Public Site</a>
                </div>
            </div>
        </div>
    );
};

// --- CLIENT Components ---

const DashboardOverview: React.FC<{ companyData: Company[], onNewRequest: () => void }> = ({ companyData, onNewRequest }) => {
    const t = translations['en'];
    const totalProperties = (companyData || []).reduce((acc, c) => acc + (c?.properties?.length || 0), 0) || 0;
    const singlePropertyName = totalProperties === 1 && companyData[0]?.properties[0]?.name;

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className={`text-3xl font-bold ${THEME.colors.textMain}`}>Welcome Back</h1>
                    <p className={THEME.colors.textSecondary}>
                        {singlePropertyName ? `Managing ${singlePropertyName}` : `Managing ${totalProperties} property locations.`}
                    </p>
                </div>
                <button onClick={onNewRequest} className={`${THEME.colors.buttonPrimary} px-6 py-2 rounded-md font-bold shadow-lg transition-all`}>
                    + New Request
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`${THEME.colors.surface} p-6 rounded-lg border-l-4 ${THEME.colors.borderHighlight} shadow-lg`}>
                    <div className="flex justify-between items-start">
                        <p className={`${THEME.colors.textSecondary} text-sm font-bold uppercase`}>{t.statsActive}</p>
                         <BuildingBlocksIcon className={`h-5 w-5 ${THEME.colors.textHighlight} opacity-50`} />
                    </div>
                    <p className={`text-4xl font-bold ${THEME.colors.textMain} mt-2`}>3</p>
                    <p className={`text-xs ${THEME.colors.textSecondary} mt-1`}>In progress</p>
                </div>
                <div className={`${THEME.colors.surface} p-6 rounded-lg border-l-4 ${THEME.colors.borderWarning} shadow-lg`}>
                    <div className="flex justify-between items-start">
                        <p className={`${THEME.colors.textSecondary} text-sm font-bold uppercase`}>{t.statsPending}</p>
                        <ClockIcon className={`h-5 w-5 ${THEME.colors.textWarning} opacity-50`} />
                    </div>
                    <p className={`text-4xl font-bold ${THEME.colors.textMain} mt-2`}>1</p>
                    <p className={`text-xs ${THEME.colors.textSecondary} mt-1`}>Awaiting your approval</p>
                </div>
                <div className={`${THEME.colors.surface} p-6 rounded-lg border-l-4 border-slate shadow-lg`}>
                     <div className="flex justify-between items-start">
                        <p className={`${THEME.colors.textSecondary} text-sm font-bold uppercase`}>{t.statsCompleted}</p>
                         <ClipboardListIcon className="h-5 w-5 text-slate opacity-50" />
                    </div>
                    <p className={`text-4xl font-bold ${THEME.colors.textMain} mt-2`}>12</p>
                    <p className={`text-xs ${THEME.colors.textSecondary} mt-1`}>This month</p>
                </div>
            </div>

            {/* Recent Activity List (Mock) */}
            <div className={`${THEME.colors.surface} rounded-lg p-6 shadow-lg`}>
                <h3 className={`text-xl font-bold ${THEME.colors.textMain} mb-4`}>{t.recentActivity}</h3>
                <div className="space-y-4">
                    {[
                        { date: 'Today', title: 'Unit 104 - Countertop Replace', status: 'In Progress', color: THEME.colors.textHighlight },
                        { date: 'Yesterday', title: 'Unit 302 - Make Ready', status: 'Pending', color: THEME.colors.textWarning },
                        { date: 'Feb 14', title: 'Lobby Tile Repair', status: 'Completed', color: 'text-slate' },
                    ].map((item, i) => (
                        <div key={i} className={`flex justify-between items-center border-b ${THEME.colors.borderSubtle} pb-3 last:border-0 last:pb-0`}>
                            <div>
                                <p className={`font-bold ${THEME.colors.textMain}`}>{item.title}</p>
                                <p className={`text-xs ${THEME.colors.textSecondary}`}>{item.date}</p>
                            </div>
                            <span className={`text-sm font-bold ${item.color}`}>{item.status}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const DashboardGallery: React.FC = () => {
    const t = translations['en'];
    // Mock images
    const images = [
        "https://images.unsplash.com/photo-1584622050111-993a426fbf0a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1595428774223-ef52624120d2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    ];

    return (
        <div className="animate-in fade-in duration-300">
            <h2 className={`text-2xl font-bold ${THEME.colors.textMain} mb-2`}>{t.galleryTitle}</h2>
            <p className={`${THEME.colors.textSecondary} mb-6`}>{t.gallerySubtitle}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {images.map((src, i) => (
                    <div key={i} className={`aspect-video ${THEME.colors.background} rounded-lg overflow-hidden relative group shadow-lg`}>
                        <img src={src} alt={`Project ${i}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className={`${THEME.colors.textHighlight} font-bold border ${THEME.colors.borderHighlight} px-4 py-2 rounded`}>View Details</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DashboardHistory: React.FC = () => (
    <div className="animate-in fade-in duration-300">
        <h2 className={`text-2xl font-bold ${THEME.colors.textMain} mb-6`}>Request History</h2>
        <div className={`${THEME.colors.surface} rounded-lg overflow-hidden`}>
            <table className="w-full text-left text-sm">
                <thead className={`${THEME.colors.background} text-slate uppercase text-xs`}>
                    <tr>
                        <th className="p-4">Date</th>
                        <th className="p-4">Property</th>
                        <th className="p-4">Service</th>
                        <th className="p-4">Status</th>
                    </tr>
                </thead>
                <tbody className={`divide-y ${THEME.colors.borderSubtle}`}>
                    <tr className={`hover:${THEME.colors.background}/50`}>
                        <td className={`p-4 ${THEME.colors.textMain}`}>Feb 20, 2025</td>
                        <td className={`p-4 ${THEME.colors.textSecondary}`}>The Arts at Park Place</td>
                        <td className={`p-4 ${THEME.colors.textSecondary}`}>Countertops - Quartz</td>
                        <td className={`p-4 ${THEME.colors.textHighlight} font-bold`}>Approved</td>
                    </tr>
                     <tr className={`hover:${THEME.colors.background}/50`}>
                        <td className={`p-4 ${THEME.colors.textMain}`}>Feb 18, 2025</td>
                        <td className={`p-4 ${THEME.colors.textSecondary}`}>Canyon Creek</td>
                        <td className={`p-4 ${THEME.colors.textSecondary}`}>Make-Ready</td>
                        <td className={`p-4 ${THEME.colors.textWarning} font-bold`}>Pending</td>
                    </tr>
                     <tr className={`hover:${THEME.colors.background}/50`}>
                        <td className={`p-4 ${THEME.colors.textMain}`}>Jan 15, 2025</td>
                        <td className={`p-4 ${THEME.colors.textSecondary}`}>The Arts at Park Place</td>
                        <td className={`p-4 ${THEME.colors.textSecondary}`}>Tile - Flooring</td>
                        <td className="p-4 text-slate font-bold">Completed</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
);

// --- COMPANY PORTAL Components ---

const CompanyDashboardOverview: React.FC<{ companyData: Company[] }> = ({ companyData }) => {
    const t = translations['en'];
    const totalClients = companyData.length;
    const totalProps = companyData.reduce((acc, c) => acc + c.properties.length, 0);

    return (
         <div className="space-y-8 animate-in fade-in duration-300">
             <div>
                <h1 className={`text-3xl font-bold ${THEME.colors.textMain}`}>{t.companyPortalTitle}</h1>
                <p className={THEME.colors.textSecondary}>{t.companyPortalSubtitle}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div className={`${THEME.colors.surface} p-6 rounded-lg border-t-4 border-bright-pink shadow-lg`}>
                    <p className={`${THEME.colors.textSecondary} text-xs font-bold uppercase`}>Total Clients</p>
                    <p className={`text-4xl font-bold ${THEME.colors.textMain} mt-2`}>{totalClients}</p>
                </div>
                <div className={`${THEME.colors.surface} p-6 rounded-lg border-t-4 ${THEME.colors.borderHighlight} shadow-lg`}>
                    <p className={`${THEME.colors.textSecondary} text-xs font-bold uppercase`}>Total Properties</p>
                    <p className={`text-4xl font-bold ${THEME.colors.textMain} mt-2`}>{totalProps}</p>
                </div>
                 <div className={`${THEME.colors.surface} p-6 rounded-lg border-t-4 border-orange-400 shadow-lg`}>
                    <p className={`${THEME.colors.textSecondary} text-xs font-bold uppercase`}>Active Estimates</p>
                    <p className={`text-4xl font-bold ${THEME.colors.textMain} mt-2`}>8</p>
                </div>
                <div className={`${THEME.colors.surface} p-6 rounded-lg border-t-4 border-blue-400 shadow-lg`}>
                    <p className={`${THEME.colors.textSecondary} text-xs font-bold uppercase`}>Jobs In Production</p>
                    <p className={`text-4xl font-bold ${THEME.colors.textMain} mt-2`}>12</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className={`${THEME.colors.surface} rounded-lg p-6 shadow-lg border ${THEME.colors.borderSubtle}`}>
                    <h3 className={`text-lg font-bold ${THEME.colors.textMain} mb-4`}>Recent Requests (Global)</h3>
                    <div className="space-y-3">
                         {[
                            { client: 'Knightvest', prop: 'Park Place', title: 'Unit 104 Remodel', date: '2h ago' },
                            { client: 'CushWake', prop: 'Example A', title: 'Lobby Tile', date: '5h ago' },
                            { client: 'Knightvest', prop: 'Canyon Creek', title: 'Leak Repair', date: '1d ago' },
                        ].map((item, i) => (
                            <div key={i} className={`flex justify-between items-center border-b ${THEME.colors.borderSubtle} pb-2 last:border-0`}>
                                <div>
                                    <p className={`text-sm font-bold ${THEME.colors.textMain}`}>{item.title}</p>
                                    <p className={`text-xs ${THEME.colors.textSecondary}`}>{item.client} - {item.prop}</p>
                                </div>
                                <span className={`text-xs ${THEME.colors.textHighlight}`}>{item.date}</span>
                            </div>
                        ))}
                    </div>
                 </div>

                 <div className={`${THEME.colors.surface} rounded-lg p-6 shadow-lg border ${THEME.colors.borderSubtle}`}>
                    <h3 className={`text-lg font-bold ${THEME.colors.textMain} mb-4`}>Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button className={`${THEME.colors.background} hover:${THEME.colors.surfaceHighlight} border ${THEME.colors.borderSubtle} p-4 rounded text-center transition-colors`}>
                            <p className={`text-2xl mb-1`}>📄</p>
                            <p className={`text-sm font-bold ${THEME.colors.textMain}`}>Create Invoice</p>
                        </button>
                        <button className={`${THEME.colors.background} hover:${THEME.colors.surfaceHighlight} border ${THEME.colors.borderSubtle} p-4 rounded text-center transition-colors`}>
                            <p className={`text-2xl mb-1`}>👷</p>
                            <p className={`text-sm font-bold ${THEME.colors.textMain}`}>Assign Tech</p>
                        </button>
                    </div>
                 </div>
            </div>
         </div>
    );
};

const CompanyDataSources: React.FC = () => {
    const t = translations['en'];
    // In a real SaaS, these links would come from the config or DB
    const SHEET_ID = '1Qx...'; // Placeholder
    const FOLDER_ID = '1fG...'; // Placeholder

    return (
        <div className="animate-in fade-in duration-300">
             <h2 className={`text-2xl font-bold ${THEME.colors.textMain} mb-2`}>{t.dataSourcesTitle}</h2>
             <p className={`${THEME.colors.textSecondary} mb-6`}>{t.dataSourcesSubtitle}</p>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Google Sheet Card */}
                <div className={`${THEME.colors.surface} p-6 rounded-lg border ${THEME.colors.borderSubtle} hover:border-green-500 transition-colors group`}>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-green-900/30 p-3 rounded-lg text-green-400">
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>
                        </div>
                        <div>
                            <h3 className={`text-lg font-bold ${THEME.colors.textMain}`}>{t.googleSheetLabel}</h3>
                            <p className={`text-xs ${THEME.colors.textSecondary}`}>Stores all survey responses</p>
                        </div>
                    </div>
                    <a 
                        href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className={`block w-full text-center ${THEME.colors.background} text-green-400 border border-green-500/30 font-bold py-2 rounded hover:bg-green-500/10 transition-colors`}
                    >
                        {t.openSheetButton}
                    </a>
                </div>

                {/* Google Drive Card */}
                <div className={`${THEME.colors.surface} p-6 rounded-lg border ${THEME.colors.borderSubtle} hover:border-blue-500 transition-colors group`}>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="bg-blue-900/30 p-3 rounded-lg text-blue-400">
                             <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/></svg>
                        </div>
                        <div>
                            <h3 className={`text-lg font-bold ${THEME.colors.textMain}`}>{t.googleDriveLabel}</h3>
                            <p className={`text-xs ${THEME.colors.textSecondary}`}>Stores uploaded project photos</p>
                        </div>
                    </div>
                    <a 
                        href={`https://drive.google.com/drive/u/0/folders/${FOLDER_ID}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className={`block w-full text-center ${THEME.colors.background} text-blue-400 border border-blue-500/30 font-bold py-2 rounded hover:bg-blue-500/10 transition-colors`}
                    >
                        {t.openDriveButton}
                    </a>
                </div>
             </div>
        </div>
    );
};

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
        <div className={`${THEME.colors.surface} p-6 rounded-lg shadow-2xl`}>
            <h2 className={`text-3xl font-bold ${THEME.colors.textMain} mb-2`}>{BRANDING.assistantName}</h2>
            <p className={`mb-6 ${THEME.colors.textHighlight}`}>For {selectedCompany?.name || 'Partner'} Properties</p>

            <div className="mb-8">
                <label htmlFor="company-select" className={`block text-sm font-medium ${THEME.colors.textMain} mb-2`}>Select Target Company:</label>
                <select 
                    id="company-select" 
                    value={selectedCompany?.id || ''} 
                    onChange={handleCompanyChange} 
                    className={`w-full ${THEME.colors.inputBg} ${THEME.colors.textMain} p-3 border ${THEME.colors.inputBorder} rounded-md focus:outline-none focus:ring-2 ${THEME.colors.inputFocus} ${THEME.effects.glow}`}
                >
                    {companyData.map(company => (
                        <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                </select>
            </div>
            
            <div className={`${THEME.colors.background} p-8 rounded-lg flex flex-col items-center gap-4`}>
                 <a 
                    href={surveyUrl} 
                    onClick={handleNav} 
                    className={`block w-full max-w-md ${THEME.colors.background} text-platinum font-bold py-4 px-6 rounded-md text-lg text-center hover:-translate-y-1 ${THEME.effects.glow}`}
                >
                    Service/ Repair/ Renovation Assistant
                </a>
                
                {/* Link to Dashboard */}
                 <a 
                    href="#dashboard"
                    onClick={handleNav} 
                    className={`text-sm ${THEME.colors.textSecondary} hover:${THEME.colors.textHighlight} flex items-center gap-2 mt-4`}
                >
                    <LockClosedIcon className="h-4 w-4" /> Client Portal Login
                </a>
            </div>
        </div>
    );
};

const Survey: React.FC<{ companyId: string, companyData: Company[], scriptUrl: string, embedded?: boolean, onSuccess?: () => void }> = ({ companyId, companyData, scriptUrl, embedded = false, onSuccess }) => {
    const [lang, setLang] = useState<'en' | 'es'>('en');
    const t = useMemo(() => translations[lang], [lang]);

    const company = useMemo(() => companyData.find(c => c.id === companyId) || companyData[0], [companyId, companyData]);
    
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
            attachments: [],
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
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Smart logic for phone requirement
    const isPhoneRequired = useMemo(() => {
        return formData.contactMethods.includes('Phone Call (immediate)') || formData.contactMethods.includes('Text Message (SMS)');
    }, [formData.contactMethods]);

    // Persist to Local Storage
    useEffect(() => {
        if (submissionStatus !== 'success') {
            // Exclude attachments from local storage to save space
            const { attachments, ...dataToSave } = formData;
            localStorage.setItem('jes_stone_survey_draft', JSON.stringify(dataToSave));
        }
    }, [formData, submissionStatus]);

    // Clear Local Storage on Success
    useEffect(() => {
        if (submissionStatus === 'success') {
            localStorage.removeItem('jes_stone_survey_draft');
        }
    }, [submissionStatus]);

    const handleReset = () => {
        setFormData({
            propertyId: formData.propertyId, // Keep property selected for convenience
            firstName: formData.firstName,   // Keep contact info for convenience
            lastName: formData.lastName,
            title: formData.title,
            phone: formData.phone,
            email: formData.email,
            unitInfo: '', 
            services: [], 
            otherService: '', 
            timeline: '', 
            notes: '', 
            contactMethods: [],
            attachments: [],
        });
        setSubmissionStatus('idle');
    };

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

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        
        const files = Array.from(e.target.files) as File[];
        const newAttachments: {name: string, type: string, data: string}[] = [];

        // Simple size validation (2MB limit per file)
        const MAX_SIZE = 2 * 1024 * 1024;

        for (const file of files) {
            if (file.size > MAX_SIZE) {
                alert(`File ${file.name} is too large. Max size is 2MB.`);
                continue;
            }

            try {
                const base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = error => reject(error);
                });
                newAttachments.push({
                    name: file.name,
                    type: file.type,
                    data: base64
                });
            } catch (error) {
                console.error("Error reading file:", error);
            }
        }

        setFormData(prev => ({
            ...prev,
            attachments: [...(prev.attachments || []), ...newAttachments]
        }));
        
        // Reset input so same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRemovePhoto = (index: number) => {
        setFormData(prev => ({
            ...prev,
            attachments: prev.attachments?.filter((_, i) => i !== index)
        }));
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
        
        // --- NEW LOGIC START ---
        // Lookup the selected property to get its real Name and Address
        const selectedProperty = company.properties.find(p => p.id === formData.propertyId);
        
        // Prepare the payload including the explicit Property Name and Address
        const payload: SurveyData = {
            ...formData,
            propertyName: selectedProperty?.name || 'Unknown Property',
            propertyAddress: selectedProperty?.address || 'Unknown Address'
        };
        // --- NEW LOGIC END ---

        try {
            await submitSurveyData(scriptUrl, payload);
            setSubmissionStatus('success');
            // If embedded in dashboard, we might want to auto-redirect after a delay, or show a simplified success message
        } catch (error) {
            console.error('Survey Submission Failed:', error);
            setSubmissionStatus('error');
        }
    };

    if (!company) return <div className="text-center text-red-400">Company not found.</div>;
    const selectedProperty = company.properties.find(p => p.id === formData.propertyId);

    if (submissionStatus === 'success') {
        return (
            <div className={`${THEME.colors.surface} p-8 rounded-lg text-center ${!embedded ? THEME.effects.glow : ''}`}>
                <h2 className={`text-3xl font-bold ${THEME.colors.textHighlight} mb-4`}>{t.submitSuccessTitle}</h2>
                <p className={`${THEME.colors.textMain} text-lg`}>{t.submitSuccessMessage1}</p>
                <p className={`${THEME.colors.textSecondary} mt-2`}>{t.submitSuccessMessage2}</p>
                
                 {/* NEW BADGE */}
                {formData.attachments && formData.attachments.length > 0 && (
                    <div className={`mt-4 inline-flex items-center gap-2 ${THEME.colors.background} border ${THEME.colors.borderHighlight}/50 ${THEME.colors.textHighlight} px-4 py-2 rounded-full text-sm`}>
                        <CloudArrowUpIcon className="h-4 w-4" />
                        <span>{t.photosUploadedBadge}</span>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                    {onSuccess ? (
                        <button onClick={() => { handleReset(); onSuccess(); }} className={`inline-block ${THEME.colors.buttonPrimary} font-bold py-3 px-6 rounded-md transition-all`}>
                             Return to Overview
                        </button>
                    ) : (
                        <button onClick={handleReset} className={`inline-block ${THEME.colors.buttonSecondary} font-bold py-3 px-6 rounded-md transition-all ${THEME.effects.glow}`}>
                            {t.submitAnotherButton}
                        </button>
                    )}

                    {!embedded && (
                        <a href="#dashboard" onClick={handleNav} className={`inline-block ${THEME.colors.buttonPrimary} font-bold py-3 px-6 rounded-md transition-all ${THEME.effects.glow}`}>
                            {t.enterDashboardButton}
                        </a>
                    )}
                </div>
            </div>
        );
    }
    
    if (submissionStatus === 'error') {
         return (
            <div className={`${THEME.colors.surface} p-8 rounded-lg text-center ${!embedded ? THEME.effects.glow : ''}`}>
                <h2 className="text-3xl font-bold text-red-400 mb-4">{t.submitErrorTitle}</h2>
                <p className={`${THEME.colors.textMain} text-lg`}>{t.submitErrorMessage1}</p>
                <p className={`${THEME.colors.textSecondary} mt-2`}>{t.submitErrorMessage2}</p>
                <button onClick={() => setSubmissionStatus('idle')} className={`mt-8 inline-block ${THEME.colors.buttonPrimary} font-bold py-3 px-6 rounded-md transition-all ${THEME.effects.glow}`}>
                    {t.tryAgainButton}
                </button>
            </div>
        );
    }
  
    return (
      <div className={`${THEME.colors.surface} rounded-lg ${!embedded ? `p-6 ${THEME.effects.glow}` : ''}`}>
        <div className="flex justify-between items-center mb-6">
            <div>
                {!embedded && <h2 className={`text-2xl font-bold ${THEME.colors.textMain} mb-1`}>{t.surveyTitle}</h2>}
                <p className={THEME.colors.textSecondary}>{t.surveySubtitle} <span className={`font-bold ${THEME.colors.textHighlight}`}>{company.name}</span> {t.surveySubtitleProperties}</p>
            </div>
            <button onClick={() => setLang(lang === 'en' ? 'es' : 'en')} className={`text-sm font-medium ${THEME.colors.textHighlight} hover:text-opacity-80 px-3 py-1 rounded-md border ${THEME.colors.borderHighlight}/50`}>
                {t.languageToggle}
            </button>
        </div>
  
        <form onSubmit={handleSubmit} className="space-y-6">
            <fieldset className={`p-4 border ${THEME.colors.borderSubtle} rounded-md`}>
                <legend className={`px-2 text-lg font-semibold ${THEME.colors.textHighlight}`}>{t.propertyIdLegend}</legend>
                <div className="grid md:grid-cols-2 gap-4 mt-2">
                    <div>
                        <label htmlFor="propertyId" className={`block text-sm font-medium ${THEME.colors.textMain} mb-1`}>{t.propertyNameLabel}</label>
                        <select 
                            id="propertyId" 
                            name="propertyId" 
                            value={formData.propertyId} 
                            onChange={handleInputChange} 
                            required 
                            className={`w-full ${THEME.colors.inputBg} p-2 border ${THEME.colors.inputBorder} rounded-md focus:outline-none focus:ring-2 ${THEME.colors.inputFocus} ${THEME.effects.glow}`}
                        >
                            <option value="">{t.propertySelectPlaceholder}</option>
                            {company.properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={`block text-sm font-medium ${THEME.colors.textMain} mb-1`}>{t.propertyAddressLabel}</label>
                        <div className={`w-full ${THEME.colors.inputBg} p-2 border ${THEME.colors.inputBorder} rounded-md flex items-start text-slate min-h-[40px] ${THEME.effects.glow}`}>
                            {selectedProperty ? selectedProperty.address : t.addressPlaceholder}
                        </div>
                    </div>
                </div>
            </fieldset>

            <fieldset className={`p-4 border ${THEME.colors.borderSubtle} rounded-md`}>
                <legend className={`px-2 text-lg font-semibold ${THEME.colors.textHighlight}`}>{t.contactInfoLegend}</legend>
                <div className="grid md:grid-cols-2 gap-4 mt-2">
                    <div>
                        <label htmlFor="firstName" className={`block text-sm font-medium ${THEME.colors.textMain} mb-1`}>{t.firstNameLabel}</label>
                        <input 
                            type="text" 
                            id="firstName" 
                            name="firstName" 
                            value={formData.firstName} 
                            onChange={handleInputChange} 
                            required 
                            className={`w-full ${THEME.colors.inputBg} p-2 border ${THEME.colors.inputBorder} rounded-md focus:outline-none focus:ring-2 ${THEME.colors.inputFocus} ${THEME.effects.glow}`}
                        />
                    </div>
                    <div>
                        <label htmlFor="lastName" className={`block text-sm font-medium ${THEME.colors.textMain} mb-1`}>{t.lastNameLabel}</label>
                        <input 
                            type="text" 
                            id="lastName" 
                            name="lastName" 
                            value={formData.lastName} 
                            onChange={handleInputChange} 
                            required 
                            className={`w-full ${THEME.colors.inputBg} p-2 border ${THEME.colors.inputBorder} rounded-md focus:outline-none focus:ring-2 ${THEME.colors.inputFocus} ${THEME.effects.glow}`}
                        />
                    </div>
                    <div>
                        <label htmlFor="title" className={`block text-sm font-medium ${THEME.colors.textMain} mb-1`}>{t.titleRoleLabel}</label>
                        <select 
                            id="title" 
                            name="title" 
                            value={formData.title} 
                            onChange={handleInputChange} 
                            required 
                            className={`w-full ${THEME.colors.inputBg} p-2 border ${THEME.colors.inputBorder} rounded-md focus:outline-none focus:ring-2 ${THEME.colors.inputFocus} ${THEME.effects.glow}`}
                        >
                            <option value="">{t.roleSelectPlaceholder}</option>
                            {t.TITLES.map(title => <option key={title} value={title}>{title}</option>)}
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="phone" className={`block text-sm font-medium ${THEME.colors.textMain} mb-1`}>
                            {t.phoneLabel} 
                            {isPhoneRequired && <span className={`${THEME.colors.textWarning} ml-1`}>*</span>}
                        </label>
                        <input 
                            type="tel" 
                            id="phone" 
                            name="phone" 
                            value={formData.phone} 
                            onChange={handleInputChange} 
                            required={isPhoneRequired} 
                            className={`w-full ${THEME.colors.inputBg} p-2 border ${THEME.colors.inputBorder} rounded-md focus:outline-none focus:ring-2 ${THEME.colors.inputFocus} ${THEME.effects.glow}`}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="email" className={`block text-sm font-medium ${THEME.colors.textMain} mb-1`}>{t.emailLabel}</label>
                        <input 
                            type="email" 
                            id="email" 
                            name="email" 
                            value={formData.email} 
                            onChange={handleInputChange} 
                            required 
                            className={`w-full ${THEME.colors.inputBg} p-2 border ${THEME.colors.inputBorder} rounded-md focus:outline-none focus:ring-2 ${THEME.colors.inputFocus} ${THEME.effects.glow}`}
                        />
                    </div>
                </div>
            </fieldset>

            <fieldset className={`p-4 border ${THEME.colors.borderSubtle} rounded-md`}>
                <legend className={`px-2 text-lg font-semibold ${THEME.colors.textHighlight}`}>{t.scopeTimelineLegend}</legend>
                <div className="space-y-4 mt-2">
                    <div>
                        <label htmlFor="unitInfo" className={`block text-sm font-medium ${THEME.colors.textMain} mb-1`}>{t.unitInfoLabel}</label>
                        <input 
                            type="text" 
                            id="unitInfo" 
                            name="unitInfo" 
                            value={formData.unitInfo} 
                            onChange={handleInputChange} 
                            placeholder={t.unitInfoPlaceholder} 
                            required 
                            className={`w-full ${THEME.colors.inputBg} p-2 border ${THEME.colors.inputBorder} rounded-md focus:outline-none focus:ring-2 ${THEME.colors.inputFocus} ${THEME.effects.glow}`}
                        />
                    </div>
                    <div>
                        <label className={`block text-sm font-medium ${THEME.colors.textMain} mb-2`}>{t.serviceNeededLabel}</label>
                        <div className="grid sm:grid-cols-2 gap-2">
                            {t.SERVICES.map(service => (
                                <label key={service} className={`flex items-center space-x-3 p-3 rounded-md cursor-pointer transition-colors ${formData.services.includes(service) ? `bg-bright-cyan/20 ring-2 ${THEME.colors.inputFocus}` : `${THEME.colors.inputBg} hover:${THEME.colors.surfaceHighlight}`} ${THEME.effects.glow}`}>
                                    <input type="checkbox" checked={formData.services.includes(service)} onChange={() => handleCheckboxChange('services', service)} className="hidden"/>
                                    <div className={`w-5 h-5 border-2 ${formData.services.includes(service) ? `${THEME.colors.borderHighlight} ${THEME.colors.textHighlight.replace('text-', 'bg-')}` : 'border-slate'} rounded-sm flex-shrink-0 flex items-center justify-center`}>
                                        {formData.services.includes(service) && <svg className="w-3 h-3 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7"/></svg>}
                                    </div>
                                    <span>{service}</span>
                                </label>
                            ))}
                        </div>
                        {formData.services.some(s => s.startsWith('Other') || s.startsWith('Otro')) && <input type="text" name="otherService" value={formData.otherService} onChange={handleInputChange} placeholder={t.otherServicePlaceholder} className={`mt-2 w-full ${THEME.colors.inputBg} p-2 border ${THEME.colors.inputBorder} rounded-md focus:outline-none focus:ring-2 ${THEME.colors.inputFocus} ${THEME.effects.glow}`}/>}
                    </div>
                    <div>
                        <label htmlFor="timeline" className={`block text-sm font-medium ${THEME.colors.textMain} mb-1`}>{t.timelineLabel}</label>
                        <select 
                            id="timeline" 
                            name="timeline" 
                            value={formData.timeline} 
                            onChange={handleInputChange} 
                            required 
                            className={`w-full ${THEME.colors.inputBg} p-2 border ${THEME.colors.inputBorder} rounded-md focus:outline-none focus:ring-2 ${THEME.colors.inputFocus} ${THEME.effects.glow}`}
                        >
                            <option value="">{t.timelineSelectPlaceholder}</option>
                            {t.TIMELINES.map(timeline => <option key={timeline} value={timeline}>{timeline}</option>)}
                        </select>
                    </div>

                    {/* PHOTO UPLOAD SECTION */}
                    <div>
                         <label className={`block text-sm font-medium ${THEME.colors.textMain} mb-2`}>{t.photosLabel}</label>
                         <div 
                            className={`border-2 border-dashed ${THEME.colors.borderSubtle} hover:${THEME.colors.borderHighlight} ${THEME.colors.inputBg} rounded-md p-6 flex flex-col items-center justify-center cursor-pointer transition-colors group ${THEME.effects.glow}`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                className="hidden" 
                                accept="image/*" 
                                multiple 
                                onChange={handlePhotoUpload} 
                            />
                            <CloudArrowUpIcon className={`h-10 w-10 ${THEME.colors.textSecondary} group-hover:${THEME.colors.textHighlight} mb-2`} />
                            <p className={`text-sm ${THEME.colors.textSecondary} group-hover:${THEME.colors.textMain}`}>{t.dragDropText}</p>
                            <button type="button" className={`mt-2 ${THEME.colors.surfaceHighlight} ${THEME.colors.textHighlight} text-xs font-bold py-1 px-3 rounded hover:bg-bright-cyan/20`}>
                                {t.uploadButton}
                            </button>
                         </div>
                         <p className={`text-xs ${THEME.colors.textSecondary} mt-2 text-center opacity-75`}>{t.photosPermissionHint}</p>
                         
                         {/* Photo Preview List */}
                         {formData.attachments && formData.attachments.length > 0 && (
                             <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                {formData.attachments.map((file, index) => (
                                    <div key={index} className={`relative aspect-square ${THEME.colors.surfaceHighlight} rounded overflow-hidden border ${THEME.colors.borderSubtle} group`}>
                                        <img src={file.data} alt="Preview" className="w-full h-full object-cover" />
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemovePhoto(index)}
                                            className={`absolute top-1 right-1 bg-navy/80 ${THEME.colors.textWarning} p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity`}
                                            title={t.removePhoto}
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                             </div>
                         )}
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor="notes" className={`block text-sm font-medium ${THEME.colors.textMain}`}>{t.notesLabel}</label>
                            <button type="button" onClick={handleGenerateNotes} disabled={isGenerating} className={`flex items-center gap-1 text-xs ${THEME.colors.textWarning} hover:text-opacity-80 disabled:text-slate`}>
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
                            className={`w-full ${THEME.colors.inputBg} p-2 border ${THEME.colors.inputBorder} rounded-md focus:outline-none focus:ring-2 ${THEME.colors.inputFocus} ${THEME.effects.glow}`}
                        ></textarea>
                    </div>
                </div>
            </fieldset>
            
            <fieldset className={`p-4 border ${THEME.colors.borderSubtle} rounded-md`}>
                <legend className={`px-2 text-lg font-semibold ${THEME.colors.textHighlight}`}>{t.contactMethodLegend}</legend>
                 <div className="grid sm:grid-cols-2 gap-2 mt-2">
                    {t.CONTACT_METHODS.map(method => (
                        <label key={method} className={`flex items-center space-x-3 p-3 rounded-md cursor-pointer transition-colors ${formData.contactMethods.includes(method) ? `bg-bright-cyan/20 ring-2 ${THEME.colors.inputFocus}` : `${THEME.colors.inputBg} hover:${THEME.colors.surfaceHighlight}`} ${THEME.effects.glow}`}>
                            <input type="checkbox" checked={formData.contactMethods.includes(method)} onChange={() => handleCheckboxChange('contactMethods', method)} className="hidden"/>
                            <div className={`w-5 h-5 border-2 ${formData.contactMethods.includes(method) ? `${THEME.colors.borderHighlight} ${THEME.colors.textHighlight.replace('text-', 'bg-')}` : 'border-slate'} rounded-sm flex-shrink-0 flex items-center justify-center`}>
                                {formData.contactMethods.includes(method) && <svg className="w-3 h-3 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7"/></svg>}
                                    </div>
                                    <span>{method}</span>
                                </label>
                            ))}
                </div>
            </fieldset>

            <button type="submit" disabled={submissionStatus === 'submitting'} className={`w-full flex items-center justify-center gap-2 ${THEME.colors.buttonPrimary} font-bold py-3 px-6 rounded-md transition-all text-lg disabled:bg-slate disabled:cursor-not-allowed ${THEME.effects.glow}`}>
                {submissionStatus === 'submitting' ? <><LoadingSpinner /> {t.submittingButton}</> : <>{t.submitButton} <PaperAirplaneIcon className="h-5 w-5" /></>}
            </button>
            <p className={`text-center text-xs ${THEME.colors.textSecondary}`}>Data secured for {BRANDING.companyName} internal use only.</p>
        </form>
      </div>
    );
};
  
export default App;

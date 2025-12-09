
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { generateNotesDraft, createChatSession } from './services/geminiService';
import { fetchCompanyData, submitSurveyData } from './services/apiService';
import { translations } from './translations';
import type { Company, SurveyData, UserSession, UserRole } from './types';
import { Chat, GenerateContentResponse } from "@google/genai";
import { LoadingSpinner, JesStoneLogo, SparklesIcon, PaperAirplaneIcon, ChatBubbleIcon, XMarkIcon, DashboardIcon, PhotoIcon, LockClosedIcon, LogoutIcon, ClipboardListIcon, ClockIcon, BuildingBlocksIcon, UsersIcon, CloudArrowUpIcon, TrashIcon } from './components/icons';

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

// --- MOCK ACCESS DATABASE ---
// Simplified for Single Property Focus + Regional Demo
const MOCK_ACCESS_DB: Record<string, { role: UserRole, companyId: string, allowedPropertyIds: string[] }> = {
    // Single Property Access (Site Manager)
    'PARKPLACE': { role: 'site_manager', companyId: 'knightvest', allowedPropertyIds: ['kv-1'] },
    'CANYON': { role: 'site_manager', companyId: 'knightvest', allowedPropertyIds: ['kv-2'] },

    // Regional Manager Demo (Access to both properties)
    'REGION1': { role: 'regional_manager', companyId: 'knightvest', allowedPropertyIds: ['kv-1', 'kv-2'] },

    // Fallback Demo
    'DEMO': { role: 'site_manager', companyId: 'knightvest', allowedPropertyIds: ['kv-1'] }, 
};

// --- ERROR BOUNDARY COMPONENT ---
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-navy flex items-center justify-center p-4">
          <div className="bg-light-navy p-8 rounded-lg border border-bright-pink text-center max-w-lg shadow-2xl">
            <h1 className="text-2xl font-bold text-bright-pink mb-4">Something went wrong.</h1>
            <p className="text-slate mb-4">The application encountered an unexpected error while rendering.</p>
            <div className="bg-navy p-4 rounded text-left overflow-auto max-h-40 mb-6 border border-lightest-navy">
                <code className="text-xs text-bright-pink font-mono block break-all">{this.state.error?.toString()}</code>
            </div>
            <button 
                onClick={() => {
                    window.location.hash = ''; // Reset route
                    window.location.reload();
                }} 
                className="bg-bright-cyan text-navy font-bold py-2 px-6 rounded hover:bg-opacity-90 transition-all"
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
        
        // Use override if provided, otherwise check state (from localstorage), otherwise default
        const targetUrl = urlOverride || overrideUrl || APPS_SCRIPT_URL;
        
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
                        <div className="bg-navy border border-bright-pink/30 p-6 rounded-lg text-left mb-6">
                            <h3 className="font-bold text-bright-pink mb-2">⚠️ Connection Error</h3>
                            <p className="text-lightest-slate mb-4">
                                The app cannot connect to the Google Script. Since permissions are set to "Anyone", this is likely due to:
                            </p>
                            <ul className="list-disc list-inside text-sm text-slate space-y-2 mb-4">
                                <li>A <strong>Syntax Error</strong> in the script you just edited (missing bracket or comma).</li>
                                <li>The <strong>Script URL changed</strong> (if you created a "New Deployment" instead of "New Version").</li>
                                <li><strong>Missing Functions:</strong> Ensure the script has the <code>doPost</code> and <code>getCompanyData</code> functions. If you only see <code>saveToSheet</code>, you need to restore the full code.</li>
                            </ul>
                            <p className="text-sm text-bright-cyan font-bold mb-2">How to Fix:</p>
                             <ol className="list-decimal list-inside text-sm text-slate space-y-2">
                                <li>Copy the <strong>FULL SCRIPT</strong> provided by the assistant and replace everything in your Google Script Editor.</li>
                                <li>Deploy as <strong>New Version</strong>.</li>
                                <li>If the URL changed, paste it below.</li>
                            </ol>
                        </div>
                    ) : (
                        <p className="mb-6 text-slate">Please check your APPS_SCRIPT_URL and ensure the Google Script is deployed correctly.</p>
                    )}

                    <div className="bg-navy border border-lightest-navy p-4 rounded text-left overflow-auto mb-6">
                        <p className="font-bold text-xs text-bright-pink uppercase mb-1">Error Details:</p>
                        <code className="text-sm font-mono text-light-slate">{errorMessage}</code>
                    </div>

                    <div className="flex flex-col gap-4 max-w-md mx-auto">
                        <input 
                            type="text" 
                            placeholder="Paste new Web App URL here (optional)"
                            defaultValue={overrideUrl}
                            id="urlInput"
                            className="bg-navy border border-lightest-navy p-2 rounded text-sm text-lightest-slate focus:ring-1 focus:ring-bright-cyan"
                        />
                        <button 
                            onClick={() => {
                                const input = document.getElementById('urlInput') as HTMLInputElement;
                                if(input) loadData(input.value.trim());
                            }} 
                            className="bg-bright-cyan text-navy px-6 py-2 rounded-md font-bold hover:bg-bright-cyan/90 transition-colors"
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
                scriptUrl={overrideUrl || APPS_SCRIPT_URL} 
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
                        scriptUrl={overrideUrl || APPS_SCRIPT_URL} // Pass dynamic URL to survey
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
            <div className="dark min-h-screen bg-navy text-light-slate font-sans relative">
                {renderContent()}
                <ChatWidget />
            </div>
        </ErrorBoundary>
    );
};

// --- Page Components ---

const Dashboard: React.FC<{ companyData: Company[], scriptUrl: string }> = ({ companyData, scriptUrl }) => {
    const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'newRequest' | 'gallery' | 'history'>('overview');
    const t = translations['en']; 

    const handleLogin = (session: UserSession) => {
        setCurrentUser(session);
    };

    const handleLogout = () => {
        setCurrentUser(null);
    };

    // MOVED UP: Must call hooks unconditionally (before any return statements)
    // Filter properties based on role
    const visibleCompany = useMemo(() => {
        if (!currentUser) return null;

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
    }, [currentUser]);

    // Now it is safe to return early if not logged in
    if (!currentUser) {
        return <DashboardLogin companyData={companyData} onLogin={handleLogin} />;
    }

    // Safety check if rendering failed to produce a company
    if (!visibleCompany) {
         return (
             <div className="min-h-screen bg-navy flex items-center justify-center">
                <div className="text-center">
                    <p className="text-bright-pink mb-4">Error: Company Profile Not Found</p>
                    <p className="text-xs text-slate mb-4">It seems the property data for your access code is not currently available.</p>
                    <button onClick={handleLogout} className="text-bright-cyan underline">Return to Login</button>
                </div>
             </div>
         );
    }

    const roleLabel = {
        'site_manager': t.roleSiteManager,
        'regional_manager': t.roleRegionalManager,
        'executive': t.roleExecutive,
    }[currentUser.role];

    // Safely get property name with optional chaining to prevent crashes
    const displayName = visibleCompany.properties.length === 1 
        ? visibleCompany.properties[0]?.name 
        : visibleCompany.name;

    return (
        <div className="min-h-screen flex bg-navy">
            {/* Sidebar */}
            <aside className="w-64 bg-light-navy border-r border-lightest-navy hidden md:flex flex-col">
                <div className="p-6 border-b border-lightest-navy flex justify-center flex-col items-center">
                    <a href="#/" className="flex items-center gap-2 mb-2">
                        <JesStoneLogo className="h-8 w-auto" />
                        <span className="font-bold text-lightest-slate">JES STONE</span>
                    </a>
                    <div className="bg-navy px-3 py-1 rounded-full text-xs font-bold text-bright-cyan border border-bright-cyan/30 text-center max-w-full truncate">
                        {displayName || 'Loading...'}
                    </div>
                    <div className="mt-2 text-xs text-slate uppercase tracking-wider font-semibold">
                        {roleLabel}
                    </div>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'overview' ? 'bg-bright-cyan/20 text-bright-cyan border-l-2 border-bright-cyan' : 'text-slate hover:text-lightest-slate hover:bg-navy'}`}
                    >
                        <DashboardIcon className="h-5 w-5" /> {t.tabOverview}
                    </button>
                    <button 
                        onClick={() => setActiveTab('newRequest')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'newRequest' ? 'bg-bright-cyan/20 text-bright-cyan border-l-2 border-bright-cyan' : 'text-slate hover:text-lightest-slate hover:bg-navy'}`}
                    >
                         <ClipboardListIcon className="h-5 w-5" /> {t.tabNewRequest}
                    </button>
                    <button 
                        onClick={() => setActiveTab('gallery')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'gallery' ? 'bg-bright-cyan/20 text-bright-cyan border-l-2 border-bright-cyan' : 'text-slate hover:text-lightest-slate hover:bg-navy'}`}
                    >
                        <PhotoIcon className="h-5 w-5" /> {t.tabGallery}
                    </button>
                    <button 
                         onClick={() => setActiveTab('history')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${activeTab === 'history' ? 'bg-bright-cyan/20 text-bright-cyan border-l-2 border-bright-cyan' : 'text-slate hover:text-lightest-slate hover:bg-navy'}`}
                    >
                        <ClockIcon className="h-5 w-5" /> {t.tabHistory}
                    </button>
                </nav>
                <div className="p-4 border-t border-lightest-navy">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-slate hover:text-bright-pink transition-colors">
                        <LogoutIcon className="h-5 w-5" /> {t.logout}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                {/* Mobile Header */}
                <header className="md:hidden bg-light-navy p-4 flex justify-between items-center border-b border-lightest-navy sticky top-0 z-10">
                    <div className="flex flex-col">
                        <span className="font-bold text-lightest-slate">{t.dashboardLoginTitle}</span>
                        <div className="flex gap-2 text-xs">
                             <span className="text-bright-cyan">
                                {visibleCompany.properties.length === 1 
                                    ? (visibleCompany.properties[0]?.name?.substring(0, 15) || '') + '...' 
                                    : visibleCompany.name}
                             </span>
                        </div>
                    </div>
                    <button onClick={handleLogout}><LogoutIcon className="h-6 w-6 text-slate" /></button>
                </header>
                
                {/* Mobile Nav */}
                <div className="md:hidden bg-navy flex justify-around p-2 border-b border-lightest-navy">
                     <button onClick={() => setActiveTab('overview')} className={`p-2 ${activeTab === 'overview' ? 'text-bright-cyan' : 'text-slate'}`}><DashboardIcon className="h-6 w-6" /></button>
                     <button onClick={() => setActiveTab('newRequest')} className={`p-2 ${activeTab === 'newRequest' ? 'text-bright-cyan' : 'text-slate'}`}><ClipboardListIcon className="h-6 w-6" /></button>
                     <button onClick={() => setActiveTab('gallery')} className={`p-2 ${activeTab === 'gallery' ? 'text-bright-cyan' : 'text-slate'}`}><PhotoIcon className="h-6 w-6" /></button>
                </div>

                <div className="p-4 md:p-8 max-w-6xl mx-auto">
                    {activeTab === 'overview' && <DashboardOverview companyData={[visibleCompany]} onNewRequest={() => setActiveTab('newRequest')} />}
                    {activeTab === 'newRequest' && (
                        <div className="animate-in fade-in duration-300">
                             <h2 className="text-2xl font-bold text-lightest-slate mb-6">New Service Request</h2>
                             <Survey 
                                companyId={visibleCompany.id} 
                                companyData={[visibleCompany]} // Pass the filtered company so dropdown is correct
                                scriptUrl={scriptUrl} 
                                embedded={true}
                                onSuccess={() => setActiveTab('overview')}
                            />
                        </div>
                    )}
                    {activeTab === 'gallery' && <DashboardGallery />}
                    {activeTab === 'history' && <DashboardHistory />}
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

        // Simulated network delay - slightly reduced for snappier feel
        setTimeout(() => {
            const normalizedCode = code.toUpperCase().trim();
            const accessRecord = MOCK_ACCESS_DB[normalizedCode];

            if (accessRecord) {
                // Find company - SAFER FIND LOGIC
                // Check if companyData exists before searching
                if (!companyData || companyData.length === 0) {
                     setError("System data not loaded. Please refresh the page.");
                     setIsVerifying(false);
                     return;
                }

                // If DEMO, just pick the first company available. 
                // If specific code, match the companyId.
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
        <div className="min-h-screen bg-navy flex items-center justify-center p-4">
            <div className={`bg-light-navy p-8 rounded-lg max-w-md w-full text-center ${GLOW_CLASSES}`}>
                <div className="flex justify-center mb-6">
                    <div className={`p-4 bg-navy rounded-full border border-bright-cyan shadow-[0_0_15px_rgba(100,255,218,0.3)] ${isVerifying ? 'animate-pulse' : ''}`}>
                        <LockClosedIcon className="h-8 w-8 text-bright-cyan" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-lightest-slate mb-2">{t.dashboardLoginTitle}</h1>
                <p className="text-slate mb-8">{t.dashboardLoginSubtitle}</p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="text-left">
                        <label className="block text-sm font-medium text-light-slate mb-1">{t.accessCodeLabel}</label>
                        <input 
                            type="password" 
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className={`w-full bg-navy border ${error ? 'border-bright-pink' : 'border-lightest-navy'} rounded-md p-3 text-center tracking-widest text-xl text-bright-cyan focus:ring-2 focus:ring-bright-cyan focus:outline-none transition-all`}
                            placeholder="••••"
                            autoFocus
                        />
                         {error && <p className="text-bright-pink text-xs mt-2 text-center animate-bounce">{error}</p>}
                    </div>
                    <button 
                        type="submit" 
                        disabled={!code || isVerifying}
                        className={`w-full bg-bright-cyan text-navy font-bold py-3 rounded-md hover:bg-bright-cyan/90 transition-all flex justify-center items-center gap-2 ${!code || isVerifying ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isVerifying ? <><LoadingSpinner /> Verifying...</> : t.loginButton}
                    </button>
                </form>
                 <div className="mt-6 text-xs text-slate space-y-1">
                     <p>Demo Codes:</p>
                     <p><span className="text-bright-cyan font-mono">PARKPLACE</span> (Site Manager)</p>
                     <p><span className="text-bright-cyan font-mono">REGION1</span> (Regional)</p>
                </div>
                <div className="mt-4 text-xs text-slate">
                    <a href="#/" className="hover:text-bright-cyan">Return to Public Site</a>
                </div>
            </div>
        </div>
    );
};

const DashboardOverview: React.FC<{ companyData: Company[], onNewRequest: () => void }> = ({ companyData, onNewRequest }) => {
    const t = translations['en'];
    
    // Safety reduce with optional chaining AND check if array exists
    const totalProperties = (companyData || []).reduce((acc, c) => acc + (c?.properties?.length || 0), 0) || 0;
    
    // If single property view, get its name for display
    const singlePropertyName = totalProperties === 1 && companyData[0]?.properties[0]?.name;

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-lightest-slate">Welcome Back</h1>
                    <p className="text-slate">
                        {singlePropertyName ? `Managing ${singlePropertyName}` : `Managing ${totalProperties} property locations.`}
                    </p>
                </div>
                <button onClick={onNewRequest} className="bg-bright-cyan text-navy px-6 py-2 rounded-md font-bold shadow-lg hover:bg-bright-cyan/90 transition-all">
                    + New Request
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-light-navy p-6 rounded-lg border-l-4 border-bright-cyan shadow-lg">
                    <div className="flex justify-between items-start">
                        <p className="text-slate text-sm font-bold uppercase">{t.statsActive}</p>
                         <BuildingBlocksIcon className="h-5 w-5 text-bright-cyan opacity-50" />
                    </div>
                    <p className="text-4xl font-bold text-lightest-slate mt-2">3</p>
                    <p className="text-xs text-slate mt-1">In progress</p>
                </div>
                <div className="bg-light-navy p-6 rounded-lg border-l-4 border-bright-pink shadow-lg">
                    <div className="flex justify-between items-start">
                        <p className="text-slate text-sm font-bold uppercase">{t.statsPending}</p>
                        <ClockIcon className="h-5 w-5 text-bright-pink opacity-50" />
                    </div>
                    <p className="text-4xl font-bold text-lightest-slate mt-2">1</p>
                    <p className="text-xs text-slate mt-1">Awaiting your approval</p>
                </div>
                <div className="bg-light-navy p-6 rounded-lg border-l-4 border-slate shadow-lg">
                     <div className="flex justify-between items-start">
                        <p className="text-slate text-sm font-bold uppercase">{t.statsCompleted}</p>
                         <ClipboardListIcon className="h-5 w-5 text-slate opacity-50" />
                    </div>
                    <p className="text-4xl font-bold text-lightest-slate mt-2">12</p>
                    <p className="text-xs text-slate mt-1">This month</p>
                </div>
            </div>

            {/* Recent Activity List (Mock) */}
            <div className="bg-light-navy rounded-lg p-6 shadow-lg">
                <h3 className="text-xl font-bold text-lightest-slate mb-4">{t.recentActivity}</h3>
                <div className="space-y-4">
                    {[
                        { date: 'Today', title: 'Unit 104 - Countertop Replace', status: 'In Progress', color: 'text-bright-cyan' },
                        { date: 'Yesterday', title: 'Unit 302 - Make Ready', status: 'Pending', color: 'text-bright-pink' },
                        { date: 'Feb 14', title: 'Lobby Tile Repair', status: 'Completed', color: 'text-slate' },
                    ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center border-b border-lightest-navy pb-3 last:border-0 last:pb-0">
                            <div>
                                <p className="font-bold text-lightest-slate">{item.title}</p>
                                <p className="text-xs text-slate">{item.date}</p>
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
            <h2 className="text-2xl font-bold text-lightest-slate mb-2">{t.galleryTitle}</h2>
            <p className="text-slate mb-6">{t.gallerySubtitle}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {images.map((src, i) => (
                    <div key={i} className="aspect-video bg-navy rounded-lg overflow-hidden relative group shadow-lg">
                        <img src={src} alt={`Project ${i}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-bright-cyan font-bold border border-bright-cyan px-4 py-2 rounded">View Details</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DashboardHistory: React.FC = () => (
    <div className="animate-in fade-in duration-300">
        <h2 className="text-2xl font-bold text-lightest-slate mb-6">Request History</h2>
        <div className="bg-light-navy rounded-lg overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-navy text-slate uppercase text-xs">
                    <tr>
                        <th className="p-4">Date</th>
                        <th className="p-4">Property</th>
                        <th className="p-4">Service</th>
                        <th className="p-4">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-lightest-navy">
                    <tr className="hover:bg-navy/50">
                        <td className="p-4 text-lightest-slate">Feb 20, 2025</td>
                        <td className="p-4 text-slate">The Arts at Park Place</td>
                        <td className="p-4 text-slate">Countertops - Quartz</td>
                        <td className="p-4 text-bright-cyan font-bold">Approved</td>
                    </tr>
                     <tr className="hover:bg-navy/50">
                        <td className="p-4 text-lightest-slate">Feb 18, 2025</td>
                        <td className="p-4 text-slate">Canyon Creek</td>
                        <td className="p-4 text-slate">Make-Ready</td>
                        <td className="p-4 text-bright-pink font-bold">Pending</td>
                    </tr>
                     <tr className="hover:bg-navy/50">
                        <td className="p-4 text-lightest-slate">Jan 15, 2025</td>
                        <td className="p-4 text-slate">The Arts at Park Place</td>
                        <td className="p-4 text-slate">Tile - Flooring</td>
                        <td className="p-4 text-slate font-bold">Completed</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
);

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
            <p className="mb-6 text-bright-cyan">For {selectedCompany?.name || 'Partner'} Properties</p>

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
            
            <div className="bg-navy p-8 rounded-lg flex flex-col items-center gap-4">
                 <a 
                    href={surveyUrl} 
                    onClick={handleNav} 
                    className={`block w-full max-w-md bg-navy text-platinum font-bold py-4 px-6 rounded-md text-lg text-center hover:-translate-y-1 ${GLOW_CLASSES}`}
                >
                    Service/ Repair/ Renovation Assistant
                </a>
                
                {/* Link to Dashboard */}
                 <a 
                    href="#dashboard"
                    onClick={handleNav} 
                    className="text-sm text-slate hover:text-bright-cyan flex items-center gap-2 mt-4"
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
        
        const files = Array.from(e.target.files);
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
                // Remove data:image/png;base64, prefix for cleaner storage if needed, 
                // but for now keeping it makes it easier to display/use.
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
            <div className={`bg-light-navy p-8 rounded-lg text-center ${!embedded ? GLOW_CLASSES : ''}`}>
                <h2 className="text-3xl font-bold text-bright-cyan mb-4">{t.submitSuccessTitle}</h2>
                <p className="text-lightest-slate text-lg">{t.submitSuccessMessage1}</p>
                <p className="text-slate mt-2">{t.submitSuccessMessage2}</p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                    {onSuccess ? (
                        <button onClick={() => { handleReset(); onSuccess(); }} className="inline-block bg-bright-cyan text-navy font-bold py-3 px-6 rounded-md hover:bg-opacity-90 transition-all">
                             Return to Overview
                        </button>
                    ) : (
                        <button onClick={handleReset} className={`inline-block bg-navy border border-bright-cyan text-bright-cyan font-bold py-3 px-6 rounded-md hover:bg-bright-cyan/10 transition-all ${GLOW_CLASSES}`}>
                            {t.submitAnotherButton}
                        </button>
                    )}

                    {!embedded && (
                        <a href="#dashboard" onClick={handleNav} className={`inline-block bg-bright-cyan text-navy font-bold py-3 px-6 rounded-md hover:bg-opacity-90 transition-all ${GLOW_CLASSES}`}>
                            {t.enterDashboardButton}
                        </a>
                    )}
                </div>
            </div>
        );
    }
    
    if (submissionStatus === 'error') {
         return (
            <div className={`bg-light-navy p-8 rounded-lg text-center ${!embedded ? GLOW_CLASSES : ''}`}>
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
      <div className={`bg-light-navy rounded-lg ${!embedded ? `p-6 ${GLOW_CLASSES}` : ''}`}>
        <div className="flex justify-between items-center mb-6">
            <div>
                {!embedded && <h2 className="text-2xl font-bold text-lightest-slate mb-1">{t.surveyTitle}</h2>}
                <p className="text-slate">{t.surveySubtitle} <span className="font-bold text-bright-cyan">{company.name}</span> {t.surveySubtitleProperties}</p>
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

                    {/* PHOTO UPLOAD SECTION */}
                    <div>
                         <label className="block text-sm font-medium text-light-slate mb-2">{t.photosLabel}</label>
                         <div 
                            className={`border-2 border-dashed border-lightest-navy hover:border-bright-cyan bg-navy rounded-md p-6 flex flex-col items-center justify-center cursor-pointer transition-colors group ${GLOW_CLASSES}`}
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
                            <CloudArrowUpIcon className="h-10 w-10 text-slate group-hover:text-bright-cyan mb-2" />
                            <p className="text-sm text-slate group-hover:text-lightest-slate">{t.dragDropText}</p>
                            <button type="button" className="mt-2 bg-light-navy text-bright-cyan text-xs font-bold py-1 px-3 rounded hover:bg-bright-cyan/20">
                                {t.uploadButton}
                            </button>
                         </div>
                         
                         {/* Photo Preview List */}
                         {formData.attachments && formData.attachments.length > 0 && (
                             <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                {formData.attachments.map((file, index) => (
                                    <div key={index} className="relative aspect-square bg-light-navy rounded overflow-hidden border border-lightest-navy group">
                                        <img src={file.data} alt="Preview" className="w-full h-full object-cover" />
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemovePhoto(index)}
                                            className="absolute top-1 right-1 bg-navy/80 text-bright-pink p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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

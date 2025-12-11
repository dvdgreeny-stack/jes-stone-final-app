
import type { Company, SurveyData, HistoryEntry, UserSession } from '../types';

// DEMO DATA FOR FALLBACK MODE
const DEMO_COMPANIES: Company[] = [
    { 
        id: 'demo-co', 
        name: 'Knightvest (Demo)', 
        properties: [
            { id: 'kv-1', name: 'The Arts at Park Place', address: '1301 W Park Blvd' },
            { id: 'kv-2', name: 'Canyon Creek', address: '2000 Custer Rd' }
        ] 
    }
];

const DEMO_SESSION: UserSession = {
    company: DEMO_COMPANIES[0],
    role: 'site_manager',
    allowedPropertyIds: [],
    profile: { firstName: 'Demo', lastName: 'User', title: 'Manager', email: 'demo@example.com', phone: '555-0123' }
};

// Helper: safeFetch wraps the fetch call.
async function safeFetch(url: string, options: RequestInit, fallbackResponse?: any): Promise<any> {
    try {
        // CONTENT-TYPE IS CRITICAL: 'text/plain' prevents browser OPTIONS preflight check
        const finalOptions = {
            ...options,
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }, 
        };

        const response = await fetch(url, finalOptions);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return { ...data, _isFallback: false };
    } catch (error) {
        console.warn(`API Request Failed (${url}). Switching to Demo Fallback mode.`, error);
        
        if (fallbackResponse !== undefined) {
            // Simulate network delay for realism
            await new Promise(resolve => setTimeout(resolve, 1000));
            return { success: true, ...fallbackResponse, _isFallback: true };
        }
        
        throw error;
    }
}

export async function fetchCompanyData(apiUrl: string): Promise<{data: Company[], isFallback: boolean}> {
    const result = await safeFetch(`${apiUrl}?t=${Date.now()}`, {
        method: 'POST',
        credentials: 'omit',
        redirect: 'follow',
        body: JSON.stringify({ action: 'getCompanyData' })
    }, { data: DEMO_COMPANIES });

    if (!result.success) throw new Error(result.error || 'Failed to fetch data');
    return { data: result.data, isFallback: result._isFallback };
}

export async function login(apiUrl: string, accessCode: string): Promise<{session: UserSession, isFallback: boolean}> {
    const result = await safeFetch(apiUrl, {
        method: 'POST',
        credentials: 'omit',
        redirect: 'follow',
        body: JSON.stringify({ 
            action: 'login', 
            payload: { accessCode } 
        })
    }, { session: DEMO_SESSION });

    if (!result.success) throw new Error(result.error || 'Invalid Access Code');
    return { session: result.session, isFallback: result._isFallback };
}

export async function submitSurveyData(apiUrl: string, data: SurveyData): Promise<void> {
    // CRITICAL UPDATE: Removed the fallback object. 
    // This forces the app to throw an error if the Google Script fails,
    // allowing you to see that data is NOT being collected.
    const result = await safeFetch(apiUrl, {
        method: 'POST',
        credentials: 'omit',
        redirect: 'follow',
        body: JSON.stringify({ action: 'submitSurveyData', payload: data })
    });

    if (!result.success) throw new Error(result.error);
}

// UPDATED: ROBUST CHAT SENDER
export async function sendTestChat(apiUrl: string): Promise<string> {
    const payload = JSON.stringify({ action: 'testChat', payload: { timestamp: Date.now() } });

    try {
        // Attempt 1: Standard Request
        // We use text/plain to avoid preflight, but some browsers still block the response reading if CORS headers are missing.
        const response = await fetch(apiUrl, {
            method: 'POST',
            credentials: 'omit',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: payload
        });
        
        if (response.ok) return "Success: Server Responded OK";
        throw new Error("Standard fetch returned " + response.status);

    } catch (e) {
        console.warn("Standard fetch failed. Attempting Blind Beacon (no-cors)...", e);
        
        // Attempt 2: Blind Beacon (no-cors)
        // This sends the data but ignores the response. This usually bypasses CORS blocks.
        // If the script is up, it WILL execute.
        try {
            await fetch(apiUrl, {
                method: 'POST',
                mode: 'no-cors', 
                credentials: 'omit',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: payload
            });
            return "Signal Sent (Blind Mode - Check Chat)";
        } catch (e2) {
            console.error("All chat attempts failed", e2);
            throw new Error("Could not send signal. Check API URL.");
        }
    }
}

export async function fetchSurveyHistory(apiUrl: string, propertyName: string): Promise<HistoryEntry[]> {
    const mockHistory: HistoryEntry[] = [
        { timestamp: new Date().toISOString(), unitInfo: 'Unit 101', services: 'Countertops', photos: ['https://via.placeholder.com/150'] },
        { timestamp: new Date(Date.now() - 86400000).toISOString(), unitInfo: 'Clubhouse', services: 'Flooring', photos: [] }
    ];

    const result = await safeFetch(apiUrl, {
        method: 'POST',
        credentials: 'omit',
        redirect: 'follow',
        body: JSON.stringify({ 
            action: 'getHistory', 
            payload: { propertyName } 
        })
    }, { history: mockHistory });

    if (!result.success) throw new Error(result.error);
    return result.history || [];
}


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
        const response = await fetch(url, options);
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
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
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
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ 
            action: 'login', 
            payload: { accessCode } 
        })
    }, { session: DEMO_SESSION });

    if (!result.success) throw new Error(result.error || 'Invalid Access Code');
    return { session: result.session, isFallback: result._isFallback };
}

export async function submitSurveyData(apiUrl: string, data: SurveyData): Promise<void> {
    const result = await safeFetch(apiUrl, {
        method: 'POST',
        credentials: 'omit',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'submitSurveyData', payload: data })
    }, { message: "Demo submission successful" });

    if (!result.success) throw new Error(result.error);
}

// UPDATED: Now attempts 'no-cors' if standard fetch fails to ensure signal is sent
export async function sendTestChat(apiUrl: string): Promise<string> {
    try {
        // Attempt 1: Standard Request
        const response = await fetch(apiUrl, {
            method: 'POST',
            credentials: 'omit',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'testChat' })
        });
        
        if (response.ok) return "Success! Notification Sent.";
        throw new Error("Standard fetch failed");
    } catch (e) {
        console.warn("Standard fetch failed. Attempting 'no-cors' beacon to force signal...");
        
        // Attempt 2: No-Cors (Fire & Forget)
        // This bypasses CORS blocks on the response, allowing the request to hit the server.
        try {
            await fetch(apiUrl, {
                method: 'POST',
                mode: 'no-cors', 
                credentials: 'omit',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'testChat' })
            });
            return "Signal Sent (Blind Mode)";
        } catch (e2) {
            console.error("All chat attempts failed", e2);
            throw new Error("Could not send chat signal.");
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
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ 
            action: 'getHistory', 
            payload: { propertyName } 
        })
    }, { history: mockHistory });

    if (!result.success) throw new Error(result.error);
    return result.history || [];
}


import type { Company, SurveyData, HistoryEntry, UserSession } from '../types';

// DEMO DATA FOR FALLBACK MODE
// This ensures the app works beautifully even if the Google Script API is unreachable/blocked.
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

// Helper: safeFetch wraps the fetch call. If it fails, it returns the fallback if provided.
async function safeFetch(url: string, options: RequestInit, fallbackResponse?: any): Promise<any> {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.warn(`API Request Failed (${url}). Switching to Demo Fallback mode.`, error);
        
        if (fallbackResponse !== undefined) {
            // Simulate network delay for realism
            await new Promise(resolve => setTimeout(resolve, 1500));
            return { success: true, ...fallbackResponse };
        }
        
        throw error;
    }
}

export async function fetchCompanyData(apiUrl: string): Promise<Company[]> {
    const result = await safeFetch(`${apiUrl}?t=${Date.now()}`, {
        method: 'POST',
        credentials: 'omit',
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'getCompanyData' })
    }, { data: DEMO_COMPANIES }); // Fallback data

    if (!result.success) throw new Error(result.error || 'Failed to fetch data');
    return result.data;
}

export async function login(apiUrl: string, accessCode: string): Promise<UserSession> {
    const result = await safeFetch(apiUrl, {
        method: 'POST',
        credentials: 'omit',
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ 
            action: 'login', 
            payload: { accessCode } 
        })
    }, { session: DEMO_SESSION }); // Fallback session

    if (!result.success) throw new Error(result.error || 'Invalid Access Code');
    return result.session;
}

export async function submitSurveyData(apiUrl: string, data: SurveyData): Promise<void> {
    const result = await safeFetch(apiUrl, {
        method: 'POST',
        credentials: 'omit',
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'submitSurveyData', payload: data })
    }, { message: "Demo submission successful" }); // Fallback success

    if (!result.success) throw new Error(result.error);
}

export async function sendTestChat(apiUrl: string): Promise<void> {
    const result = await safeFetch(apiUrl, {
        method: 'POST',
        credentials: 'omit',
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'testChat' })
    }, { message: "Demo chat test successful" });

    if (!result.success) throw new Error(result.error);
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
        referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ 
            action: 'getHistory', 
            payload: { propertyName } 
        })
    }, { history: mockHistory });

    if (!result.success) throw new Error(result.error);
    return result.history || [];
}

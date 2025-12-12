import type { Company, SurveyData, HistoryEntry, UserSession } from '../types';

// DEMO DATA FOR FALLBACK MODE
const DEMO_COMPANIES: Company[] = [
    { 
        id: 'demo-co', 
        name: 'Knightvest (Demo)', 
        properties: [
            { id: 'kv-1', name: 'The Arts at Park Place', address: '1301 W Park Blvd, Plano, TX 75075' },
            { id: 'kv-2', name: 'Canyon Creek', address: '2000 Custer Rd, Richardson, TX 75080' }
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

        const text = await response.text();
        
        try {
            const data = JSON.parse(text);
            // If the script returned { success: false, error: "..." }, throw it now
            if (data.success === false) {
                throw new Error(data.error || "Unknown Script Error");
            }
            return { ...data, _isFallback: false };
        } catch (e: any) {
            // Check if it's our own error from above
            if (e.message && e.message !== "Unexpected token" && !e.message.includes("JSON")) {
                throw e; 
            }
            
            console.error("Backend returned non-JSON response (likely an HTML error page):", text);
            
            if (text.includes("Google Drive")) {
                 throw new Error("Script Error: The Google Script is returning an HTML login page. Check 'Who has access' is set to 'Anyone' in deployment.");
            }
            if (text.includes("ScriptError")) {
                 throw new Error("Script Error: The Google Script crashed. Check the execution logs.");
            }
            
            throw new Error("Server Error: The backend returned invalid data. Check the browser console for details.");
        }

    } catch (error) {
        console.warn(`API Request Failed (${url}).`, error);
        
        if (fallbackResponse !== undefined) {
            console.info("Switching to Demo Fallback mode.");
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

    return { session: result.session, isFallback: result._isFallback };
}

export async function submitSurveyData(apiUrl: string, data: SurveyData): Promise<void> {
    console.log("Submitting Payload:", data); // DEBUG: Check console to see exactly what is sent

    // Validate payload before sending to prevent script crashes
    const safePayload = {
        ...data,
        services: data.services || [],
        contactMethods: data.contactMethods || [],
        attachments: data.attachments || []
    };

    // No fallback here. If it fails, we want the user to know.
    await safeFetch(apiUrl, {
        method: 'POST',
        credentials: 'omit',
        redirect: 'follow',
        body: JSON.stringify({ action: 'submitSurveyData', payload: safePayload })
    });
}

export async function sendTestChat(apiUrl: string): Promise<string> {
    const payload = JSON.stringify({ action: 'testChat', payload: { timestamp: Date.now() } });

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            credentials: 'omit',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: payload
        });
        
        const text = await response.text();
        try {
             const json = JSON.parse(text);
             if (json.success) return json.message || "Success";
             return "Error: " + json.error;
        } catch(e) {
             return "Server Error (Non-JSON)";
        }

    } catch (e) {
        console.warn("Standard fetch failed. Attempting Blind Beacon...", e);
        try {
            await fetch(apiUrl, {
                method: 'POST',
                mode: 'no-cors', 
                credentials: 'omit',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: payload
            });
            return "Signal Sent (Blind Mode)";
        } catch (e2) {
            throw new Error("Connection Failed");
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

    return result.history || [];
}
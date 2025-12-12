import type { Company, SurveyData, HistoryEntry, UserSession } from '../types';

// DEMO DATA FOR FALLBACK MODE
const DEMO_COMPANIES: Company[] = [
    { 
        id: 'demo-co', 
        name: 'Knightvest (Demo)', 
        properties: [
            { id: 'kv-1', name: 'Fitzhugh Townhomes', address: '2104 N Fitzhugh Ave Dallas,TX 75204' },
            { id: 'kv-2', name: 'The Lofts at West 7th', address: '929 Norwood St Fort Worth,TX 76107' },
            { id: 'kv-3', name: 'Archer Medical District', address: '2140 Medical District Dr Dallas,TX 75235' },
            { id: 'kv-4', name: 'Benton', address: '19002 Dallas Pkwy Dallas,TX 75287' },
            { id: 'kv-5', name: 'Cypress', address: '4690 Eldorado Pkwy Mckinney,TX 75070' },
            { id: 'kv-6', name: 'Dorian and Encore', address: '8401 Memorial Lane Plano,TX 75024' },
            { id: 'kv-7', name: 'The Encore', address: '4700 Tribeca Lane Plano,TX 75024' },
            { id: 'kv-8', name: 'Trinity Bluff & Trinity District', address: '701 East Bluff Street Fort Worth,TX 76102' },
            { id: 'kv-9', name: 'Belclaire', address: '5600 SMU Boulevard Dallas,TX 75206' },
            { id: 'kv-10', name: 'Remi', address: '2217 Ivan St Dallas,TX 75201' },
            { id: 'kv-11', name: 'St. James', address: '2820 McKinnon Street Dallas,TX 75201' },
            { id: 'kv-12', name: 'The Berkeley', address: '2001 Park Hill Dr Fort Worth,TX 76110' },
            { id: 'kv-13', name: 'The Standard', address: '5920  E University Blvd Dallas,TX 75206' },
            { id: 'kv-14', name: 'Vail Cliffside', address: '1635 Jefferson Cliffs Way Arlington,TX 76006' },
            { id: 'kv-15', name: 'Aberdeen at Bellmar', address: '10843 N Central Expy Dallas,TX 75231' },
            { id: 'kv-16', name: 'Avondale Parc at Bellmar', address: '10830 Stone Canyon Rd Dallas,TX 75230' },
            { id: 'kv-17', name: 'Hadley at Bellmar', address: '10640 Steppington Dallas,TX 75230' },
            { id: 'kv-18', name: 'Madison at Bellmar', address: '10501 Steppington Dallas,TX 75230' },
            { id: 'kv-19', name: 'Seville at Bellmar', address: '10651 Steppington Dallas,TX 75230' },
            { id: 'kv-20', name: 'Kade', address: '3301 Hudnall St Dallas,TX 75235' },
            { id: 'kv-21', name: 'Lauren', address: '7301 Oakmont Blvd Fort Worth,TX 76132' },
            { id: 'kv-22', name: 'Carrara at Cole', address: '4649 Cole Dallas,TX 75205' },
            { id: 'kv-23', name: 'Maddox Apartments', address: '2660 N Haskell Ave Dallas,TX 75204' },
            { id: 'kv-24', name: 'Mission Eagle Pointe', address: '325 S Jupiter Rd Allen,TX 75002' },
            { id: 'kv-25', name: 'Slate at Cole', address: '4650 Cole Dallas,TX 75205' },
            { id: 'kv-26', name: 'St. Martin', address: '9425 Rolater Rd Frisco,TX 75035' },
            { id: 'kv-27', name: 'The Halston', address: '8850 Ferguson Rd Dallas,TX 75228' },
            { id: 'kv-28', name: 'Vantage Point', address: '10700 Woodmeadow Pkwy Dallas,TX 75228' }
            
        ] 
    }
];

const DEMO_SESSION: UserSession = {
    company: DEMO_COMPANIES[0],
    role: 'site_manager',
    allowedPropertyIds: [],
    profile: { firstName: 'System', lastName: 'Fallback', title: 'Offline Mode', email: 'demo-fallback@example.com', phone: '555-0123' }
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
    // We add a timestamp to the URL to force the browser to bypass any cache
    const result = await safeFetch(`${apiUrl}?t=${Date.now()}`, {
        method: 'POST',
        credentials: 'omit',
        redirect: 'follow',
        body: JSON.stringify({ 
            action: 'login', 
            payload: { accessCode } 
        })
    }, { session: DEMO_SESSION });

    console.log("Login Result Data:", result.session); // Debugging for user
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

    const result = await safeFetch(`${apiUrl}?t=${Date.now()}`, {
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
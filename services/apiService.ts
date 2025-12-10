
import type { Company, SurveyData, HistoryEntry } from '../types';

export async function fetchCompanyData(apiUrl: string): Promise<Company[]> {
    try {
        const response = await fetch(`${apiUrl}?t=${Date.now()}`, {
            method: 'POST',
            credentials: 'omit',
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'getCompanyData' })
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to fetch data');
        return result.data;
    } catch (error) {
        console.error("API Error:", error);
        // Fallback for demo/offline testing if script fails
        return [];
    }
}

export async function submitSurveyData(apiUrl: string, data: SurveyData): Promise<void> {
    const response = await fetch(apiUrl, {
        method: 'POST',
        credentials: 'omit',
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'submitSurveyData', payload: data })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
}

export async function sendTestChat(apiUrl: string): Promise<void> {
    const response = await fetch(apiUrl, {
        method: 'POST',
        credentials: 'omit',
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'testChat' })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
}

export async function fetchSurveyHistory(apiUrl: string, propertyName: string): Promise<HistoryEntry[]> {
    const response = await fetch(apiUrl, {
        method: 'POST',
        credentials: 'omit',
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ 
            action: 'getHistory', 
            payload: { propertyName } 
        })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.history || [];
}

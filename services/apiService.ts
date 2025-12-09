import type { Company, SurveyData } from '../types';

/**
 * Fetches the list of companies and their properties from the deployed Google Apps Script.
 * @param apiUrl The URL of the deployed Google Apps Script web app.
 * @returns A promise that resolves to an array of Company objects.
 */
export async function fetchCompanyData(apiUrl: string): Promise<Company[]> {
  const response = await fetch(apiUrl, {
    method: 'POST',
    // Using text/plain is a robust workaround for Google Apps Script CORS issues.
    // The script on the other end is designed to handle this.
    headers: {
      'Content-Type': 'text/plain', 
    },
    body: JSON.stringify({ action: 'getCompanyData' }),
    redirect: 'follow', // Follow Google's 302 redirects
    credentials: 'omit', // Prevent sending cookies to avoid auth popup issues
  });

  if (!response.ok) {
    throw new Error(`Network Error: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  let result;
  
  try {
    result = JSON.parse(text);
  } catch (e) {
    // If the script crashes, it often returns an HTML error page instead of JSON.
    if (text.includes("<!DOCTYPE html>")) {
       throw new Error('Google Apps Script crashed. Check the script logs or syntax.');
    }
    throw new Error('Invalid JSON response from server.');
  }

  if (!result.success) {
    throw new Error(result.error || 'The API script returned an error while fetching data.');
  }
  return result.data;
}

/**
 * Submits the survey form data to the deployed Google Apps Script.
 * @param apiUrl The URL of the deployed Google Apps Script web app.
 * @param data The survey data to submit.
 * @returns A promise that resolves when the submission is successful.
 */
export async function submitSurveyData(apiUrl: string, data: SurveyData): Promise<void> {
  const response = await fetch(apiUrl, {
    method: 'POST',
     // Using text/plain is a robust workaround for Google Apps Script CORS issues.
    headers: {
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify({ action: 'submitSurveyData', payload: data }),
    redirect: 'follow',
    credentials: 'omit',
  });

  if (!response.ok) {
     throw new Error(`Network Error: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  let result;
  
  try {
    result = JSON.parse(text);
  } catch (e) {
    if (text.includes("<!DOCTYPE html>")) {
       throw new Error('Google Apps Script crashed during submission.');
    }
    throw new Error('Invalid JSON response from server during submission.');
  }

  if (!result.success) {
    throw new Error(result.error || 'The API script returned an error during submission.');
  }
}
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
  });

  if (!response.ok) {
    throw new Error('Network response from Google Apps Script was not ok.');
  }

  const result = await response.json();
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
  });

  if (!response.ok) {
    throw new Error('Network response from Google Apps Script was not ok during submission.');
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'The API script returned an error during submission.');
  }
}

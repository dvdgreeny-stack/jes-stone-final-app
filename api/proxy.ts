// File: /api/proxy.ts

// This is a Vercel Serverless Function. It acts as a secure proxy.
// It receives requests from our frontend app and forwards them to the Google Apps Script.

export const config = {
  runtime: 'edge', // Use the fast and efficient Vercel Edge runtime
};

export default async function handler(request: Request) {
  // 1. Get the real Google Apps Script URL from a secure environment variable.
  const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

  if (!APPS_SCRIPT_URL) {
    return new Response(JSON.stringify({ success: false, error: 'API endpoint is not configured.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Check if the incoming request is a POST request.
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Only POST requests are allowed.' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 3. Forward the exact same request body to the real Google Apps Script.
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: request.body,
    });

    // 4. Check if the call to Google was successful.
    if (!response.ok) {
      throw new Error(`Google Script responded with status: ${response.status}`);
    }

    // 5. Get the JSON response from Google and send it back to our frontend app.
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to proxy request to Google Script.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
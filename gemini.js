exports.handler = async (event) => {
  // This function securely provides the Gemini API key to the browser.
  // The browser then calls Google's API directly, avoiding Netlify's 6MB payload limit.
  // The key is stored in Netlify environment variables, never in client code.

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Cache-Control": "no-store",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers };
  }

  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    return {
      statusCode: 500,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "GEMINI_API_KEY not configured in Netlify environment variables." }),
    };
  }

  return {
    statusCode: 200,
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ key: API_KEY }),
  };
};

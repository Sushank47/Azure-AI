import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Fall back to server-side environmental variables (.env) if client parameters are not provided
    const apiKey = body.apiKey || process.env.AZURE_OPENAI_KEY;
    const endpoint = body.endpoint || process.env.AZURE_OPENAI_ENDPOINT;
    const deploymentName = body.deploymentName || process.env.AZURE_OPENAI_DEPLOYMENT;
    const apiVersion = body.apiVersion || process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview';

    if (!apiKey) {
      return Response.json({ success: false, error: 'API Key is missing' }, { status: 400 });
    }
    if (!endpoint) {
      return Response.json({ success: false, error: 'Azure Endpoint is missing' }, { status: 400 });
    }
    if (!deploymentName) {
      return Response.json({ success: false, error: 'Deployment Name is missing' }, { status: 400 });
    }
    if (!apiVersion) {
      return Response.json({ success: false, error: 'API Version is missing' }, { status: 400 });
    }

    let cleanedEndpoint = endpoint.trim();
    if (!cleanedEndpoint.startsWith('http://') && !cleanedEndpoint.startsWith('https://')) {
      cleanedEndpoint = `https://${cleanedEndpoint}`;
    }
    cleanedEndpoint = cleanedEndpoint.replace(/\/$/, '');

    const url = `${cleanedEndpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return Response.json({ success: true });
      }

      const errText = await response.text();
      let errDetails = errText;
      try {
        const parsed = JSON.parse(errText);
        errDetails = parsed.error?.message || errText;
      } catch {}

      return Response.json({
        success: false,
        error: errDetails,
        status: response.status,
      }, { status: response.status });

    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        return Response.json({ success: false, error: 'Connection timed out. Please check your Endpoint URL.' }, { status: 504 });
      }
      throw err;
    }

  } catch (error: any) {
    return Response.json({
      success: false,
      error: error.message || 'An unexpected error occurred while validating configuration.',
    }, { status: 500 });
  }
}

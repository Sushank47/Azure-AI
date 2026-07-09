import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Fall back to server-side environmental variables (.env) if client parameters are not provided
    const apiKey = body.apiKey || process.env.AZURE_OPENAI_KEY;
    const endpoint = body.endpoint || process.env.AZURE_OPENAI_ENDPOINT;
    const deploymentName = body.deploymentName || process.env.AZURE_OPENAI_DEPLOYMENT;
    const apiVersion = body.apiVersion || process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview';

    const {
      messages,
      temperature,
      maxTokens,
      topP,
      presencePenalty,
      frequencyPenalty,
      useStreaming = true,
    } = body;

    if (!apiKey || !endpoint || !deploymentName || !apiVersion || !messages) {
      return new Response(
        JSON.stringify({ error: 'Missing required configuration parameters (Key, Endpoint, or Deployment).' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let cleanedEndpoint = endpoint.trim();
    if (!cleanedEndpoint.startsWith('http://') && !cleanedEndpoint.startsWith('https://')) {
      cleanedEndpoint = `https://${cleanedEndpoint}`;
    }
    cleanedEndpoint = cleanedEndpoint.replace(/\/$/, '');

    const url = `${cleanedEndpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;

    const payload = {
      messages,
      temperature: Number(temperature) ?? 0.7,
      max_tokens: Number(maxTokens) ?? 1500,
      top_p: Number(topP) ?? 0.95,
      presence_penalty: Number(presencePenalty) ?? 0,
      frequency_penalty: Number(frequencyPenalty) ?? 0,
      stream: useStreaming,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = errorText;
      try {
        const parsed = JSON.parse(errorText);
        errorMsg = parsed.error?.message || errorText;
      } catch {}

      return new Response(
        JSON.stringify({ error: `Azure OpenAI API returned error: ${errorMsg}` }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (useStreaming) {
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
        },
      });
    } else {
      const data = await response.json();
      return Response.json(data);
    }

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred during completion.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

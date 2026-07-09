import os
import json
import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
import httpx

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("azure_backend")

# Load environment variables from root workspace directory (.env is one level up)
load_dotenv(dotenv_path="../.env")

app = FastAPI(title="Azure AI Foundry Backend Proxy")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Read environment configurations
API_KEY = os.getenv("AZURE_OPENAI_KEY")
ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT")
API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION", "2024-12-01-preview")

@app.on_event("startup")
def startup_event():
    logger.info("Starting Azure AI Foundry Backend Proxy server...")
    logger.info(f"Loaded Endpoint: {ENDPOINT}")
    logger.info(f"Loaded Deployment: {DEPLOYMENT}")
    logger.info(f"Loaded API Version: {API_VERSION}")
    if not API_KEY:
        logger.warning("Warning: AZURE_OPENAI_KEY is missing in environmental variables.")

@app.post("/api/chat/validate")
async def validate_connection(request: Request):
    """
    Validates Azure OpenAI credentials by sending a minimal test completion prompt.
    """
    try:
        body = await request.json()
        api_key = body.get("apiKey") or API_KEY
        endpoint = body.get("endpoint") or ENDPOINT
        deployment = body.get("deploymentName") or DEPLOYMENT
        api_version = body.get("apiVersion") or API_VERSION

        if not api_key or not endpoint or not deployment or not api_version:
            raise HTTPException(status_code=400, detail="Missing configuration credentials.")

        # Clean endpoint URL
        cleaned_endpoint = endpoint.strip()
        if not cleaned_endpoint.startswith("http://") and not cleaned_endpoint.startswith("https://"):
            cleaned_endpoint = f"https://{cleaned_endpoint}"
        cleaned_endpoint = cleaned_endpoint.rstrip("/")

        url = f"{cleaned_endpoint}/openai/deployments/{deployment}/chat/completions?api-version={api_version}"

        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                headers={
                    "Content-Type": "application/json",
                    "api-key": api_key,
                },
                json={
                    "messages": [{"role": "user", "content": "ping"}],
                    "max_tokens": 1
                },
                timeout=8.0
            )

        if response.status_code == 200:
            return {"success": True}
        
        err_details = response.text
        try:
            parsed = response.json()
            err_details = parsed.get("error", {}).get("message", response.text)
        except Exception:
            pass

        return {"success": False, "error": err_details, "status": response.status_code}

    except httpx.TimeoutException:
        return {"success": False, "error": "Connection timed out. Check endpoint URL.", "status": 504}
    except Exception as e:
        return {"success": False, "error": str(e), "status": 500}

@app.post("/api/chat/stream")
async def stream_chat_completion(request: Request):
    """
    Streams Azure OpenAI chat completion responses chunk-by-chunk using SSE.
    """
    try:
        body = await request.json()
        
        # Merge payload values with environment variables
        api_key = body.get("apiKey") or API_KEY
        endpoint = body.get("endpoint") or ENDPOINT
        deployment = body.get("deploymentName") or DEPLOYMENT
        api_version = body.get("apiVersion") or API_VERSION
        
        messages = body.get("messages")
        temperature = body.get("temperature", 0.7)
        max_tokens = body.get("maxTokens", 1500)
        top_p = body.get("topP", 0.95)
        presence_penalty = body.get("presencePenalty", 0)
        frequency_penalty = body.get("frequencyPenalty", 0)
        use_streaming = body.get("useStreaming", True)

        if not api_key or not endpoint or not deployment or not api_version or not messages:
            raise HTTPException(status_code=400, detail="Missing configuration parameters.")

        cleaned_endpoint = endpoint.strip()
        if not cleaned_endpoint.startswith("http://") and not cleaned_endpoint.startswith("https://"):
            cleaned_endpoint = f"https://{cleaned_endpoint}"
        cleaned_endpoint = cleaned_endpoint.rstrip("/")

        url = f"{cleaned_endpoint}/openai/deployments/{deployment}/chat/completions?api-version={api_version}"

        payload = {
            "messages": messages,
            "temperature": float(temperature),
            "max_tokens": int(max_tokens),
            "top_p": float(top_p),
            "presence_penalty": float(presence_penalty),
            "frequency_penalty": float(frequency_penalty),
            "stream": bool(use_streaming)
        }

        headers = {
            "Content-Type": "application/json",
            "api-key": api_key,
        }

        if not use_streaming:
            async with httpx.AsyncClient() as client:
                res = await client.post(url, headers=headers, json=payload, timeout=30.0)
            if res.status_code != 200:
                raise HTTPException(status_code=res.status_code, detail=res.text)
            return res.json()

        # Handle Async streaming generator
        async def event_generator():
            async with httpx.AsyncClient() as client:
                async with client.stream("POST", url, headers=headers, json=payload, timeout=60.0) as response:
                    if response.status_code != 200:
                        err_content = await response.aread()
                        logger.error(f"Azure API returned status {response.status_code}: {err_content.decode()}")
                        yield f"data: {json.dumps({'error': err_content.decode()})}\n\n"
                        return

                    async for chunk in response.aiter_lines():
                        if chunk.strip():
                            yield f"{chunk}\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    except Exception as e:
        logger.error(f"Error in stream endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Run server locally on port 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

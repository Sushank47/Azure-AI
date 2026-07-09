import os
import httpx
from dotenv import load_dotenv

# Determine absolute path to .env file relative to the script location
script_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(script_dir, "..", ".env")
load_dotenv(dotenv_path=dotenv_path)

API_KEY = os.getenv("AZURE_OPENAI_KEY")
ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT")
API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION")

print("=========================================")
print("Azure OpenAI Credentials Verification")
print("=========================================")
print(f"Endpoint:    {ENDPOINT}")
print(f"Deployment:  {DEPLOYMENT}")
print(f"API Version: {API_VERSION}")
print("-----------------------------------------")

if not API_KEY or not ENDPOINT or not DEPLOYMENT or not API_VERSION:
    print("ERROR: Missing one or more credentials in the .env file.")
    exit(1)

cleaned_endpoint = ENDPOINT.strip()
if not cleaned_endpoint.startswith("http://") and not cleaned_endpoint.startswith("https://"):
    cleaned_endpoint = f"https://{cleaned_endpoint}"
cleaned_endpoint = cleaned_endpoint.rstrip("/")

url = f"{cleaned_endpoint}/openai/deployments/{DEPLOYMENT}/chat/completions?api-version={API_VERSION}"

try:
    response = httpx.post(
        url,
        headers={
            "Content-Type": "application/json",
            "api-key": API_KEY,
        },
        json={
            "messages": [{"role": "user", "content": "ping"}],
            "max_tokens": 5
        },
        timeout=10.0
    )
    
    if response.status_code == 200:
        print("✅ SUCCESS: The API Key and Endpoint are working perfectly!")
        print("Response:", response.json()["choices"][0]["message"]["content"].strip())
    else:
        print(f"❌ FAILED: Server returned status code {response.status_code}")
        print("Response text:", response.text)
except Exception as e:
    print(f"❌ ERROR: Failed to connect to endpoint: {e}")
print("=========================================")

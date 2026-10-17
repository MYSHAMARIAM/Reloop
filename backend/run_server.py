"""
Convenience server launcher for Windows or local environments.
Runs Uvicorn on http://127.0.0.1:8000
"""
import sys
from pathlib import Path

# Ensure backend root is on sys.path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import uvicorn

if __name__ == "__main__":
    print("=" * 60)
    print("Reloop — College Second-Hand Bidding Marketplace API")
    print("Starting Uvicorn server on http://127.0.0.1:8000")
    print("Interactive Swagger Docs: http://127.0.0.1:8000/docs")
    print("=" * 60)
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

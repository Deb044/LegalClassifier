"""
Root-level entry point.

The application logic lives in src/server/app.py.
To start the server:

    uvicorn src.server.app:app --host 0.0.0.0 --port 7860

Or run this file directly:

    python app.py
"""
import uvicorn

if __name__ == "__main__":
    uvicorn.run("src.server.app:app", host="0.0.0.0", port=7860, reload=False)

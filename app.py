"""VOX voice-chat web server. Run with: python app.py"""
import os
from flask import Flask, send_from_directory, jsonify

app = Flask(__name__, static_folder=".", static_url_path="")

@app.get("/")
def index():
    return send_from_directory(".", "index.html")

@app.get("/health")
def health():
    return jsonify({"app": "VOX", "status": "ok"})

if __name__ == "__main__":
    # For LAN testing use 0.0.0.0; production should use HTTPS.
    app.run(host=os.getenv("HOST", "127.0.0.1"),
            port=int(os.getenv("PORT", "5000")), debug=False)

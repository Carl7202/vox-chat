"""GUITAR LAB local preview server. GitHub Pages serves static files directly."""
import os
from flask import Flask, send_from_directory, jsonify

app = Flask(__name__, static_folder=".", static_url_path="")

@app.get("/")
def index():
    return send_from_directory(".", "index.html")

@app.get("/health")
def health():
    return jsonify({"app": "GUITAR LAB", "status": "ok"})

if __name__ == "__main__":
    app.run(host=os.getenv("HOST", "127.0.0.1"), port=int(os.getenv("PORT", "5000")), debug=False)

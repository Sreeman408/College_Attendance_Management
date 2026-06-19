# host_publicly.py - Starts HTTP server and opens a secure public Cloudflare Tunnel

import os
import sys
import urllib.request
import subprocess
import threading
import http.server
import socketserver
import re
import time

PORT = 8000
CLOUDFLARED_URL = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
EXE_PATH = "cloudflared.exe"
LOG_FILE = "cloudflared.log"

def start_http_server():
    class Handler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            pass # Suppress command logs to keep terminal output clean
            
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving HTTP locally on port {PORT}...")
        httpd.serve_forever()

def download_cloudflared():
    if not os.path.exists(EXE_PATH):
        print("Downloading Cloudflare Tunnel client (cloudflared)... This might take a moment...")
        req = urllib.request.Request(
            CLOUDFLARED_URL,
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        with urllib.request.urlopen(req) as response, open(EXE_PATH, 'wb') as out_file:
            data = response.read()
            out_file.write(data)
        print("Download complete.")
    else:
        print("Cloudflare Tunnel client already exists.")

def run_tunnel():
    print("Starting Cloudflare Tunnel...")
    # Cloudflared outputs connection logs to stdout/stderr. We pipe and monitor it.
    cmd = [EXE_PATH, "tunnel", "--url", f"http://localhost:{PORT}"]
    
    with open(LOG_FILE, "w", encoding="utf-8") as log_f:
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        
        for line in process.stdout:
            log_f.write(line)
            log_f.flush()
            # Parse trycloudflare.com URL
            match = re.search(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com", line)
            if match:
                url = match.group(0)
                print("\n" + "="*50)
                print(f"PUBLIC WEBSITE URL GENERATED:")
                print(f" {url}")
                print("="*50 + "\n")
                
                # Write to helper file so parent agent can read it
                with open("public_url.txt", "w") as f:
                    f.write(url)
                print("URL saved to public_url.txt")

if __name__ == "__main__":
    # 1. Start local server in background
    server_thread = threading.Thread(target=start_http_server, daemon=True)
    server_thread.start()
    time.sleep(1)

    # 2. Setup and run public tunnel
    try:
        download_cloudflared()
        run_tunnel()
    except Exception as e:
        print(f"Error occurred starting tunnel: {e}", file=sys.stderr)

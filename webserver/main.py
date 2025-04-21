from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
import os
import logging

app = FastAPI()

# Logging config
logging.basicConfig(
    filename="server.log",
    format="%(asctime)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)

# Map to hold mounted apps
MOUNTED_APPS = {}
DEPLOYED_DIR = "./deployed_apps"

# Mount all deployed apps
def mount_apps():
    for app_name in os.listdir(DEPLOYED_DIR):
        app_path = os.path.join(DEPLOYED_DIR, app_name, "build")
        if os.path.isdir(app_path):
            app_url = f"/{app_name}"
            print(f"Mounting {app_url} -> {app_path}")
            app.mount(app_url, StaticFiles(directory=app_path, html=True), name=app_name)
            MOUNTED_APPS[app_name] = app_path
            logging.info(f"Mounted app '{app_name}' at path {app_url}")

@app.get("/")
async def root():
    return {"message": "Welcome to KLIPSE"}

@app.middleware("http")
async def log_requests(request: Request, call_next):
    client_ip = request.client.host
    url = str(request.url)
    method = request.method
    response = await call_next(request)
    logging.info(f"{client_ip} - {method} {url} - {response.status_code}")
    return response

@app.get("/{app_name}/{path:path}")
async def fallback_handler(app_name: str, path: str, request: Request):
    build_dir = MOUNTED_APPS.get(app_name)
    if build_dir:
        index_path = os.path.join(build_dir, "index.html")
        if os.path.exists(index_path):
            return HTMLResponse(open(index_path).read())
    return HTMLResponse("<h1>App Not Found</h1>", status_code=404)

mount_apps()

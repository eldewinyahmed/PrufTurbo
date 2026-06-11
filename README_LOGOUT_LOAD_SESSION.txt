PruefTurbo Auth Admin GUI + Logout + Load Session
================================================

This package extends the current PruefTurbo FastAPI app with:

1. Authentication-protected logout
   - URL: /logout
   - Clears the auth cookie and redirects to /login.

2. Session save
   - Existing URL: /api/session/save
   - Downloads a JSON file containing current test cases and dictionary rows.

3. Session load GUI
   - URL: /session/load
   - Upload a previously saved PruefTurbo_session_*.json file.
   - Loading replaces the current browser session state.

4. Session load API
   - POST /api/session/load
   - multipart/form-data file field: file

Deployment
----------

On the server:

cd ~/PrufTurbo
pkill -f uvicorn || true

Copy the package files into the repository, then:

git add .
git commit -m "Add logout and session load support"
git push origin main

On the Hetzner server:

cd ~/PrufTurbo
git pull origin main
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

Usage
-----

Logout:
http://YOUR_SERVER_IP:8000/logout

Load session:
http://YOUR_SERVER_IP:8000/session/load

Save session:
Use /api/session/save or the tool's Save Session button if available in the UI.

PruefTurbo UI Enhancement Package
=================================

Added features
--------------
1) After generation, a generated-file download panel appears at the top-right of the page.
2) /api/generate-direct and /api/generate-dictionary now return the full CAPL preview, not only the first 10,000 characters.
3) New endpoints:
   - GET /api/output/{filename}/text
   - GET /api/session/current-output
4) Load Session button can be injected beside Save Session / Reset Session.
5) Load CAPL button can load a local .can/.cin/.txt file into the CAPL viewer.
6) CAPL viewer is expanded to show the whole generated content without artificial row limitation.
7) Reset Session clears dynamic UI fields, selected checkboxes, tables, previews, and download panel.

Files in this package
---------------------
app/main.py
app/static/pruefturbo_ui_enhancements.js
tools/install_ui_enhancements.py

Installation on your repo/server
--------------------------------
1. Copy files into the repository root:
   cp -r app tools ~/PrufTurbo/

2. Inject the UI script into your index.html:
   cd ~/PrufTurbo
   python tools/install_ui_enhancements.py

   If the script cannot find the template, manually add this before </body> in app/templates/index.html:
   <script src="/static/pruefturbo_ui_enhancements.js"></script>

3. Restart server:
   pkill -f uvicorn
   source .venv/bin/activate
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

4. Test:
   - Open http://YOUR_SERVER_IP:8000
   - Login
   - Generate CAPL
   - Download button should appear in the top-right area
   - Save Session / Load Session / Reset Session should be available

Git workflow
------------
cd ~/PrufTurbo
git add app/main.py app/static/pruefturbo_ui_enhancements.js tools/install_ui_enhancements.py README_UI_ENHANCEMENTS.txt
git commit -m "Add generation download panel and session UI enhancements"
git push origin main

Then on server:
cd ~/PrufTurbo
git pull origin main
python tools/install_ui_enhancements.py
pkill -f uvicorn
source .venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

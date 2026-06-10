PruefTurbo Authentication Package

Files included:
- app/main.py                  -> replace your current app/main.py
- app/templates/login.html     -> add this new template
- create_user.py               -> create/change users in data/users.json

Deploy on server:
1) Stop Uvicorn with Ctrl+C.
2) From project root: cd ~/PrufTurbo
3) Backup current main.py:
   cp app/main.py app/main.py.backup
4) Copy the new files into the same locations.
5) Create your real user/password:
   python3 create_user.py
6) Start app again:
   source .venv/bin/activate
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

Default emergency login if data/users.json does not exist:
- username: ahmad.doweny@gmail.com
- password: ChangeMe-StrongPassword-2026!

Important: run python3 create_user.py and change this immediately.

Security note:
This protects the app by login cookie. For production, add Nginx + HTTPS and block direct public access to port 8000.

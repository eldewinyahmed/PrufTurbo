PruefTurbo Authentication + Admin User GUI Package
====================================================

What this package adds
----------------------
1. Login protection for the whole FastAPI app.
2. Admin-only web GUI for user management:
   http://YOUR_SERVER_IP:8000/admin/users
3. Admin APIs to list, add, update, deactivate, delete users, and reset passwords.
4. Role field support: admin, user, viewer.
5. Safety guard: the last active admin cannot be deleted, deactivated, or downgraded.

Install on server
-----------------
cd ~/PrufTurbo
cp app/main.py app/main.py.backup_$(date +%Y%m%d_%H%M%S)
unzip pruefturbo_auth_admin_gui_package.zip -d /tmp/pruefturbo_auth_admin_gui
cp /tmp/pruefturbo_auth_admin_gui/app/main.py app/main.py
cp /tmp/pruefturbo_auth_admin_gui/app/templates/login.html app/templates/login.html
cp /tmp/pruefturbo_auth_admin_gui/app/templates/admin_users.html app/templates/admin_users.html
cp /tmp/pruefturbo_auth_admin_gui/create_user.py ./create_user.py

Create first admin user if needed
---------------------------------
source .venv/bin/activate
python ./create_user.py

Start app
---------
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

Open admin page
---------------
http://YOUR_SERVER_IP:8000/admin/users

Roles
-----
admin  = can manage users and access the tool.
user   = can access the tool, but cannot manage users.
viewer = stored for future read-only logic. Currently it can log in like user unless you add endpoint-level role checks.

Security notes
--------------
Use HTTPS/Nginx before sharing the tool broadly.
When HTTPS is active, change secure=False to secure=True in the login cookie.
Keep data/users.json and data/auth_secret.key private.

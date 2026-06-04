PrüfTurbo v8 - Schnell. Präzise. Rückverfolgbar
=====================================================

Run on Windows:
1. Open Command Prompt in this folder.
2. Run:
   run_local.bat
3. Open:
   http://127.0.0.1:8000

Run on Linux/macOS:
   chmod +x run_local.sh
   ./run_local.sh

Main tabs:
- Test Specs: upload existing Excel test specification files.
- Test Case Builder: create/edit/delete browser-built test cases, export them to Excel, and use them directly for CAPL generation.
- Dictionary: upload JSON/XLSX dictionaries, add/update/delete entries, export JSON.
- Generation: select/filter test cases and generate CAPL directly or through the dictionary.
- CAPL Viewer: edit/save/download generated CAPL.
- Traceability: view Requirement -> Test Case mapping.
- KPI: view coverage and test-case status metrics.

Notes:
- Builder-created test cases live in the current browser session.
- Export Specs Excel downloads a TestSpecs workbook compatible with the app's parser.
- Generated files are written to the outputs folder.

v4 Builder additions:
- Clone Test Case button duplicates the selected builder/testspec row as a new editable test case.
- Add Test Step from Dictionary: choose category, available dictionary step, target specs field (Precondition, Action, Expectation, Postcondition), optional parameters separated by |, then append to the selected field.

v5 updates:
- Test Case Builder auto-numbers inserted dictionary steps per specs field.
- Available Step list is filtered by Specs Field intent: Action shows send/set/measure style steps; Expectation shows expect/verify/check style steps; Precondition/Postcondition show setup/cleanup style steps.
- Traceability tab displays both Requirement → Test Cases and Test Cases → Requirements.

v6 updates:
- Test Case Builder now shows a live preview of the selected dictionary step before adding/copying.
- Parameter values entered as `value1 | value2` are inserted as `[value1]`, `[value2]` unless already bracketed.
- Traceability tab now supports Downstream and Upstream tree views.
- Traceability can be exported to Excel from the active direction.


Version v7 update:
- CAPL Viewer now includes browser-side CAPL syntax highlighting for keywords, APIs, comments, strings, numbers, preprocessor lines, functions, and variables.


v8 branding update:
- Application/browser icon added: PruefTurbo_Icon.ico
- Browser favicon added under app/static/icons/
- Header changed to: PrüfTurbo
- Subtitle changed to: Schnell. Präzise. Rückverfolgbar
- Browser tab title changed to: PrüfTurbo

For a Windows executable/icon build, use the included icon file:
  pyinstaller --onefile --windowed --icon PruefTurbo_Icon.ico app/main.py

============================================================
VERSION 11.0 KNOWLEDGE CENTER UPDATE
============================================================
This regenerated package includes an upgraded PrüfTurbo Knowledge Center integrated into the existing Help tab.

Highlights:
- Professional Knowledge Center landing dashboard
- Welcome panel with version/build/language information
- Quick Actions linked to the main application tabs
- Searchable documentation index
- Interactive guided tour for first-time users
- Engineering Concepts Library for diagnostic services
- Dictionary Engineering Guide with good/bad examples and placeholder strategy
- CAPL Engineering Guide with generated module architecture
- Traceability Academy and KPI Academy
- Enterprise Governance, Administrator Guide, API Documentation, and Audit & Compliance Guide
- Final positioning page: From Manual Validation to Industrialized Test Automation

How to use:
1. Start the application using run_local.bat or run_local.sh.
2. Open the browser URL shown by the server.
3. Click the Help tab.
4. Use Start Guided Tour for an interactive walkthrough.
5. Use Search Knowledge Center to find topics such as CAPL, DID, traceability, dictionary, or security access.
6. Use Quick Actions to jump from documentation to the relevant working screen.

v11.1 Update:
- Knowledge Center help content now follows the active runtime language selection: English, German, French, and Arabic.
- Added Credits & Author Profile section for Ahmed ELDEWINY based on the supplied LinkedIn/PDF profile content.

from pathlib import Path
root = Path(__file__).resolve().parents[1]
idx_candidates = [root/'app/templates/index.html', root/'app/templates/main.html', root/'app/index.html']
script = '<script src="/static/pruefturbo_ui_enhancements.js"></script>'
for path in idx_candidates:
    if path.exists():
        s = path.read_text(encoding='utf-8')
        if 'pruefturbo_ui_enhancements.js' not in s:
            if '</body>' in s:
                s = s.replace('</body>', f'  {script}\n</body>')
            else:
                s += '\n' + script + '\n'
            path.write_text(s, encoding='utf-8')
            print(f'Injected script into {path}')
        else:
            print(f'Script already present in {path}')
        break
else:
    print('No index template found. Add this line before </body> in app/templates/index.html:')
    print(script)

/* PrüfTurbo UI Enhancements
   - Generated output download panel in top-right generation area
   - Load Session button beside Save/Reset session controls
   - CAPL viewer load button
   - Full CAPL viewer display, no artificial row/height limit
   - Reset session clears dynamic UI fields/tables/viewers
*/
(function () {
  'use strict';

  const PT = {
    lastOutput: null,
    initialized: false,
  };

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function textOf(el) { return (el && (el.innerText || el.textContent) || '').trim(); }
  function byText(selector, rx) { return Array.from(document.querySelectorAll(selector)).filter(el => rx.test(textOf(el))); }

  function makeButton(label, onClick, title) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.title = title || label;
    b.addEventListener('click', onClick);
    b.style.marginLeft = '8px';
    b.style.padding = '8px 12px';
    b.style.borderRadius = '8px';
    b.style.border = '1px solid #2563eb';
    b.style.background = '#2563eb';
    b.style.color = '#fff';
    b.style.cursor = 'pointer';
    b.style.fontWeight = '600';
    return b;
  }

  function ensureDownloadPanel() {
    let panel = document.getElementById('pt-generated-download-panel');
    if (panel) return panel;

    panel = document.createElement('div');
    panel.id = 'pt-generated-download-panel';
    panel.style.position = 'fixed';
    panel.style.top = '14px';
    panel.style.right = '28px';
    panel.style.zIndex = '9999';
    panel.style.minWidth = '320px';
    panel.style.maxWidth = '520px';
    panel.style.padding = '10px 14px';
    panel.style.border = '1px solid #cbd5e1';
    panel.style.borderRadius = '12px';
    panel.style.background = '#ffffff';
    panel.style.boxShadow = '0 8px 20px rgba(15,23,42,.12)';
    panel.style.display = 'none';
    panel.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;justify-content:space-between;">
        <div style="min-width:0;">
          <div style="font-weight:700;color:#0f172a;">Generated CAPL file</div>
          <div id="pt-generated-filename" style="font-size:12px;color:#475569;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></div>
        </div>
        <a id="pt-generated-download-link" href="#" download style="display:inline-block;background:#16a34a;color:white;text-decoration:none;padding:8px 12px;border-radius:8px;font-weight:700;white-space:nowrap;">Download</a>
      </div>`;
    document.body.appendChild(panel);
    return panel;
  }

  function updateDownloadPanel(filename, downloadUrl) {
    if (!filename || !downloadUrl) return;
    PT.lastOutput = { filename, downloadUrl };
    const panel = ensureDownloadPanel();
    panel.style.display = 'block';
    const name = document.getElementById('pt-generated-filename');
    const link = document.getElementById('pt-generated-download-link');
    if (name) name.textContent = filename;
    if (link) {
      link.href = downloadUrl;
      link.setAttribute('download', filename);
    }
  }

  function findSessionToolbar() {
    const candidates = byText('button,a', /save session|reset session/i);
    if (candidates.length) return candidates[0].parentElement || candidates[0].closest('div,nav,section,header') || document.body;
    const header = document.querySelector('header, nav, .toolbar, .topbar');
    return header || document.body;
  }

  function addLoadSessionButton() {
    if (document.getElementById('pt-load-session-btn')) return;
    const toolbar = findSessionToolbar();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.display = 'none';
    input.id = 'pt-load-session-input';
    input.addEventListener('change', async () => {
      if (!input.files || !input.files[0]) return;
      const fd = new FormData();
      fd.append('file', input.files[0]);
      const res = await fetch('/api/session/load', { method: 'POST', body: fd });
      if (!res.ok) {
        alert('Load session failed: ' + await res.text());
        return;
      }
      alert('Session loaded successfully. The page will reload.');
      window.location.reload();
    });
    const btn = makeButton('Load Session', () => input.click(), 'Load saved PrüfTurbo session JSON');
    btn.id = 'pt-load-session-btn';
    toolbar.appendChild(input);
    toolbar.appendChild(btn);
  }

  function getCaplViewerElement() {
    const areas = Array.from(document.querySelectorAll('textarea, pre, code, div'));
    const likely = areas.find(el => {
      const id = (el.id || '').toLowerCase();
      const cls = (el.className || '').toString().toLowerCase();
      return id.includes('capl') || cls.includes('capl') || id.includes('viewer') || cls.includes('viewer');
    });
    return likely || document.querySelector('textarea');
  }

  function setViewerContent(content) {
    const el = getCaplViewerElement();
    if (!el) return;
    if ('value' in el) el.value = content;
    else el.textContent = content;
    el.style.maxHeight = 'none';
    el.style.height = 'auto';
    el.style.minHeight = '600px';
    el.style.overflow = 'auto';
    el.style.whiteSpace = 'pre';
    el.style.width = '100%';
  }

  function addCaplLoadButton() {
    if (document.getElementById('pt-load-capl-btn')) return;
    const viewer = getCaplViewerElement();
    const parent = (viewer && (viewer.parentElement || viewer.closest('section,div'))) || findSessionToolbar();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.can,.cin,.txt,text/plain';
    input.style.display = 'none';
    input.id = 'pt-load-capl-input';
    input.addEventListener('change', async () => {
      if (!input.files || !input.files[0]) return;
      const content = await input.files[0].text();
      setViewerContent(content);
    });
    const btn = makeButton('Load CAPL', () => input.click(), 'Load a local CAPL/CAN/TXT file into the viewer');
    btn.id = 'pt-load-capl-btn';
    parent.insertBefore(input, parent.firstChild);
    parent.insertBefore(btn, input.nextSibling);
  }

  function expandCaplViewer() {
    const el = getCaplViewerElement();
    if (!el) return;
    el.style.maxHeight = 'none';
    el.style.minHeight = '600px';
    el.style.height = 'auto';
    el.style.overflow = 'auto';
    el.style.whiteSpace = 'pre';
    el.style.width = '100%';
  }

  function clearDynamicFields() {
    document.querySelectorAll('input, textarea, select').forEach(el => {
      const type = (el.getAttribute('type') || '').toLowerCase();
      if (['button','submit','reset','hidden'].includes(type)) return;
      if (type === 'checkbox' || type === 'radio') el.checked = false;
      else if (type === 'file') el.value = '';
      else if (el.tagName === 'SELECT') el.selectedIndex = 0;
      else el.value = '';
    });
    document.querySelectorAll('[data-dynamic], .dynamic, .results, .preview, .capl-preview, #caplViewer, #capl-viewer').forEach(el => {
      if ('value' in el) el.value = '';
      else el.textContent = '';
    });
    document.querySelectorAll('table tbody').forEach(tbody => { tbody.innerHTML = ''; });
    const panel = document.getElementById('pt-generated-download-panel');
    if (panel) panel.style.display = 'none';
    PT.lastOutput = null;
  }

  function hookFetch() {
    if (window.__ptFetchHooked) return;
    window.__ptFetchHooked = true;
    const originalFetch = window.fetch.bind(window);
    window.fetch = async function(input, init) {
      const res = await originalFetch(input, init);
      try {
        const url = typeof input === 'string' ? input : (input && input.url) || '';
        const clone = res.clone();
        if (/\/api\/generate-(direct|dictionary)/.test(url)) {
          const data = await clone.json();
          if (data && data.download_url) updateDownloadPanel(data.filename || 'generated.can', data.download_url);
          if (data && typeof data.preview === 'string') setViewerContent(data.preview);
        }
        if (/\/api\/capl\/save/.test(url)) {
          const data = await clone.json();
          if (data && data.download_url) updateDownloadPanel(data.filename || 'generated.can', data.download_url);
        }
        if (/\/api\/session\/reset/.test(url) && res.ok) {
          setTimeout(clearDynamicFields, 100);
        }
      } catch (e) {}
      return res;
    };
  }

  function hookResetButtons() {
    byText('button,a', /reset session/i).forEach(el => {
      if (el.__ptResetHooked) return;
      el.__ptResetHooked = true;
      el.addEventListener('click', () => setTimeout(clearDynamicFields, 500));
    });
  }

  async function loadLastOutputIfAny() {
    try {
      const res = await fetch('/api/session/current-output');
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.ok && data.download_url) {
        updateDownloadPanel(data.filename, data.download_url);
        if (data.content) setViewerContent(data.content);
      }
    } catch (e) {}
  }

  function init() {
    if (PT.initialized) return;
    PT.initialized = true;
    ensureDownloadPanel();
    addLoadSessionButton();
    addCaplLoadButton();
    expandCaplViewer();
    hookFetch();
    hookResetButtons();
    loadLastOutputIfAny();

    const mo = new MutationObserver(() => {
      addLoadSessionButton();
      addCaplLoadButton();
      expandCaplViewer();
      hookResetButtons();
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  ready(init);
})();

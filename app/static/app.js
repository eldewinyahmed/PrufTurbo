const state = { testcases: [], dictionaryRows: [], selectedKeys: new Set(), lastDownload: null };
const $ = id => document.getElementById(id);
function setStatus(msg){ $('status').textContent = msg; }
function escapeHtml(s){ return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
async function api(path, opts={}){ const res = await fetch(path, opts); if(!res.ok){ let t=await res.text(); try{t=JSON.parse(t).detail||t}catch{} throw new Error(t); } return res; }
async function safe(fn){ try{ await fn(); } catch(e){ alert(e.message); setStatus(e.message); } }


function highlightCapl(code){
  const tokenRe = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#[^\n]*|\b(?:testcase|variables|message|on|timer|msTimer|envvar|sysvar|dword|word|byte|char|int|long|float|double|void|const|if|else|for|while|do|return|switch|case|break|continue|default|this|true|false)\b|\b(?:output|write|setTimer|cancelTimer|testStep|testCaseTitle|testWaitForTimeout|testWaitForMessage|testWaitForSignalMatch|testWaitForSignalInRange|testSetVerdictFail|testSetVerdictPass|sendCanFrame|checkCanFrame|checkCanSignalPhysical|checkCanSignalRaw|setCanSignalPhysical|setCanSignalRaw|checkSensor|setSensor|sendDiagRequest|checkDiagResponse|sendDoipRequest|checkDoipResponse|connectDoip|disconnectDoip)\b|\b[A-Za-z_]\w*(?=\s*\()|\b0x[0-9a-fA-F]+\b|\b\d+(?:\.\d+)?\b|@[A-Za-z_]\w*)/g;
  let out = '', last = 0, m;
  while((m = tokenRe.exec(code))){
    out += escapeHtml(code.slice(last, m.index));
    const t = m[0];
    let cls = 'capl-func';
    if(t.startsWith('//') || t.startsWith('/*')) cls = 'capl-comment';
    else if(t.startsWith('"') || t.startsWith("'")) cls = 'capl-string';
    else if(t.startsWith('#')) cls = 'capl-preprocessor';
    else if(t.startsWith('@')) cls = 'capl-var';
    else if(/^(0x[0-9a-fA-F]+|\d)/.test(t)) cls = 'capl-number';
    else if(/^(output|write|setTimer|cancelTimer|testStep|testCaseTitle|testWaitForTimeout|testWaitForMessage|testWaitForSignalMatch|testWaitForSignalInRange|testSetVerdictFail|testSetVerdictPass|sendCanFrame|checkCanFrame|checkCanSignalPhysical|checkCanSignalRaw|setCanSignalPhysical|setCanSignalRaw|checkSensor|setSensor|sendDiagRequest|checkDiagResponse|sendDoipRequest|checkDoipResponse|connectDoip|disconnectDoip)$/.test(t)) cls = 'capl-api';
    else if(/^(testcase|variables|message|on|timer|msTimer|envvar|sysvar|dword|word|byte|char|int|long|float|double|void|const|if|else|for|while|do|return|switch|case|break|continue|default|this|true|false)$/.test(t)) cls = 'capl-keyword';
    out += `<span class="${cls}">${escapeHtml(t)}</span>`;
    last = tokenRe.lastIndex;
  }
  out += escapeHtml(code.slice(last));
  return out || ' ';
}
function updateCaplHighlight(){
  const editor = $('caplEditor');
  const target = $('caplHighlight');
  if(!editor || !target) return;
  target.querySelector('code').innerHTML = highlightCapl(editor.value);
  target.scrollTop = editor.scrollTop;
  target.scrollLeft = editor.scrollLeft;
}
function setCaplContent(text){
  const editor = $('caplEditor');
  if(editor) editor.value = text || '';
  updateCaplHighlight();
}

document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => { document.querySelectorAll('.tab,.panel').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); $(btn.dataset.tab).classList.add('active'); }));
$('resetSession').onclick = () => safe(async()=>{ await api('/api/session/reset',{method:'POST'}); state.testcases=[]; state.dictionaryRows=[]; state.selectedKeys.clear(); renderSpecs(); renderDictionary(); renderGeneration(); setStatus('Session reset.'); await loadDictionary(); });

$('loadSpecs').onclick = () => safe(async()=>{ const file=$('excelFile').files[0]; if(!file) throw new Error('Select an Excel file first.'); const fd=new FormData(); fd.append('file', file); setStatus('Loading Excel specification...'); const data=await (await api('/api/upload-specs',{method:'POST',body:fd})).json(); state.testcases=data.testcases; state.selectedKeys=new Set(state.testcases.filter(t=>t.valid).map(t=>t.row_key)); renderSpecs(); renderGeneration(); setStatus(`Loaded ${data.count} test cases from ${data.filename}`); });
function renderSpecs(){ $('specSummary').innerHTML = `<b>${state.testcases.length}</b> test cases loaded.`; $('specTree').innerHTML = state.testcases.map(tc => `<details><summary>${escapeHtml(tc.tc_id||tc.row_key)} — ${escapeHtml(tc.title||'(no title)')}</summary><div class="kv">${Object.entries(tc.attrs||{}).map(([k,v])=>`<b>${escapeHtml(k)}</b><span>${escapeHtml(v||'-').replaceAll('\n','<br>')}</span>`).join('')}<b>CAPL name</b><span>${escapeHtml(tc.capl_name||'')}</span><b>Generation</b><span>${tc.valid?'Valid':escapeHtml(tc.block_reason)}</span></div></details>`).join(''); }
$('expandSpecs').onclick=()=>document.querySelectorAll('#specTree details').forEach(d=>d.open=true); $('collapseSpecs').onclick=()=>document.querySelectorAll('#specTree details').forEach(d=>d.open=false);

async function loadDictionary(){ const data=await (await api('/api/dictionary')).json(); state.dictionaryRows=data.rows; renderDictionary(); updateStepPickers();
previewStepText(); setStatus(`Dictionary loaded: ${data.count} entries`); }
$('loadDictionary').onclick=()=>safe(loadDictionary);
$('uploadDictionary').onclick=()=>safe(async()=>{ const file=$('dictionaryFile').files[0]; if(!file) throw new Error('Select a JSON or Excel dictionary first.'); const fd=new FormData(); fd.append('file', file); const data=await (await api('/api/upload-dictionary',{method:'POST',body:fd})).json(); state.dictionaryRows=data.rows; await loadDictionary(); setStatus(`Uploaded dictionary: ${data.count} entries`); });
$('exportDictionary').onclick=()=>{ location.href='/api/dictionary/export'; };
$('createDictionary').onclick=()=>safe(async()=>{ if(!confirm('Replace dictionary with an empty dictionary?')) return; await api('/api/dictionary/create',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}); await loadDictionary(); });
$('addDictionary').onclick=()=>safe(async()=>{ const payload={category:$('dictCategory').value||'General',field:$('dictField').value||'Action',entry:$('dictEntry').value,translation:$('dictTranslation').value,notes:$('dictNotes').value}; if(!payload.entry) throw new Error('Entry is required.'); await api('/api/dictionary/add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); $('dictEntry').value=''; $('dictTranslation').value=''; $('dictNotes').value=''; await loadDictionary(); });
$('dictFilter').oninput=renderDictionary;
function renderDictionary(){ updateStepPickers(); const f=($('dictFilter').value||'').toLowerCase(); const rows=state.dictionaryRows.filter(r=>JSON.stringify(r).toLowerCase().includes(f)); $('dictionaryPreview').innerHTML = `<table><thead><tr><th>Category</th><th>Field</th><th>Entry</th><th>Translation</th><th>Notes</th><th>Actions</th></tr></thead><tbody>${rows.map(r=>`<tr data-id="${escapeHtml(r.row_id)}"><td><input class="inline cat" value="${escapeHtml(r.category)}"></td><td><input class="inline field" value="${escapeHtml(r.field)}"></td><td><input class="inline entry" value="${escapeHtml(r.entry)}"></td><td><input class="inline trans" value="${escapeHtml(r.translation||'')}"></td><td><input class="inline notes" value="${escapeHtml(r.notes||'')}"></td><td><div class="actionbar"><button onclick="saveDictRow('${escapeHtml(r.row_id)}')">Save</button><button class="danger" onclick="deleteDictRow('${escapeHtml(r.row_id)}')">Delete</button></div></td></tr>`).join('')}</tbody></table>`; }
window.saveDictRow=(id)=>safe(async()=>{ const tr=document.querySelector(`tr[data-id="${CSS.escape(id)}"]`); const payload={category:tr.querySelector('.cat').value,field:tr.querySelector('.field').value,entry:tr.querySelector('.entry').value,translation:tr.querySelector('.trans').value,notes:tr.querySelector('.notes').value}; await api(`/api/dictionary/update/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); await loadDictionary(); });
window.deleteDictRow=(id)=>safe(async()=>{ if(!confirm('Delete this dictionary entry?')) return; await api(`/api/dictionary/delete/${id}`,{method:'DELETE'}); await loadDictionary(); });

function generationMatches(tc){ const p=$('genFilter').value.trim(); if(!p) return true; const h=`${tc.tc_id||''} ${tc.title||''} ${tc.requirements||''}`; if($('genRegex').checked){ try{return new RegExp(p,'i').test(h)}catch{return false} } const escaped=p.toLowerCase().replace(/[.+^${}()|[\]\\]/g,'\\$&').replaceAll('*','.*').replaceAll('?','.'); return new RegExp(escaped,'i').test(h); }
function renderGeneration(){ const rows=state.testcases.filter(generationMatches); $('generationList').innerHTML = `<table><thead><tr><th>✓</th><th>Excel Row</th><th>TC ID</th><th>Title</th><th>Requirement</th><th>Status</th></tr></thead><tbody>${rows.map(tc=>`<tr><td><input type="checkbox" data-key="${escapeHtml(tc.row_key)}" ${state.selectedKeys.has(tc.row_key)?'checked':''} ${tc.valid===false?'disabled':''}></td><td>${tc.excel_row}</td><td>${escapeHtml(tc.tc_id)}</td><td>${escapeHtml(tc.title)}</td><td>${escapeHtml(tc.requirements)}</td><td>${tc.valid===false?escapeHtml(tc.block_reason):'Ready'}</td></tr>`).join('')}</tbody></table>`; document.querySelectorAll('#generationList input[type=checkbox]').forEach(cb=>cb.onchange=e=>{e.target.checked?state.selectedKeys.add(e.target.dataset.key):state.selectedKeys.delete(e.target.dataset.key)}); }
$('genFilter').oninput=renderGeneration; $('genRegex').onchange=renderGeneration; $('selectAll').onclick=()=>{state.testcases.filter(t=>t.valid!==false).forEach(t=>state.selectedKeys.add(t.row_key)); renderGeneration();}; $('deselectAll').onclick=()=>{state.selectedKeys.clear(); renderGeneration();}; $('selectMatching').onclick=()=>{state.selectedKeys.clear(); state.testcases.filter(t=>t.valid!==false&&generationMatches(t)).forEach(t=>state.selectedKeys.add(t.row_key)); renderGeneration();};
async function generate(kind){ const body=JSON.stringify({selected_keys:[...state.selectedKeys]}); setStatus(`Generating CAPL ${kind}...`); const data=await (await api(kind==='direct'?'/api/generate-direct':'/api/generate-dictionary',{method:'POST',headers:{'Content-Type':'application/json'},body})).json(); setCaplContent(data.preview); state.lastDownload=data.download_url; $('caplFilename').value=data.filename; document.querySelector('[data-tab="capl"]').click(); setStatus(`Generated ${data.filename} from ${data.selected_count} test cases.`); }
$('generateDirect').onclick=()=>safe(()=>generate('direct')); $('generateDictionary').onclick=()=>safe(()=>generate('dictionary'));
$('saveCapl').onclick=()=>safe(async()=>{ const payload={filename:$('caplFilename').value,content:$('caplEditor').value}; const data=await (await api('/api/capl/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})).json(); state.lastDownload=data.download_url; setStatus(`Saved ${data.filename}`); });
$('downloadCapl').onclick=()=>safe(async()=>{ if(!state.lastDownload) await $('saveCapl').onclick(); if(state.lastDownload) location.href=state.lastDownload; });
$('caplSearch').oninput=()=>{const q=$('caplSearch').value;if(!q)return;const ed=$('caplEditor');const i=ed.value.toLowerCase().indexOf(q.toLowerCase(),ed.selectionEnd);if(i>=0){ed.focus();ed.setSelectionRange(i,i+q.length);}};
if($('caplEditor')){ $('caplEditor').addEventListener('input', updateCaplHighlight); $('caplEditor').addEventListener('scroll', updateCaplHighlight); }
updateCaplHighlight();
let traceabilityMode = 'downstream';
let lastTraceability = null;
$('loadTraceability').onclick=()=>safe(async()=>{ const d=await (await api('/api/traceability')).json(); lastTraceability=d; renderTraceability(d); $('traceabilityOutput').textContent=JSON.stringify(d,null,2); });
if($('traceDownstream')) $('traceDownstream').onclick=()=>{ traceabilityMode='downstream'; renderTraceability(lastTraceability); };
if($('traceUpstream')) $('traceUpstream').onclick=()=>{ traceabilityMode='upstream'; renderTraceability(lastTraceability); };
if($('exportTraceability')) $('exportTraceability').onclick=()=>safe(async()=>{ location.href=`/api/traceability/export?mode=${encodeURIComponent(traceabilityMode)}`; });
function renderTraceability(d){
  if(!d){ $('traceabilityTree').innerHTML='<p class="muted">Click Refresh Traceability.</p>'; $('traceabilityTables').innerHTML=''; return; }
  if($('traceDownstream')) $('traceDownstream').classList.toggle('selected', traceabilityMode==='downstream');
  if($('traceUpstream')) $('traceUpstream').classList.toggle('selected', traceabilityMode==='upstream');
  const reqRows=Object.entries(d.requirement_to_testcases||{}).map(([req,tcs])=>`<tr><td>${escapeHtml(req)}</td><td>${tcs.map(t=>`${escapeHtml(t.tc_id)} — ${escapeHtml(t.title||'')}`).join('<br>')}</td></tr>`).join('') || '<tr><td colspan="2">No requirement links found.</td></tr>';
  const tcRows=(d.testcase_to_requirements||[]).map(row=>`<tr><td>${escapeHtml(row.tc_id)} — ${escapeHtml(row.title||'')}</td><td>${(row.requirements||[]).map(escapeHtml).join('<br>') || '<span class="warn">No requirement</span>'}</td></tr>`).join('') || '<tr><td colspan="2">No test cases loaded.</td></tr>';
  if(traceabilityMode==='downstream'){
    const tree=Object.entries(d.requirement_to_testcases||{}).map(([req,tcs])=>`<details open><summary>${escapeHtml(req)} <span class="muted">(${tcs.length} test case${tcs.length===1?'':'s'})</span></summary><ul>${tcs.map(t=>`<li><b>${escapeHtml(t.tc_id)}</b> — ${escapeHtml(t.title||'')} <span class="muted">Row ${escapeHtml(t.excel_row||'')}</span></li>`).join('')}</ul></details>`).join('') || '<p class="muted">No requirement links found.</p>';
    $('traceabilityTree').innerHTML=`<h3>Downstream Traceability: Requirement → Test Cases</h3>${tree}`;
    $('traceabilityTables').innerHTML=`<table><thead><tr><th>Requirement</th><th>Linked Test Cases</th></tr></thead><tbody>${reqRows}</tbody></table>`;
  } else {
    const tree=(d.testcase_to_requirements||[]).map(row=>`<details open><summary>${escapeHtml(row.tc_id)} — ${escapeHtml(row.title||'')} <span class="muted">(${(row.requirements||[]).length} requirement${(row.requirements||[]).length===1?'':'s'})</span></summary><ul>${(row.requirements||[]).length ? row.requirements.map(req=>`<li>${escapeHtml(req)}</li>`).join('') : '<li class="warn">No requirement linked</li>'}</ul></details>`).join('') || '<p class="muted">No test cases loaded.</p>';
    $('traceabilityTree').innerHTML=`<h3>Upstream Traceability: Test Cases → Requirements</h3>${tree}`;
    $('traceabilityTables').innerHTML=`<table><thead><tr><th>Test Case</th><th>Linked Requirements</th></tr></thead><tbody>${tcRows}</tbody></table>`;
  }
}
$('loadKpi').onclick=()=>safe(async()=>{ const d=await (await api('/api/kpi')).json(); $('kpiCards').innerHTML=Object.entries(d).filter(([k,v])=>typeof v!=='object').map(([k,v])=>`<div class="metric"><span>${escapeHtml(k.replaceAll('_',' '))}</span><b>${escapeHtml(v)}</b></div>`).join(''); $('kpiOutput').textContent=JSON.stringify(d,null,2); });

(async()=>{ await safe(loadDictionary); })();


// Builder dictionary step picker
function dictionaryCategories(){
  return [...new Set(state.dictionaryRows.map(r=>r.category||'General').filter(Boolean))].sort((a,b)=>a.localeCompare(b));
}
function stepIntent(row){
  const field=String(row?.field||'').toLowerCase();
  const entry=String(row?.entry||'').toLowerCase().trim();
  const text=`${field} ${entry}`;
  if(field.includes('expect') || /^(expect|verify|check|validate|confirm|ensure|ecu responds|response|delta)/.test(entry)) return 'expectation';
  if(field.includes('pre') || /^(precondition|start|connect|initialize|init|prepare|wake|set ignition|run security|diagnostic session)/.test(entry)) return 'precondition';
  if(field.includes('post') || /^(post|save|delete|clear|cleanup|clean up|disconnect|stop|reset|restore|close)/.test(entry)) return 'postcondition';
  if(field.includes('action') || /^(send|set|inject|toggle|ramp|measure|capture|calculate|wait|read|write|request|trigger|press|release)/.test(entry)) return 'action';
  return 'action';
}
function stepMatchesSpecsField(row, target){
  const intent=stepIntent(row);
  if(intent===target) return true;
  const entry=String(row?.entry||'').toLowerCase();
  if(target==='action') return /\b(send|set|inject|toggle|ramp|measure|capture|calculate|wait|read|write|request|trigger|press|release)\b/.test(entry);
  if(target==='expectation') return /\b(expect|verify|check|validate|confirm|ensure|responds|response|equals|active|less than|greater than|between)\b/.test(entry);
  if(target==='precondition') return /\b(start|connect|initialize|prepare|wake|session|security|precondition)\b/.test(entry);
  if(target==='postcondition') return /\b(save|delete|clear|cleanup|disconnect|stop|reset|restore|close)\b/.test(entry);
  return false;
}
function updateStepPickers(){
  if(!$('stepCategory') || !$('stepEntry')) return;
  const currentCat=$('stepCategory').value;
  const target=($('stepField')?.value||'action').toLowerCase();
  const cats=dictionaryCategories().filter(cat => state.dictionaryRows.some(r => (r.category||'General')===cat && stepMatchesSpecsField(r, target)));
  const fallbackCats=dictionaryCategories();
  const visibleCats=cats.length ? cats : fallbackCats;
  $('stepCategory').innerHTML=visibleCats.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  if(visibleCats.includes(currentCat)) $('stepCategory').value=currentCat;
  const cat=$('stepCategory').value || visibleCats[0] || '';
  const filtered=state.dictionaryRows
    .filter(r=>(r.category||'General')===cat)
    .filter(r=>stepMatchesSpecsField(r, target));
  const rows=(filtered.length ? filtered : state.dictionaryRows.filter(r=>(r.category||'General')===cat))
    .sort((a,b)=>String(a.entry||'').localeCompare(String(b.entry||'')));
  $('stepEntry').innerHTML=rows.map(r=>`<option value="${escapeHtml(r.row_id)}" data-field="${escapeHtml(r.field||'')}">${escapeHtml(r.field||'Step')} — ${escapeHtml(r.entry||'')}</option>`).join('');
  previewStepText();
}
function fieldToBuilderTarget(field){
  return stepIntent({field, entry:''});
}
function updateStepFieldFromEntry(){
  // User choice controls filtering; selecting an entry no longer overwrites the Specs Field.
}
function bracketParam(value){
  const v=String(value||'').trim();
  if(!v) return v;
  return /^\[.*\]$/.test(v) ? v : `[${v}]`;
}
function selectedStepText(){
  const row=state.dictionaryRows.find(r=>r.row_id===$('stepEntry').value);
  if(!row) throw new Error('Select an available dictionary step first.');
  let text=String(row.entry||'').trim();
  const params=($('stepParams').value||'').split('|').map(x=>x.trim()).filter(x=>x.length);
  params.forEach((value,idx)=>{ text=text.replaceAll(`[P${idx+1}]`, bracketParam(value)); });
  return text;
}
function previewStepText(){
  if(!$('stepPreview')) return;
  try{
    const targetId=stepFieldTextAreaId();
    const n=nextStepNumber($(targetId)?.value||'');
    $('stepPreview').value=prefixWithStepNumber(selectedStepText(), n);
  }catch{
    $('stepPreview').value='';
  }
}
function nextStepNumber(existingText){
  let max=0;
  String(existingText||'').split(/\r?\n/).forEach(line=>{
    const m=line.match(/^\s*(\d+)\s*[-.)]/);
    if(m) max=Math.max(max, parseInt(m[1],10));
  });
  return max+1;
}
function prefixWithStepNumber(text, n){
  const trimmed=String(text||'').trim();
  return /^\d+\s*[-.)]/.test(trimmed) ? trimmed.replace(/^\d+\s*[-.)]\s*/, `${n}- `) : `${n}- ${trimmed}`;
}
function appendToTextArea(id, text){
  const area=$(id);
  const current=area.value.trimEnd();
  const numbered=prefixWithStepNumber(text, nextStepNumber(current));
  area.value=current ? `${current}\n${numbered}` : numbered;
  area.focus();
}
function stepFieldTextAreaId(){
  return ({precondition:'bPrecondition', action:'bAction', expectation:'bExpectation', postcondition:'bPostcondition'})[$('stepField').value] || 'bAction';
}

// ---------------- Test Case Builder ----------------
function builderPayload(){
  return {
    tc_id:$('bTcId').value,
    requirement_id:$('bRequirement').value,
    title:$('bTitle').value,
    author:$('bAuthor').value,
    date:$('bDate').value,
    objective:$('bObjective').value,
    precondition:$('bPrecondition').value,
    action:$('bAction').value,
    expectation:$('bExpectation').value,
    actual_results:$('bActual').value,
    postcondition:$('bPostcondition').value,
    test_level:$('bTestLevel').value,
    system:$('bSystem').value,
    priority:$('bPriority').value,
    ecu:$('bEcu').value,
    status:$('bStatus').value,
    reviewer:$('bReviewer').value,
    platform:$('bPlatform').value,
    variant:$('bVariant').value,
    architecture:$('bArchitecture').value,
    constraints:$('bConstraints').value,
    test_platform:$('bTestPlatform').value,
    test_goal:$('bTestGoal').value
  };
}
function clearBuilder(){
  ['builderRowKey','bTcId','bRequirement','bTitle','bAuthor','bDate','bObjective','bPrecondition','bAction','bExpectation','bActual','bPostcondition','bTestLevel','bSystem','bPriority','bEcu','bReviewer','bPlatform','bVariant','bArchitecture','bConstraints','bTestPlatform','bTestGoal'].forEach(id=>$(id).value='');
  $('bStatus').value='Draft';
  document.querySelectorAll('#builderList .list-item').forEach(x=>x.classList.remove('selected'));
}
function loadBuilder(tc){
  $('builderRowKey').value=tc.row_key||'';
  const a=tc.attrs||{};
  $('bTcId').value=tc.tc_id||a['TC ID']||'';
  $('bRequirement').value=tc.requirements||a['Requirement ID']||'';
  $('bTitle').value=tc.title||a['TC title']||'';
  $('bAuthor').value=a['Author']||'';
  $('bDate').value=(a['Date']||'').slice(0,10);
  $('bObjective').value=a['Objective / Scope']||'';
  $('bPrecondition').value=a['Precondition']||a['Pre Action']||'';
  $('bAction').value=a['Action']||'';
  $('bExpectation').value=a['Expectation']||a['Expected Results']||'';
  $('bActual').value=a['Actual Results']||'';
  $('bPostcondition').value=a['Postcondition']||a['Post Action']||'';
  $('bTestLevel').value=a['Test Level']||'';
  $('bSystem').value=a['System']||'';
  $('bPriority').value=tc.priority||a['Priority']||'';
  $('bEcu').value=tc.ecu||a['ECU']||'';
  $('bStatus').value=tc.status||a['Test Specification Status']||'Draft';
  $('bReviewer').value=a['Reviewer']||'';
  $('bPlatform').value=a['Platform']||'';
  $('bVariant').value=a['Variant / Model']||'';
  $('bArchitecture').value=a['Architecture']||'';
  $('bConstraints').value=a['Test environment constraints']||'';
  $('bTestPlatform').value=a['Test Platform']||'';
  $('bTestGoal').value=a['Test Goal']||'';
  document.querySelectorAll('#builderList .list-item').forEach(x=>x.classList.toggle('selected', x.dataset.key===tc.row_key));
}
function renderBuilder(){
  if(!$('builderList')) return;
  const f=($('builderFilter').value||'').toLowerCase();
  const rows=state.testcases.filter(tc=>`${tc.tc_id||''} ${tc.title||''} ${tc.requirements||''}`.toLowerCase().includes(f));
  $('builderList').innerHTML = rows.map(tc=>`<button class="list-item" data-key="${escapeHtml(tc.row_key)}" onclick="selectBuilder('${escapeHtml(tc.row_key)}')"><b>${escapeHtml(tc.tc_id||tc.row_key)}</b><span>${escapeHtml(tc.title||'(no title)')}</span><small>${escapeHtml(tc.requirements||'')}</small></button>`).join('') || '<p class="muted">No test cases yet. Create one or load an Excel file.</p>';
}
window.selectBuilder=(key)=>{ const tc=state.testcases.find(x=>x.row_key===key); if(tc) loadBuilder(tc); };
$('newBuilder').onclick=clearBuilder;
$('builderFilter').oninput=renderBuilder;
if($('stepCategory')) $('stepCategory').onchange=updateStepPickers;
if($('stepEntry')) $('stepEntry').onchange=previewStepText;
if($('stepField')) $('stepField').onchange=updateStepPickers;
if($('stepParams')) $('stepParams').oninput=previewStepText;
$('addStepToBuilder').onclick=()=>safe(async()=>{ appendToTextArea(stepFieldTextAreaId(), selectedStepText()); previewStepText(); setStatus('Step added to test case builder.'); });
$('copyStepText').onclick=()=>safe(async()=>{ const text=$('stepPreview')?.value || selectedStepText(); await navigator.clipboard.writeText(text); setStatus('Step text copied.'); });
$('saveBuilder').onclick=()=>safe(async()=>{
  const payload=builderPayload();
  if(!payload.tc_id) throw new Error('TC ID is required.');
  if(!payload.title) throw new Error('Title is required.');
  const key=$('builderRowKey').value;
  const path=key?`/api/testcases/builder/${encodeURIComponent(key)}`:'/api/testcases/builder';
  const method=key?'PUT':'POST';
  const data=await (await api(path,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})).json();
  state.testcases=data.testcases;
  state.selectedKeys=new Set(state.testcases.filter(t=>t.valid).map(t=>t.row_key));
  renderSpecs(); renderBuilder(); renderGeneration(); loadBuilder(data.testcase);
  setStatus(key?'Test case updated.':'Test case added.');
});
$('cloneBuilder').onclick=()=>safe(async()=>{
  const key=$('builderRowKey').value;
  if(!key) throw new Error('Select a test case first.');
  const data=await (await api(`/api/testcases/builder/${encodeURIComponent(key)}/clone`,{method:'POST'})).json();
  state.testcases=data.testcases;
  state.selectedKeys=new Set(state.testcases.filter(t=>t.valid).map(t=>t.row_key));
  renderSpecs(); renderBuilder(); renderGeneration(); loadBuilder(data.testcase);
  setStatus(`Cloned test case as ${data.testcase.tc_id}.`);
});
$('deleteBuilder').onclick=()=>safe(async()=>{
  const key=$('builderRowKey').value;
  if(!key) throw new Error('Select a test case first.');
  if(!confirm('Delete selected test case?')) return;
  const data=await (await api(`/api/testcases/builder/${encodeURIComponent(key)}`,{method:'DELETE'})).json();
  state.testcases=data.testcases;
  state.selectedKeys.delete(key);
  clearBuilder(); renderSpecs(); renderBuilder(); renderGeneration(); setStatus('Test case deleted.');
});
$('clearBuilder').onclick=()=>safe(async()=>{
  if(!confirm('Clear all loaded and builder-created test cases in this session?')) return;
  const data=await (await api('/api/testcases/builder/clear',{method:'POST'})).json();
  state.testcases=data.testcases; state.selectedKeys.clear(); clearBuilder(); renderSpecs(); renderBuilder(); renderGeneration(); setStatus('All test cases cleared.');
});
$('exportSpecs').onclick=()=>safe(async()=>{ if(!state.testcases.length) throw new Error('No test cases to export.'); location.href='/api/testcases/export'; });

['bPrecondition','bAction','bExpectation','bPostcondition'].forEach(id=>{ if($(id)) $(id).addEventListener('input', previewStepText); });


// Wrap existing renderers so the Builder stays synchronized.
const __oldRenderSpecs = renderSpecs;
renderSpecs = function(){ __oldRenderSpecs(); renderBuilder(); };
const __oldRenderGeneration = renderGeneration;
renderGeneration = function(){ __oldRenderGeneration(); renderBuilder(); };
renderBuilder();
updateStepPickers();

previewStepText();

// ---------------- Multilingual Interface (v10) ----------------
const PT_I18N = {
  en: {
    app_title:'PrüfTurbo', app_subtitle:'Schnell. Präzise. Rückverfolgbar', language:'Language', save_session:'Save Session', reset_session:'Reset Session', help:'Help',
    tabs:{specs:'Test Specs',builder:'Test Case Builder',dictionary:'Dictionary',generation:'Generation',capl:'CAPL Viewer',traceability:'Traceability',kpi:'KPI',help:'Help'},
    titles:{specs:'Test Specifications',builder:'Test Case Builder',dictionary:'Dictionary Management',generation:'Generation',capl:'CAPL Viewer',traceability:'Traceability Matrix',kpi:'KPI Dashboard'},
    buttons:{loadSpecs:'Load Specs',expandSpecs:'Expand All',collapseSpecs:'Collapse All',newBuilder:'New',saveBuilder:'Add / Save Test Case',cloneBuilder:'Clone Test Case',deleteBuilder:'Delete Selected',clearBuilder:'Clear All Test Cases',exportSpecs:'Export Specs Excel',addStepToBuilder:'Add Step to Selected Field',copyStepText:'Copy Step Text',uploadDictionary:'Upload Dictionary',loadDictionary:'Reload',exportDictionary:'Export JSON',createDictionary:'Create Empty',addDictionary:'Add Entry',selectAll:'Select All',selectMatching:'Select Matching',deselectAll:'Deselect All',generateDirect:'Generate CAPL Directly',generateDictionary:'Generate From Dictionary',saveCapl:'Save',downloadCapl:'Download',traceDownstream:'Downstream: Requirement → Test Cases',traceUpstream:'Upstream: Test Case → Requirements',loadTraceability:'Refresh Traceability',exportTraceability:'Export Traceability to Excel',loadKpi:'Refresh KPI'},
    placeholders:{builderFilter:'Filter builder test cases...',stepParams:'Optional: value1 | value2 | value3',dictFilter:'Filter dictionary rows...',genFilter:'Filter TC ID/title, supports * ?',caplSearch:'Search CAPL'},
    helpHtml:`<h3>PrüfTurbo Professional Help</h3><p>PrüfTurbo converts Excel-based automotive test specifications into structured test cases, dictionary-mapped steps, CAPL output, traceability views, and KPI summaries.</p><details open><summary>1. Beginner workflow</summary><ol><li>Open <b>Test Specs</b> and load your Excel file.</li><li>Open <b>Dictionary</b> and load or edit the step dictionary.</li><li>Open <b>Generation</b>, select test cases, and generate CAPL.</li><li>Review code in <b>CAPL Viewer</b> and download it.</li><li>Use <b>Traceability</b> and <b>KPI</b> to check coverage.</li></ol></details><details><summary>2. Test Case Builder</summary><p>Create manual test cases, clone an existing one, and add dictionary steps. Select a category, available step, and target specs field. Parameters are inserted inside square brackets.</p></details><details><summary>3. Advanced traceability</summary><p>Downstream shows Requirement → Test Cases. Upstream shows Test Case → Requirements. Export the active view to Excel for reviews and audits.</p></details><details><summary>4. CAPL generation</summary><p>Direct generation creates template CAPL from test case contents. Dictionary generation maps known dictionary steps to CAPL translations when available.</p></details>`
  },
  de: {
    app_title:'PrüfTurbo', app_subtitle:'Schnell. Präzise. Rückverfolgbar', language:'Sprache', save_session:'Sitzung speichern', reset_session:'Sitzung zurücksetzen', help:'Hilfe',
    tabs:{specs:'Testspezifikation',builder:'Testfall-Builder',dictionary:'Wörterbuch',generation:'Generierung',capl:'CAPL-Viewer',traceability:'Rückverfolgbarkeit',kpi:'KPI',help:'Hilfe'},
    titles:{specs:'Testspezifikationen',builder:'Testfall-Builder',dictionary:'Wörterbuchverwaltung',generation:'Generierung',capl:'CAPL-Viewer',traceability:'Rückverfolgbarkeitsmatrix',kpi:'KPI-Dashboard'},
    buttons:{loadSpecs:'Spezifikation laden',expandSpecs:'Alles erweitern',collapseSpecs:'Alles reduzieren',newBuilder:'Neu',saveBuilder:'Testfall hinzufügen / speichern',cloneBuilder:'Testfall klonen',deleteBuilder:'Auswahl löschen',clearBuilder:'Alle Testfälle löschen',exportSpecs:'Spezifikation als Excel exportieren',addStepToBuilder:'Schritt zum ausgewählten Feld hinzufügen',copyStepText:'Schritttext kopieren',uploadDictionary:'Wörterbuch hochladen',loadDictionary:'Neu laden',exportDictionary:'JSON exportieren',createDictionary:'Leeres Wörterbuch erstellen',addDictionary:'Eintrag hinzufügen',selectAll:'Alle auswählen',selectMatching:'Treffer auswählen',deselectAll:'Alles abwählen',generateDirect:'CAPL direkt generieren',generateDictionary:'Aus Wörterbuch generieren',saveCapl:'Speichern',downloadCapl:'Herunterladen',traceDownstream:'Downstream: Anforderung → Testfälle',traceUpstream:'Upstream: Testfall → Anforderungen',loadTraceability:'Rückverfolgbarkeit aktualisieren',exportTraceability:'Rückverfolgbarkeit nach Excel exportieren',loadKpi:'KPI aktualisieren'},
    placeholders:{builderFilter:'Testfälle filtern...',stepParams:'Optional: Wert1 | Wert2 | Wert3',dictFilter:'Wörterbucheinträge filtern...',genFilter:'TC-ID/Titel filtern, unterstützt * ?',caplSearch:'CAPL durchsuchen'},
    helpHtml:`<h3>PrüfTurbo Professionelle Hilfe</h3><p>PrüfTurbo wandelt Excel-basierte automotive Testspezifikationen in strukturierte Testfälle, Wörterbuchschritte, CAPL-Ausgaben, Rückverfolgbarkeit und KPI-Auswertungen um.</p><details open><summary>1. Einstieg</summary><ol><li>Öffnen Sie <b>Testspezifikation</b> und laden Sie die Excel-Datei.</li><li>Öffnen Sie <b>Wörterbuch</b> und laden oder bearbeiten Sie die Schrittbibliothek.</li><li>Öffnen Sie <b>Generierung</b>, wählen Sie Testfälle und generieren Sie CAPL.</li><li>Prüfen Sie den Code im <b>CAPL-Viewer</b> und laden Sie ihn herunter.</li><li>Nutzen Sie <b>Rückverfolgbarkeit</b> und <b>KPI</b> für Coverage-Prüfungen.</li></ol></details><details><summary>2. Testfall-Builder</summary><p>Erstellen Sie manuelle Testfälle, klonen Sie vorhandene Testfälle und fügen Sie Wörterbuchschritte hinzu. Parameter werden automatisch in eckige Klammern gesetzt.</p></details><details><summary>3. Erweiterte Rückverfolgbarkeit</summary><p>Downstream zeigt Anforderung → Testfälle. Upstream zeigt Testfall → Anforderungen. Exportieren Sie die aktive Ansicht nach Excel.</p></details><details><summary>4. CAPL-Generierung</summary><p>Direkte Generierung erstellt CAPL aus den Testfallinhalten. Wörterbuchgenerierung nutzt vorhandene Übersetzungen.</p></details>`
  },
  fr: {
    app_title:'PrüfTurbo', app_subtitle:'Rapide. Précis. Traçable', language:'Langue', save_session:'Enregistrer la session', reset_session:'Réinitialiser la session', help:'Aide',
    tabs:{specs:'Spécifications',builder:'Constructeur de tests',dictionary:'Dictionnaire',generation:'Génération',capl:'Visionneuse CAPL',traceability:'Traçabilité',kpi:'KPI',help:'Aide'},
    titles:{specs:'Spécifications de test',builder:'Constructeur de cas de test',dictionary:'Gestion du dictionnaire',generation:'Génération',capl:'Visionneuse CAPL',traceability:'Matrice de traçabilité',kpi:'Tableau de bord KPI'},
    buttons:{loadSpecs:'Charger les spécifications',expandSpecs:'Tout développer',collapseSpecs:'Tout réduire',newBuilder:'Nouveau',saveBuilder:'Ajouter / Enregistrer le cas de test',cloneBuilder:'Cloner le cas de test',deleteBuilder:'Supprimer la sélection',clearBuilder:'Effacer tous les cas de test',exportSpecs:'Exporter les spécifications Excel',addStepToBuilder:'Ajouter l’étape au champ sélectionné',copyStepText:'Copier le texte de l’étape',uploadDictionary:'Téléverser le dictionnaire',loadDictionary:'Recharger',exportDictionary:'Exporter JSON',createDictionary:'Créer vide',addDictionary:'Ajouter une entrée',selectAll:'Tout sélectionner',selectMatching:'Sélectionner les correspondances',deselectAll:'Tout désélectionner',generateDirect:'Générer CAPL directement',generateDictionary:'Générer depuis le dictionnaire',saveCapl:'Enregistrer',downloadCapl:'Télécharger',traceDownstream:'Aval : Exigence → Cas de test',traceUpstream:'Amont : Cas de test → Exigences',loadTraceability:'Actualiser la traçabilité',exportTraceability:'Exporter la traçabilité vers Excel',loadKpi:'Actualiser KPI'},
    placeholders:{builderFilter:'Filtrer les cas de test...',stepParams:'Optionnel : valeur1 | valeur2 | valeur3',dictFilter:'Filtrer les lignes du dictionnaire...',genFilter:'Filtrer ID/titre, prend en charge * ?',caplSearch:'Rechercher dans CAPL'},
    helpHtml:`<h3>Aide professionnelle PrüfTurbo</h3><p>PrüfTurbo convertit les spécifications de test Excel en cas de test structurés, étapes de dictionnaire, sorties CAPL, traçabilité et KPI.</p><details open><summary>1. Flux débutant</summary><ol><li>Ouvrez <b>Spécifications</b> et chargez le fichier Excel.</li><li>Ouvrez <b>Dictionnaire</b> pour charger ou modifier les étapes.</li><li>Ouvrez <b>Génération</b>, sélectionnez les cas de test et générez CAPL.</li><li>Vérifiez le code dans la <b>Visionneuse CAPL</b> puis téléchargez-le.</li><li>Utilisez <b>Traçabilité</b> et <b>KPI</b> pour vérifier la couverture.</li></ol></details><details><summary>2. Constructeur de cas de test</summary><p>Créez, modifiez et clonez des cas de test. Ajoutez des étapes depuis le dictionnaire avec paramètres entre crochets.</p></details><details><summary>3. Traçabilité avancée</summary><p>La vue aval affiche Exigence → Cas de test. La vue amont affiche Cas de test → Exigences. Export Excel disponible.</p></details><details><summary>4. Génération CAPL</summary><p>La génération directe crée un modèle CAPL. La génération par dictionnaire utilise les traductions disponibles.</p></details>`
  },
  ar: {
    app_title:'PrüfTurbo', app_subtitle:'سريع. دقيق. قابل للتتبع', language:'اللغة', save_session:'حفظ الجلسة', reset_session:'إعادة ضبط الجلسة', help:'المساعدة',
    tabs:{specs:'مواصفات الاختبار',builder:'منشئ حالات الاختبار',dictionary:'القاموس',generation:'التوليد',capl:'عارض CAPL',traceability:'التتبعية',kpi:'مؤشرات الأداء',help:'المساعدة'},
    titles:{specs:'مواصفات الاختبار',builder:'منشئ حالات الاختبار',dictionary:'إدارة القاموس',generation:'التوليد',capl:'عارض CAPL',traceability:'مصفوفة التتبعية',kpi:'لوحة مؤشرات الأداء'},
    buttons:{loadSpecs:'تحميل المواصفات',expandSpecs:'توسيع الكل',collapseSpecs:'طي الكل',newBuilder:'جديد',saveBuilder:'إضافة / حفظ حالة اختبار',cloneBuilder:'استنساخ حالة الاختبار',deleteBuilder:'حذف المحدد',clearBuilder:'حذف كل حالات الاختبار',exportSpecs:'تصدير المواصفات إلى Excel',addStepToBuilder:'إضافة الخطوة إلى الحقل المحدد',copyStepText:'نسخ نص الخطوة',uploadDictionary:'رفع القاموس',loadDictionary:'إعادة تحميل',exportDictionary:'تصدير JSON',createDictionary:'إنشاء قاموس فارغ',addDictionary:'إضافة مدخل',selectAll:'تحديد الكل',selectMatching:'تحديد المطابق',deselectAll:'إلغاء تحديد الكل',generateDirect:'توليد CAPL مباشرة',generateDictionary:'توليد من القاموس',saveCapl:'حفظ',downloadCapl:'تنزيل',traceDownstream:'Downstream: المتطلب → حالات الاختبار',traceUpstream:'Upstream: حالة الاختبار → المتطلبات',loadTraceability:'تحديث التتبعية',exportTraceability:'تصدير التتبعية إلى Excel',loadKpi:'تحديث مؤشرات الأداء'},
    placeholders:{builderFilter:'تصفية حالات الاختبار...',stepParams:'اختياري: قيمة1 | قيمة2 | قيمة3',dictFilter:'تصفية صفوف القاموس...',genFilter:'تصفية ID/العنوان، يدعم * ?',caplSearch:'بحث في CAPL'},
    helpHtml:`<h3>دليل PrüfTurbo الاحترافي</h3><p>يقوم PrüfTurbo بتحويل مواصفات الاختبار المبنية على Excel إلى حالات اختبار منظمة، وخطوات من القاموس، ومخرجات CAPL، وتتبعية، ومؤشرات أداء.</p><details open><summary>1. سير العمل للمبتدئين</summary><ol><li>افتح <b>مواصفات الاختبار</b> وارفع ملف Excel.</li><li>افتح <b>القاموس</b> لتحميل أو تعديل خطوات الاختبار.</li><li>افتح <b>التوليد</b> وحدد حالات الاختبار ثم قم بتوليد CAPL.</li><li>راجع الكود في <b>عارض CAPL</b> ثم قم بتنزيله.</li><li>استخدم <b>التتبعية</b> و<b>مؤشرات الأداء</b> لفحص التغطية.</li></ol></details><details><summary>2. منشئ حالات الاختبار</summary><p>أنشئ وعدّل واستنسخ حالات الاختبار. يمكن إضافة خطوات من القاموس مع وضع القيم بين أقواس مربعة تلقائياً.</p></details><details><summary>3. التتبعية المتقدمة</summary><p>يعرض Downstream المتطلب → حالات الاختبار. ويعرض Upstream حالة الاختبار → المتطلبات. يمكن تصدير العرض الحالي إلى Excel.</p></details><details><summary>4. توليد CAPL</summary><p>التوليد المباشر ينشئ قالب CAPL. أما التوليد من القاموس فيستخدم الترجمات المتاحة.</p></details>`
  }
};

function applyLanguage(lang){
  const t = PT_I18N[lang] || PT_I18N.en;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.title = t.app_title;
  if($('languageSelect')) $('languageSelect').value = lang;
  document.querySelectorAll('[data-i18n]').forEach(el=>{ const k=el.dataset.i18n; if(t[k]) el.textContent=t[k]; });
  document.querySelectorAll('.tab').forEach(btn=>{ const key=btn.dataset.tab; if(t.tabs[key]) btn.textContent=t.tabs[key]; });
  Object.entries(t.titles).forEach(([id,val])=>{ const h=document.querySelector(`#${id} h2`); if(h) h.textContent=val; });
  Object.entries(t.buttons).forEach(([id,val])=>{ const el=$(id); if(el) el.textContent=val; });
  Object.entries(t.placeholders).forEach(([id,val])=>{ const el=$(id); if(el) el.placeholder=val; });
  if($('helpContent')) { $('helpContent').innerHTML = (window.buildKnowledgeCenter ? window.buildKnowledgeCenter(lang) : t.helpHtml); if(window.bindKnowledgeCenter) window.bindKnowledgeCenter(); }
  localStorage.setItem('pt_language', lang);
  setStatus(lang==='ar'?'تم تغيير اللغة.':lang==='de'?'Sprache geändert.':lang==='fr'?'Langue modifiée.':'Language changed.');
}

if($('languageSelect')){
  $('languageSelect').onchange = e => applyLanguage(e.target.value);
  applyLanguage(localStorage.getItem('pt_language') || 'en');
}
if($('saveSession')){
  $('saveSession').onclick = () => { location.href='/api/session/save'; };
}

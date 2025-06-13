console.log("Content script injected and running.");

let isEditModeEnabled = false;
let currentlyEditableElement = null;
let originalOutline = '';
let isSidebarOpen = false;
const SIDEBAR_ID = 'myExtensionSidebar';
const STATUS_MESSAGE_ID = 'sidebarStatusMessage';
const CLIPS_VIEW_ID = 'clipsView';
const EDITOR_VIEW_ID = 'editorView';
const MEDIA_BIN_AREA_ID = 'mediaBinArea';
const TIMELINE_AREA_ID = 'timelineArea';
const CLIPS_TAB_BUTTON_ID = 'clipsTabButton';
const EDITOR_TAB_BUTTON_ID = 'editorTabButton';
const AI_VIDEO_INTENT_ID = 'aiVideoIntent';
const SEND_TO_AI_BUTTON_ID = 'sendToAiButton';

const STORAGE_KEY_CLIPPED_MATERIALS = 'clippedMaterials';
const STORAGE_KEY_VIDEO_TIMELINE = 'videoEditorTimeline';

let currentTimelineItems = [];
let statusMessageTimeout = null;


// --- Status Message Function ---
function showSidebarStatus(message, isError = false, duration = 3000) {
  const statusElement = document.getElementById(STATUS_MESSAGE_ID);
  if (!statusElement) {
    console.warn("Status message element not found in sidebar.");
    // Fallback to alert if status element isn't there for some reason
    if (isError) console.error("Status (fallback alert):", message); else console.log("Status (fallback alert):", message);
    alert(message);
    return;
  }

  statusElement.textContent = message;
  statusElement.style.backgroundColor = isError ? '#f8d7da' : '#d4edda'; // Bootstrap error/success colors
  statusElement.style.color = isError ? '#721c24' : '#155724';
  statusElement.style.display = 'block';

  if (statusMessageTimeout) {
    clearTimeout(statusMessageTimeout);
  }

  if (duration > 0) { // Allow duration 0 to keep message until next one
    statusMessageTimeout = setTimeout(() => {
      statusElement.style.display = 'none';
    }, duration);
  }
}


// --- Edit Mode Functions ---
function enableEditMode() { document.body.style.cursor = 'cell'; document.body.addEventListener('mouseover', handleMouseOver); document.body.addEventListener('mouseout', handleMouseOut); document.body.addEventListener('click', handleClickToMakeEditable, true); console.log("Edit mode enabled."); }
function disableEditMode() { document.body.style.cursor = 'auto'; document.body.removeEventListener('mouseover', handleMouseOver); document.body.removeEventListener('mouseout', handleMouseOut); document.body.removeEventListener('click', handleClickToMakeEditable, true); if (currentlyEditableElement) { currentlyEditableElement.contentEditable = 'false'; currentlyEditableElement.style.border = ''; currentlyEditableElement.style.outline = ''; currentlyEditableElement = null; } document.querySelectorAll('[data-original-outline]').forEach(el => { el.style.outline = el.getAttribute('data-original-outline') || ''; el.removeAttribute('data-original-outline'); }); console.log("Edit mode disabled."); }
function handleMouseOver(event) { if (!isEditModeEnabled || event.target === currentlyEditableElement || event.target === document.body || event.target.id === SIDEBAR_ID || event.target.closest(`#${SIDEBAR_ID}`)) return; originalOutline = event.target.style.outline || ''; event.target.setAttribute('data-original-outline', originalOutline); event.target.style.outline = '2px dashed blue'; }
function handleMouseOut(event) { if (!isEditModeEnabled || event.target === currentlyEditableElement || event.target === document.body || event.target.id === SIDEBAR_ID || event.target.closest(`#${SIDEBAR_ID}`)) return; if (event.target.hasAttribute('data-original-outline')) { event.target.style.outline = event.target.getAttribute('data-original-outline'); event.target.removeAttribute('data-original-outline'); } else { event.target.style.outline = ''; } }
function handleClickToMakeEditable(event) { if (!isEditModeEnabled || event.target === document.body || event.target.id === SIDEBAR_ID || event.target.closest(`#${SIDEBAR_ID}`)) return; event.preventDefault(); event.stopPropagation(); if (currentlyEditableElement && currentlyEditableElement !== event.target) { currentlyEditableElement.contentEditable = 'false'; currentlyEditableElement.style.border = ''; if (currentlyEditableElement.hasAttribute('data-original-outline')) { currentlyEditableElement.style.outline = currentlyEditableElement.getAttribute('data-original-outline'); currentlyEditableElement.removeAttribute('data-original-outline'); } } currentlyEditableElement = event.target; currentlyEditableElement.contentEditable = 'true'; currentlyEditableElement.style.border = '2px solid green'; currentlyEditableElement.style.outline = ''; if (currentlyEditableElement.hasAttribute('data-original-outline')) { currentlyEditableElement.removeAttribute('data-original-outline'); } console.log("Element made editable:", currentlyEditableElement); }

// --- AI Payload Preparation ---
function prepareAiPayload(timelineItems, intent) { /* ... (unchanged) ... */ const scenes = timelineItems.map(item => { if (item.type === 'text') { return { type: "text", content: item.content, duration: item.duration }; } else if (item.type === 'image') { const imageName = item.src.substring(item.src.lastIndexOf('/') + 1); return { type: "image", content: `![${imageName}](${item.src})`, duration: item.duration }; } return null; }).filter(item => item !== null); return { videoIntent: intent || "No specific intent provided.", scenes: scenes }; }
async function handleSendToAi() {
  if (document.getElementById(EDITOR_TAB_BUTTON_ID)?.classList.contains('active') && currentTimelineItems.length === 0) {
    await loadTimeline();
  }
  if (currentTimelineItems.length === 0) {
    showSidebarStatus("Timeline is empty. Add some clips!", true);
    return;
  }
  const intentInput = document.getElementById(AI_VIDEO_INTENT_ID);
  const videoIntent = intentInput ? intentInput.value.trim() : "";
  const payload = prepareAiPayload(currentTimelineItems, videoIntent);
  console.log("AI Video Generation Payload:", JSON.stringify(payload, null, 2));
  showSidebarStatus("AI payload logged to console.", false);
}

// --- Sidebar Structure and Tabs ---
function createSidebar() {
  let sidebar = document.getElementById(SIDEBAR_ID);
  if (sidebar) {
    setActiveTab(CLIPS_TAB_BUTTON_ID);
    return sidebar;
  }
  sidebar = document.createElement('div');
  sidebar.id = SIDEBAR_ID;
  sidebar.style.cssText = `position:fixed; top:0; right:0; width:400px; height:100%; background-color:#f8f9fa; border-left:1px solid #ced4da; z-index:2147483647; overflow:hidden; box-sizing:border-box; transition:transform 0.3s ease-in-out; transform:translateX(100%); font-family:Arial,sans-serif; font-size:14px; color:#333; display:flex; flex-direction:column;`;

  const styleTag = document.createElement('style');
  styleTag.textContent = `
    #${SIDEBAR_ID} .sidebar-header { padding:10px 15px; border-bottom:1px solid #dee2e6; background-color:#e9ecef; display:flex; justify-content:space-between; align-items:center; }
    #${SIDEBAR_ID} .sidebar-header h3 { margin:0; color:#007bff; font-size:16px; }
    #${SIDEBAR_ID} button.internal-btn, #${SIDEBAR_ID} #${SEND_TO_AI_BUTTON_ID} { background-color:#6c757d; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:12px; margin-left: 5px; }
    #${SIDEBAR_ID} button.internal-btn:hover, #${SIDEBAR_ID} #${SEND_TO_AI_BUTTON_ID}:hover { background-color:#5a6268; }
    #${SIDEBAR_ID} #${SEND_TO_AI_BUTTON_ID} { background-color: #28a745; }
    #${SIDEBAR_ID} #${SEND_TO_AI_BUTTON_ID}:hover { background-color: #218838; }
    #${SIDEBAR_ID} .sidebar-tabs { display:flex; border-bottom:1px solid #dee2e6; background-color:#f1f3f5; }
    #${SIDEBAR_ID} .tab-button { flex-grow:1; padding:10px; background-color:transparent; border:none; border-right:1px solid #dee2e6; cursor:pointer; font-size:14px; }
    #${SIDEBAR_ID} .tab-button:last-child { border-right:none; }
    #${SIDEBAR_ID} .tab-button.active { background-color:#fff; color:#007bff; border-bottom:2px solid #007bff; font-weight:bold; }
    #${SIDEBAR_ID} #${STATUS_MESSAGE_ID} { display:none; padding: 8px; margin: 0 0 10px 0; text-align:center; font-size: 13px; border-radius: 4px; }
    #${SIDEBAR_ID} .sidebar-view-container { flex-grow:1; overflow-y:auto; padding: 0 15px 15px 15px; } /* Padding adjusted for status message */
    #${SIDEBAR_ID} .clip-item { position:relative; background-color:#fff; border:1px solid #dee2e6; border-radius:4px; padding:10px; margin-bottom:10px; box-shadow:0 1px 2px rgba(0,0,0,0.05); }
    #${SIDEBAR_ID} .clip-item p { white-space:pre-wrap; word-wrap:break-word; margin:0; }
    #${SIDEBAR_ID} .clip-item img { max-width:100%; height:auto; border-radius:3px; margin-top:5px; }
    #${SIDEBAR_ID} button.delete-clip-btn { background-color:#dc3545; position:absolute; top:5px; right:5px; padding:2px 5px; font-size:10px; color:white; border:none; border-radius:3px; cursor:pointer; }
    #${EDITOR_VIEW_ID} { display:flex; flex-direction:column; height:100%; }
    #${MEDIA_BIN_AREA_ID} { border:1px solid #ccc; padding:10px; margin-bottom:10px; background-color:#f9f9f9; min-height:150px; max-height:35%; overflow-y:auto; }
    #${MEDIA_BIN_AREA_ID} h4, #${TIMELINE_AREA_ID} h4 { margin-top:0; margin-bottom:10px; color:#495057; display: flex; justify-content: space-between; align-items: center;}
    #${MEDIA_BIN_AREA_ID} .media-item { padding:5px; margin:5px; background-color:#e9ecef; border:1px solid #ced4da; border-radius:3px; cursor:grab; display:flex; align-items:center; font-size:12px; }
    #${MEDIA_BIN_AREA_ID} .media-item img { max-width:60px; max-height:40px; object-fit:cover; margin-right:8px; }
    #${TIMELINE_AREA_ID} { border:1px solid #ccc; padding:10px; background-color:#fdfdfd; flex-grow:1; overflow-y:auto; }
    #${TIMELINE_AREA_ID} .timeline-clip { display:flex; align-items:center; justify-content:space-between; padding:8px; margin:5px 0; background-color:#e0e0e0; border:1px solid #c5c5c5; border-radius:4px; cursor:grab; font-size:13px; }
    #${TIMELINE_AREA_ID} .timeline-clip img { max-width:50px; max-height:30px; object-fit:cover; margin-right:8px; }
    #${TIMELINE_AREA_ID} .timeline-clip .clip-info { flex-grow:1; }
    #${TIMELINE_AREA_ID} .timeline-clip .duration-input { width:50px; margin-left:10px; padding:3px; font-size:12px; border:1px solid #ccc; border-radius:3px; }
    #${TIMELINE_AREA_ID} .drop-indicator { height:2px; background-color:blue; margin:2px 0; }
    #${EDITOR_VIEW_ID} .ai-controls { padding:10px; border-top:1px solid #dee2e6; margin-top:10px; background-color:#f9f9f9;}
    #${EDITOR_VIEW_ID} .ai-controls input[type="text"] { width: calc(100% - 16px); padding: 8px; margin-bottom: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;}
    #${EDITOR_VIEW_ID} .ai-controls button { width: 100%; padding: 10px; font-size: 14px;}
  `;
  sidebar.appendChild(styleTag);

  sidebar.innerHTML += `
    <div class="sidebar-header"><h3>Web Clipper</h3><button id="closeSidebarBtnInternal" class="internal-btn">Close</button></div>
    <div class="sidebar-tabs">
      <button id="${CLIPS_TAB_BUTTON_ID}" class="tab-button">Clips</button>
      <button id="${EDITOR_TAB_BUTTON_ID}" class="tab-button">Editor</button>
    </div>
    <div id="${STATUS_MESSAGE_ID}"></div> <!-- Status message area -->
    <div class="sidebar-view-container">
      <div id="${CLIPS_VIEW_ID}" style="display:none;"></div>
      <div id="${EDITOR_VIEW_ID}" style="display:none;">
        <div id="${MEDIA_BIN_AREA_ID}"><h4>Media Bin</h4></div>
        <div id="${TIMELINE_AREA_ID}">
          <h4>Timeline <button id="saveTimelineBtn" class="internal-btn" style="font-size:10px; padding:3px 6px;">Save</button></h4>
        </div>
        <div class="ai-controls">
          <input type="text" id="${AI_VIDEO_INTENT_ID}" placeholder="Optional: Video theme or style">
          <button id="${SEND_TO_AI_BUTTON_ID}">Generate Video with AI</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(sidebar);

  sidebar.querySelector(`#${CLIPS_TAB_BUTTON_ID}`).addEventListener('click', () => setActiveTab(CLIPS_TAB_BUTTON_ID));
  sidebar.querySelector(`#${EDITOR_TAB_BUTTON_ID}`).addEventListener('click', () => setActiveTab(EDITOR_TAB_BUTTON_ID));
  sidebar.querySelector('#closeSidebarBtnInternal').addEventListener('click', () => toggleSidebarVisibility(sidebar, false));

  const timelineArea = sidebar.querySelector(`#${TIMELINE_AREA_ID}`);
  if(timelineArea) { // Check if editor view elements are there (might not be if sidebar is never opened to editor)
    timelineArea.addEventListener('dragover', handleTimelineDragOver);
    timelineArea.addEventListener('drop', handleDropOnTimelineContainer);
    timelineArea.addEventListener('change', handleDurationChange);
  }

  setActiveTab(CLIPS_TAB_BUTTON_ID);
  return sidebar;
}

function setActiveTab(activeTabId) { /* ... (unchanged, but ensure save/AI buttons listeners are attached correctly) ... */
  const clipsView = document.getElementById(CLIPS_VIEW_ID);
  const editorView = document.getElementById(EDITOR_VIEW_ID);
  const clipsTabBtn = document.getElementById(CLIPS_TAB_BUTTON_ID);
  const editorTabBtn = document.getElementById(EDITOR_TAB_BUTTON_ID);

  if (!clipsView || !editorView || !clipsTabBtn || !editorTabBtn) return;

  clipsView.style.display = (activeTabId === CLIPS_TAB_BUTTON_ID) ? 'block' : 'none';
  editorView.style.display = (activeTabId === EDITOR_TAB_BUTTON_ID) ? 'flex' : 'none';
  clipsTabBtn.classList.toggle('active', activeTabId === CLIPS_TAB_BUTTON_ID);
  editorTabBtn.classList.toggle('active', activeTabId === EDITOR_TAB_BUTTON_ID);

  if (activeTabId === CLIPS_TAB_BUTTON_ID) {
    renderClipsInSidebar();
  } else if (activeTabId === EDITOR_TAB_BUTTON_ID) {
    const saveBtn = document.getElementById('saveTimelineBtn');
    if(saveBtn && !saveBtn.dataset.listenerAttached) { saveBtn.addEventListener('click', saveTimeline); saveBtn.dataset.listenerAttached = 'true'; }
    const aiBtn = document.getElementById(SEND_TO_AI_BUTTON_ID);
    if(aiBtn && !aiBtn.dataset.listenerAttached) { aiBtn.addEventListener('click', handleSendToAi); aiBtn.dataset.listenerAttached = 'true'; }
    renderMediaBin();
    loadTimeline();
  }
}

// --- Timeline Data Management ---
async function saveTimeline() {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY_VIDEO_TIMELINE]: currentTimelineItems });
    console.log("Timeline saved:", currentTimelineItems);
    showSidebarStatus("Timeline saved successfully!", false);
  } catch (error) {
    console.error("Error saving timeline:", error);
    showSidebarStatus("Error saving timeline.", true);
  }
}
async function loadTimeline() {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEY_VIDEO_TIMELINE]);
    if(chrome.runtime.lastError) throw chrome.runtime.lastError;
    currentTimelineItems = result[STORAGE_KEY_VIDEO_TIMELINE] || [];
    console.log("Timeline loaded:", currentTimelineItems);
  } catch (error) {
    console.error("Error loading timeline:", error);
    showSidebarStatus("Error loading timeline.", true);
    currentTimelineItems = [];
  }
  renderTimeline(); // Always render, even if empty or errored
}

// --- Rendering Functions ---
async function renderClipsInSidebar() {
    const displayArea = document.getElementById(CLIPS_VIEW_ID);
    if (!displayArea) { if(document.getElementById(SIDEBAR_ID)) setTimeout(renderClipsInSidebar, 100); return; }
    displayArea.innerHTML = '';
    try {
        const result = await chrome.storage.local.get([STORAGE_KEY_CLIPPED_MATERIALS]);
        if(chrome.runtime.lastError) throw chrome.runtime.lastError;
        const clips = result[STORAGE_KEY_CLIPPED_MATERIALS] || [];
        if (clips.length === 0) { displayArea.innerHTML = '<p>No clips yet. Select text or right-click an image to clip.</p>'; return; }
        clips.forEach((clip, index) => { /* ... (unchanged) ... */ const el = document.createElement('div'); el.className = 'clip-item'; el.setAttribute('data-clip-index', index); if (clip.type === 'text') el.innerHTML = `<p>${clip.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`; else if (clip.type === 'image') el.innerHTML = `<img src="${clip.src}" alt="Clipped Image">`; const delBtn = document.createElement('button'); delBtn.className='delete-clip-btn'; delBtn.textContent='X'; delBtn.title='Delete'; delBtn.onclick=handleDeleteClip; el.appendChild(delBtn); displayArea.appendChild(el); });
    } catch(e){ console.error("Error rendering clips:",e); showSidebarStatus("Error loading clips.", true); displayArea.innerHTML='<p>Error loading clips.</p>';}
}
async function renderMediaBin() {
    const area = document.getElementById(MEDIA_BIN_AREA_ID);
    if (!area) { if(document.getElementById(EDITOR_VIEW_ID)) setTimeout(renderMediaBin, 100); return; }
    const h4 = area.querySelector('h4'); area.innerHTML = ''; if(h4) area.appendChild(h4);
    try {
        const result = await chrome.storage.local.get([STORAGE_KEY_CLIPPED_MATERIALS]);
        if(chrome.runtime.lastError) throw chrome.runtime.lastError;
        const clips = result[STORAGE_KEY_CLIPPED_MATERIALS] || [];
        if (clips.length === 0) { area.insertAdjacentHTML('beforeend', '<p>Media bin empty. Add clips from the "Clips" tab or by clipping new content.</p>'); return; }
        clips.forEach(clip => { /* ... (unchanged) ... */ const item = document.createElement('div'); item.className = 'media-item'; item.draggable = true; const clipInfo = { ...clip, id: clip.timestamp || `clip-${Date.now()}-${Math.random()}` }; item.setAttribute('data-clip-info', JSON.stringify(clipInfo)); if (clip.type === 'text') item.textContent = clip.content.substring(0,20) + '...'; else if (clip.type === 'image') item.innerHTML = `<img src="${clip.src}" alt="Media"> ${clip.src.substring(clip.src.lastIndexOf('/')+1).substring(0,15)}...`; item.ondragstart = (e) => { e.dataTransfer.setData('application/json', JSON.stringify({ clipData: clipInfo, source: 'mediaBin' })); e.dataTransfer.effectAllowed = 'copy'; }; area.appendChild(item); });
    } catch(e){ console.error("Error rendering media bin:",e); showSidebarStatus("Error loading media bin.", true); area.insertAdjacentHTML('beforeend','<p>Error loading media.</p>');}
}
function renderTimeline() { /* ... (unchanged, ensure header is preserved) ... */   const timelineArea = document.getElementById(TIMELINE_AREA_ID); const header = timelineArea.querySelector('h4'); timelineArea.innerHTML = ''; if (header) timelineArea.appendChild(header); if (currentTimelineItems.length === 0) { timelineArea.insertAdjacentHTML('beforeend', '<p>Timeline is empty. Drag items from Media Bin.</p>'); } currentTimelineItems.forEach((item, index) => { const el = document.createElement('div'); el.className = 'timeline-clip'; el.draggable = true; el.setAttribute('data-timeline-item-id', item.timelineItemId); el.setAttribute('data-index', index); let contentPreview = ''; if (item.type === 'text') contentPreview = `<span>Text: ${item.content.substring(0, 15)}...</span>`; else if (item.type === 'image') contentPreview = `<img src="${item.src}" alt="Timeline item">`; el.innerHTML = `<span class="clip-info">${contentPreview}</span><input type="number" class="duration-input" value="${item.duration}" data-timeline-item-id="${item.timelineItemId}" min="1" step="0.1"> s`; el.addEventListener('dragstart', handleTimelineItemDragStart); el.addEventListener('dragover', handleTimelineDragOver); el.addEventListener('drop', handleDropOnTimelineItem); timelineArea.appendChild(el); }); }

// --- Drag and Drop Handlers ---
function handleMediaDragStart(event) { /* ... (unchanged) ... */ const clipInfoString = event.target.getAttribute('data-clip-info'); const parsedClipInfo = JSON.parse(clipInfoString); event.dataTransfer.setData('application/json', JSON.stringify({ clipData: parsedClipInfo, source: 'mediaBin' })); event.dataTransfer.effectAllowed = 'copy';}
function handleTimelineItemDragStart(event) { /* ... (unchanged) ... */ event.stopPropagation(); const timelineItemId = event.target.getAttribute('data-timeline-item-id'); const originalIndex = parseInt(event.target.getAttribute('data-index'), 10); event.dataTransfer.setData('application/json', JSON.stringify({ timelineItemId, originalIndex, source: 'timeline' })); event.dataTransfer.effectAllowed = 'move';}
let dropIndicator = null;
function ensureDropIndicator() { if (!dropIndicator) { dropIndicator = document.createElement('div'); dropIndicator.className = 'drop-indicator'; } return dropIndicator; }
function handleTimelineDragOver(event) { /* ... (unchanged) ... */ event.preventDefault(); event.dataTransfer.dropEffect = 'move'; const timelineArea = document.getElementById(TIMELINE_AREA_ID); const indicator = ensureDropIndicator(); const targetElement = event.target.closest('.timeline-clip'); if (targetElement) { const rect = targetElement.getBoundingClientRect(); const isAfter = event.clientY > rect.top + rect.height / 2; if (isAfter) targetElement.parentNode.insertBefore(indicator, targetElement.nextSibling); else targetElement.parentNode.insertBefore(indicator, targetElement); } else { const headerH4 = timelineArea.querySelector('h4'); if (headerH4 && headerH4.nextSibling) timelineArea.insertBefore(indicator, headerH4.nextSibling); else timelineArea.appendChild(indicator);}}
function handleDropOnTimelineContainer(event) { /* ... (unchanged) ... */ event.preventDefault(); const indicator = ensureDropIndicator(); if(indicator.parentNode) indicator.parentNode.removeChild(indicator); const dataString = event.dataTransfer.getData('application/json'); if (!dataString) return; const draggedData = JSON.parse(dataString); if (draggedData.source === 'mediaBin') { const clip = draggedData.clipData; const newItem = { ...clip, duration: clip.type === 'image' ? 3 : 5, timelineItemId: `${clip.id}_${Date.now()}` }; currentTimelineItems.push(newItem); } else if (draggedData.source === 'timeline') { const itemToMove = currentTimelineItems.splice(draggedData.originalIndex, 1)[0]; if(itemToMove) currentTimelineItems.push(itemToMove); } saveTimeline().then(renderTimeline); }
function handleDropOnTimelineItem(event) { /* ... (unchanged) ... */ event.preventDefault(); event.stopPropagation(); const indicator = ensureDropIndicator(); if(indicator.parentNode) indicator.parentNode.removeChild(indicator); const dataString = event.dataTransfer.getData('application/json'); if (!dataString) return; const draggedData = JSON.parse(dataString); const targetElement = event.target.closest('.timeline-clip'); const targetIndex = targetElement ? parseInt(targetElement.getAttribute('data-index'), 10) : currentTimelineItems.length -1; if (draggedData.source === 'mediaBin') { const clip = draggedData.clipData; const newItem = { ...clip, duration: clip.type === 'image' ? 3 : 5, timelineItemId: `${clip.id}_${Date.now()}`}; currentTimelineItems.splice(targetIndex, 0, newItem); } else if (draggedData.source === 'timeline') { if (draggedData.originalIndex === targetIndex) return; const itemToMove = currentTimelineItems.splice(draggedData.originalIndex, 1)[0]; if(itemToMove) currentTimelineItems.splice(targetIndex, 0, itemToMove); } saveTimeline().then(renderTimeline); }

// --- Duration Change & Clip Deletion ---
function handleDurationChange(event) { /* ... (unchanged) ... */ if (event.target.classList.contains('duration-input')) { const timelineItemId = event.target.getAttribute('data-timeline-item-id'); const newDuration = parseFloat(event.target.value); const item = currentTimelineItems.find(i => i.timelineItemId === timelineItemId); if (item && !isNaN(newDuration) && newDuration > 0) { item.duration = newDuration; saveTimeline().then(renderTimeline); } else if (item) { event.target.value = item.duration; }}}
async function handleDeleteClip(event) {
    const clipElement = event.target.closest('.clip-item');
    const indexToDelete = parseInt(clipElement.getAttribute('data-clip-index'), 10);
    try {
        const result = await chrome.storage.local.get([STORAGE_KEY_CLIPPED_MATERIALS]);
        if(chrome.runtime.lastError) throw chrome.runtime.lastError;
        let clips = result[STORAGE_KEY_CLIPPED_MATERIALS] || [];
        if (indexToDelete >= 0 && indexToDelete < clips.length) {
            clips.splice(indexToDelete, 1);
            await chrome.storage.local.set({[STORAGE_KEY_CLIPPED_MATERIALS]: clips});
            if(chrome.runtime.lastError) throw chrome.runtime.lastError;
            showSidebarStatus("Clip deleted.", false, 2000);
            renderClipsInSidebar();
            if (document.getElementById(EDITOR_TAB_BUTTON_ID)?.classList.contains('active')) {
                renderMediaBin();
            }
        }
    } catch (e) { console.error("Error deleting clip:", e); showSidebarStatus("Error deleting clip.", true); }
}

// --- Sidebar Visibility & Message Listener ---
function toggleSidebarVisibility(sidebarElement, forceState) { /* ... (unchanged) ... */ if (!sidebarElement) return; const shouldBeOpen = typeof forceState === 'boolean' ? forceState : !isSidebarOpen; if (shouldBeOpen) { sidebarElement.style.transform = 'translateX(0)'; isSidebarOpen = true; setActiveTab(document.getElementById(CLIPS_TAB_BUTTON_ID).classList.contains('active') ? CLIPS_TAB_BUTTON_ID : EDITOR_TAB_BUTTON_ID); console.log("Sidebar opened."); } else { sidebarElement.style.transform = 'translateX(100%)'; isSidebarOpen = false; console.log("Sidebar closed."); }}
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "toggleEdit") { isEditModeEnabled = !isEditModeEnabled; if (isEditModeEnabled) enableEditMode(); else disableEditMode(); sendResponse({status: `Edit mode ${isEditModeEnabled ? 'enabled' : 'disabled'}.`}); return true; }
  if (request.action === "toggleSidebar") { const sidebar = document.getElementById(SIDEBAR_ID) || createSidebar(); toggleSidebarVisibility(sidebar); sendResponse({status: `Sidebar ${isSidebarOpen ? 'opened' : 'closed'}.`}); return true; }
  if (request.action === "clipSelection" || request.action === "clipImage") {
    const isTextClip = request.action === "clipSelection";
    const contentToClip = isTextClip ? window.getSelection().toString().trim() : request.imageUrl;
    if (!contentToClip) {
      showSidebarStatus(isTextClip ? "No text selected to clip." : "No image URL provided.", true);
      sendResponse({status: `No ${isTextClip ? 'text selected' : 'image URL'}`});
      return true;
    }
    const newClip = { type: isTextClip ? 'text' : 'image', [isTextClip ? 'content' : 'src']: contentToClip, timestamp: new Date().toISOString() };
    chrome.storage.local.get([STORAGE_KEY_CLIPPED_MATERIALS], function(result) {
      if (chrome.runtime.lastError) { console.error("Error getting clips for saving:", chrome.runtime.lastError); showSidebarStatus("Error preparing to save clip.", true); sendResponse({status:"Error storage get"}); return;}
      const clips = result[STORAGE_KEY_CLIPPED_MATERIALS] || []; clips.push(newClip);
      chrome.storage.local.set({[STORAGE_KEY_CLIPPED_MATERIALS]: clips}, function() {
        if (chrome.runtime.lastError) { console.error("Error saving clip:", chrome.runtime.lastError); showSidebarStatus("Error saving clip.", true); sendResponse({status: "Error saving clip"});
        } else {
          console.log("Clip saved:", newClip); showSidebarStatus(isTextClip ? "Text clipped!" : "Image clipped!", false);
          if (isSidebarOpen) { if (document.getElementById(CLIPS_TAB_BUTTON_ID)?.classList.contains('active')) renderClipsInSidebar(); if (document.getElementById(EDITOR_TAB_BUTTON_ID)?.classList.contains('active')) renderMediaBin(); }
          sendResponse({status: "Clip saved successfully"});
        }
      });
    });
    return true;
  }
  return false;
});

// Initialize sidebar
createSidebar();

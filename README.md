# Web Clipper Pro Chrome Extension

A browser extension to clip web content (text and images), organize these materials, and sequence them in a simple timeline editor for conceptual video creation. Includes a stub for AI video generation.

## Features

*   **Content Clipping**:
    *   Clip selected text from any webpage via a popup button.
    *   Clip images using a right-click context menu item.
*   **Sidebar Interface**:
    *   Toggleable sidebar integrated into web pages.
    *   **Clips Tab**: View all clipped text and images. Delete unwanted clips.
    *   **Editor Tab**:
        *   **Media Bin**: Displays all clipped materials, making them draggable.
        *   **Timeline**: Drag clips from the Media Bin to the timeline to create a sequence.
        *   **Duration Control**: Adjust the display duration for each item in the timeline.
        *   **Reordering**: Drag and drop items within the timeline to change their order.
        *   **Save/Load Timeline**: Persists the timeline sequence locally.
        *   **AI Video Generation Stub**: Prepare a payload (video intent and scene descriptions) and log it to the console, simulating a call to an AI video generation service.
*   **Page Editing Mode**:
    *   Toggle a mode to make elements on the current webpage directly editable (experimental).

## How to Use

1.  **Installation (Development)**:
    *   Clone this repository or download the ZIP and extract it.
    *   Open Chrome and navigate to `chrome://extensions`.
    *   Enable "Developer mode" (usually a toggle in the top right).
    *   Click "Load unpacked".
    *   Select the directory containing the extension's files (where `manifest.json` is located).

2.  **Opening the Extension**:
    *   Click on the Web Clipper Pro extension icon in your Chrome toolbar. This opens a small popup.

3.  **Using the Popup**:
    *   **Toggle Edit Mode**: Click this to make the content of the current page directly editable. Click again to disable.
    *   **Toggle Sidebar**: Click this to open or close the main sidebar on the right side of the current page.
    *   **Clip Selected Text**: First, select some text on the webpage. Then, click this button in the popup to save the selected text.

4.  **Clipping Images**:
    *   Right-click on any image on a webpage.
    *   Select "Clip Image" from the context menu that appears.

5.  **Using the Sidebar**:
    *   **"Clips" Tab**:
        *   View all your saved text and image clips.
        *   Click the "X" button on a clip to delete it.
    *   **"Editor" Tab**:
        *   **Media Bin**: Your saved clips appear here. Drag any item from the Media Bin.
        *   **Timeline**:
            *   Drop items from the Media Bin onto the timeline area to add them to your sequence.
            *   **Reorder**: Drag items already in the timeline to a new position. A blue line will indicate the drop position.
            *   **Duration**: Change the number in the "s" (seconds) input field next to each timeline item to set its duration.
            *   **Save Timeline**: Click the "Save" button (next to the "Timeline" heading) to save the current sequence and durations. The timeline is also loaded automatically when you switch to the Editor tab.
        *   **AI Video Generation**:
            *   Optionally, type a theme or intent for your video in the "Video theme or style" input field.
            *   Click "Generate Video with AI". This will not actually create a video but will log a structured JSON payload to your browser's developer console (F12 or Ctrl+Shift+I, then go to the "Console" tab). This payload represents what would be sent to an AI video generation service.

## Files Overview

*   `manifest.json`: Defines the extension's structure, permissions, and capabilities.
*   `background.js`: Handles background tasks, primarily the image clipping context menu.
*   `content.js`: The core script injected into web pages. Manages the sidebar, all its UI/UX, clipping logic, editing features, and AI payload preparation.
*   `popup.html`: The HTML for the browser action popup.
*   `popup.js`: JavaScript for the popup buttons (toggling edit mode, sidebar, and clipping selected text).
*   `popup.css`: Basic styling for the popup.
*   `README.md`: This file.

## Future Development Ideas
*   Actual integration with an AI video generation API.
*   More sophisticated timeline features (transitions, audio tracks).
*   Direct editing of text clips within the sidebar.
*   Export/import of clipped materials and timelines.
*   User accounts and cloud sync.

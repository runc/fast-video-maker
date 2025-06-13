console.log("Background service worker started.");

// Create context menu for images on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "clipImageContextMenu",
    title: "Clip Image",
    contexts: ["image"]
  }, () => {
    if (chrome.runtime.lastError) {
      console.error("Error creating context menu:", chrome.runtime.lastError.message);
    } else {
      console.log("Image context menu created successfully.");
    }
  });
});

// Listener for context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "clipImageContextMenu" && tab) {
    if (info.srcUrl) {
      chrome.tabs.sendMessage(tab.id, {
        action: "clipImage",
        imageUrl: info.srcUrl
      }, response => {
        if (chrome.runtime.lastError) {
          console.error("Error sending clipImage message:", chrome.runtime.lastError.message);
        } else {
          console.log("clipImage message sent, response:", response);
        }
      });
    } else {
      console.error("No srcUrl found for the clicked image.");
    }
  }
});

// Optional: Listener for browser action (uncomment if needed later)
// chrome.action.onClicked.addListener((tab) => {
//   console.log("Browser action clicked on tab:", tab.id);
//   // You can inject a script or send a message to the content script here
// });

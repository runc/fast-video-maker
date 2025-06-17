console.log("Popup script loaded.");

document.addEventListener('DOMContentLoaded', function() {
  // Localize button texts
  const toggleEditModeButton = document.getElementById('toggleEditModeButton');
  if (toggleEditModeButton) {
    toggleEditModeButton.textContent = chrome.i18n.getMessage('toggleEditModeButtonText');
  }

  const toggleSidebarButton = document.getElementById('toggleSidebarButton');
  if (toggleSidebarButton) {
    toggleSidebarButton.textContent = chrome.i18n.getMessage('toggleSidebarButtonText');
  }

  const clipSelectionButton = document.getElementById('clipSelectionButton');
  if (clipSelectionButton) {
    clipSelectionButton.textContent = chrome.i18n.getMessage('clipSelectionButtonText');
  }

  // Event Listeners
  if (toggleEditModeButton) {
    toggleEditModeButton.addEventListener('click', function() {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, {action: "toggleEdit"}, function(response) {
            if (chrome.runtime.lastError) {
              console.error("Error sending toggleEdit message:", chrome.runtime.lastError.message);
            } else {
              console.log("toggleEdit message sent, response:", response);
            }
          });
        } else {
          console.error("No active tab found for toggleEdit.");
        }
      });
    });
  } else {
    console.error("Button with ID 'toggleEditModeButton' not found.");
  }

  if (toggleSidebarButton) {
    toggleSidebarButton.addEventListener('click', function() {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, {action: "toggleSidebar"}, function(response) {
            if (chrome.runtime.lastError) {
              console.error("Error sending toggleSidebar message:", chrome.runtime.lastError.message);
            } else {
              console.log("toggleSidebar message sent, response:", response);
            }
          });
        } else {
          console.error("No active tab found for toggleSidebar.");
        }
      });
    });
  } else {
    console.error("Button with ID 'toggleSidebarButton' not found.");
  }

  if (clipSelectionButton) {
    clipSelectionButton.addEventListener('click', function() {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, {action: "clipSelection"}, function(response) {
            if (chrome.runtime.lastError) {
              console.error("Error sending clipSelection message:", chrome.runtime.lastError.message);
            } else {
              console.log("clipSelection message sent, response:", response);
            }
          });
        } else {
          console.error("No active tab found for clipSelection.");
        }
      });
    });
  } else {
    console.error("Button with ID 'clipSelectionButton' not found.");
  }
});

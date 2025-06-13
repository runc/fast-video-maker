console.log("Popup script loaded.");

document.addEventListener('DOMContentLoaded', function() {
  const toggleButton = document.getElementById('toggleEditModeButton');
  if (toggleButton) {
    toggleButton.addEventListener('click', function() {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, {action: "toggleEdit"}, function(response) {
            if (chrome.runtime.lastError) {
              console.error("Error sending message:", chrome.runtime.lastError.message);
            } else {
              console.log("Message sent, response:", response);
            }
          });
        } else {
          console.error("No active tab found.");
        }
      });
    });
  } else {
    console.error("Button with ID 'toggleEditModeButton' not found.");
  }

  const toggleSidebarBtn = document.getElementById('toggleSidebarButton');
  if (toggleSidebarBtn) {
    toggleSidebarBtn.addEventListener('click', function() {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, {action: "toggleSidebar"}, function(response) {
            if (chrome.runtime.lastError) {
              console.error("Error sending message to toggle sidebar:", chrome.runtime.lastError.message);
            } else {
              console.log("Sidebar toggle message sent, response:", response);
            }
          });
        } else {
          console.error("No active tab found for sidebar toggle.");
        }
      });
    });
  } else {
    console.error("Button with ID 'toggleSidebarButton' not found.");
  }

  const clipSelectionBtn = document.getElementById('clipSelectionButton');
  if (clipSelectionBtn) {
    clipSelectionBtn.addEventListener('click', function() {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, {action: "clipSelection"}, function(response) {
            if (chrome.runtime.lastError) {
              console.error("Error sending clip selection message:", chrome.runtime.lastError.message);
            } else {
              console.log("Clip selection message sent, response:", response);
            }
          });
        } else {
          console.error("No active tab found for clip selection.");
        }
      });
    });
  } else {
    console.error("Button with ID 'clipSelectionButton' not found.");
  }
});

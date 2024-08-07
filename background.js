// background.js

const CHECK_INTERVAL = 5000; // 1 minute

function checkForUpdates(tabId) {
  chrome.storage.local.get(
    ["url", "lastContent", "changes", "checks"],
    (data) => {
      if (data.url) {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabId },
            func: () => document.body.innerText,
          },
          (results) => {
            if (chrome.runtime.lastError) {
              console.error(
                "Script execution error:",
                chrome.runtime.lastError
              );
              return;
            }
            const currentPageContent = results[0]?.result;
            if (currentPageContent !== data.lastContent) {
              chrome.storage.local.set({ lastContent: currentPageContent });
              const newChangeCount = (data.changes || 0) + 1;
              chrome.storage.local.set({ changes: newChangeCount });
              chrome.notifications.create({
                type: "basic",
                iconUrl: "icon.png",
                title: "Page Updated!",
                message: `The page content has changed. Number of changes: ${newChangeCount}`,
              });
            }
            const newCheckCount = (data.checks || 0) + 1;
            chrome.storage.local.set({ checks: newCheckCount });
          }
        );
      }
    }
  );
}

function reloadPage(tabId) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: () => window.location.reload(),
  });
}

let intervalId;
function startMonitoring() {
  intervalId = setInterval(() => {
    chrome.storage.local.get(["monitoring", "url"], (data) => {
      if (data.monitoring && data.url) {
        chrome.tabs.query({ url: data.url }, (tabs) => {
          if (tabs.length > 0) {
            reloadPage(tabs[0].id);
          } else {
            console.warn("No tabs found for URL:", data.url);
          }
        });
      }
    });
  }, CHECK_INTERVAL);
}

function stopMonitoring() {
  clearInterval(intervalId);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startMonitoring") {
    startMonitoring();
  } else if (message.action === "stopMonitoring") {
    stopMonitoring();
  }
});

chrome.webNavigation.onCompleted.addListener(
  (details) => {
    chrome.storage.local.get(["monitoring", "url"], (data) => {
      if (data.monitoring && data.url === details.url) {
        checkForUpdates(details.tabId);
      }
    });
  },
  { url: [{ hostContains: "." }] }
); // Monitor all URLs

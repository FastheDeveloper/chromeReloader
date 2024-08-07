// background.js

const CHECK_INTERVAL = 5000; // 1 minute

function checkForUpdates(tabId) {
  chrome.storage.local.get(["lastContent", "changes", "checks"], (data) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId },
        func: () => document.body.innerText,
      },
      (results) => {
        if (chrome.runtime.lastError) {
          console.error("Script execution error:", chrome.runtime.lastError);
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
  });
}

function reloadPage(tabId) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: () => window.location.reload(),
  });
}

let intervalId;
function startMonitoring(url) {
  intervalId = setInterval(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab) {
        chrome.storage.local.set({ url: url }); // Store the URL
        reloadPage(tab.id);
      }
    });
  }, CHECK_INTERVAL);
}

function stopMonitoring() {
  clearInterval(intervalId);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startMonitoring") {
    startMonitoring(message.url);
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
);

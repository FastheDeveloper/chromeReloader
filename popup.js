// popup.js

document.getElementById("start").addEventListener("click", () => {
  const url = document.getElementById("url").value;
  if (url) {
    chrome.storage.local.set(
      {
        monitoring: true,
        url: url,
        lastContent: "", // Initialize lastContent as empty
        changes: 0,
        checks: 0,
      },
      () => {
        updatePopup();
        chrome.runtime.sendMessage({ action: "startMonitoring" });
      }
    );
  } else {
    alert("Please enter a URL.");
  }
});

document.getElementById("stop").addEventListener("click", () => {
  chrome.storage.local.set({ monitoring: false }, () => {
    updatePopup();
    chrome.runtime.sendMessage({ action: "stopMonitoring" });
  });
});

function updatePopup() {
  chrome.storage.local.get(
    ["monitoring", "url", "changes", "checks"],
    (data) => {
      if (data.monitoring) {
        document.getElementById("start").classList.add("hidden");
        document.getElementById("stop").classList.remove("hidden");
        document.getElementById(
          "message"
        ).textContent = `Monitoring started for ${data.url}`;
        document.getElementById("message").classList.remove("hidden");
      } else {
        document.getElementById("start").classList.remove("hidden");
        document.getElementById("stop").classList.add("hidden");
        document.getElementById("message").textContent = "Monitoring stopped";
        document.getElementById("message").classList.remove("hidden");
      }
      document.getElementById("changes").textContent = `Number of changes: ${
        data.changes || 0
      }`;
      document.getElementById(
        "checks"
      ).textContent = `Number of times checked: ${data.checks || 0}`;
      document.getElementById("changes").classList.remove("hidden");
      document.getElementById("checks").classList.remove("hidden");
    }
  );
}

document.addEventListener("DOMContentLoaded", updatePopup);

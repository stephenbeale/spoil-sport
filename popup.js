"use strict";

const toggle = document.getElementById("enabled");
const statsEl = document.getElementById("stats");
const optionsLink = document.getElementById("options-link");

chrome.storage.sync.get({ enabled: true }, (settings) => {
  toggle.checked = settings.enabled;
});

toggle.addEventListener("change", () => {
  chrome.storage.sync.set({ enabled: toggle.checked });
});

optionsLink.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// Count sanitised items on the active tab
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (!tabs[0]?.id) return;
  chrome.scripting?.executeScript?.(
    {
      target: { tabId: tabs[0].id },
      func: () => document.querySelectorAll('[data-spoilsport="hidden"]').length
    },
    (results) => {
      if (chrome.runtime.lastError || !results?.[0]) return;
      const count = results[0].result || 0;
      statsEl.textContent =
        count > 0
          ? `Sanitised ${count} video${count !== 1 ? "s" : ""} on this page`
          : "No sports videos detected on this page";
    }
  );
});

"use strict";

const DEFAULT_SPORTS = [
  "football", "soccer", "premier league", "champions league", "fa cup",
  "efl", "carabao cup", "la liga", "serie a", "bundesliga", "ligue 1",
  "world cup", "euros", "nations league",
  "rugby", "six nations", "rugby world cup",
  "cricket", "ashes", "ipl", "t20", "test match",
  "tennis", "wimbledon", "us open", "french open", "australian open",
  "formula 1", "f1", "grand prix", "motogp",
  "boxing", "ufc", "mma",
  "nfl", "super bowl", "nba", "mlb", "nhl",
  "golf", "ryder cup", "masters",
  "olympics", "commonwealth games",
  "match", "goal", "score", "penalty", "fixture", "knockout",
  "highlight", "highlights", "full match", "extended highlights",
  "final score", "match report", "post-match"
];

const DEFAULT_CHANNELS = [
  "sky sports", "bt sport", "tnt sports", "espn", "bbc sport",
  "premier league", "champions league", "fa cup",
  "nfl", "nba", "mlb", "nhl",
  "cricket australia", "ecb", "icc",
  "wwe", "ufc", "dazn", "eurosport",
  "sky sports f1", "formula 1", "motogp",
  "pga tour", "the open", "wimbledon",
  "rugby tv", "world rugby"
];

const keywordListEl = document.getElementById("keyword-list");
const keywordInput = document.getElementById("new-keyword");
const addKeywordBtn = document.getElementById("add-btn");
const resetKeywordsBtn = document.getElementById("reset-keywords-btn");

const channelListEl = document.getElementById("channel-list");
const channelInput = document.getElementById("new-channel");
const addChannelBtn = document.getElementById("add-channel-btn");
const resetChannelsBtn = document.getElementById("reset-channels-btn");

const statusEl = document.getElementById("status");

let sports = [];
let channels = [];

function renderList(listEl, items, removeCallback) {
  listEl.innerHTML = "";
  items
    .slice()
    .sort((a, b) => a.localeCompare(b))
    .forEach((item) => {
      const tag = document.createElement("span");
      tag.className = "keyword-tag";
      tag.setAttribute("role", "listitem");
      tag.textContent = item;

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "\u00d7";
      removeBtn.setAttribute("aria-label", `Remove ${item}`);
      removeBtn.addEventListener("click", () => removeCallback(item));

      tag.appendChild(removeBtn);
      listEl.appendChild(tag);
    });
}

function showStatus(msg) {
  statusEl.textContent = msg;
  setTimeout(() => { statusEl.textContent = ""; }, 1500);
}

function save() {
  chrome.storage.sync.set({ sports, channels }, () => showStatus("Saved"));
}

function renderAll() {
  renderList(keywordListEl, sports, (keyword) => {
    sports = sports.filter((s) => s !== keyword);
    save();
    renderAll();
  });
  renderList(channelListEl, channels, (channel) => {
    channels = channels.filter((c) => c !== channel);
    save();
    renderAll();
  });
}

function addItem(inputEl, list, listName) {
  const value = inputEl.value.trim().toLowerCase();
  if (!value) return;
  if (list.includes(value)) {
    showStatus(`${listName} already exists`);
    return;
  }
  list.push(value);
  save();
  renderAll();
  inputEl.value = "";
  inputEl.focus();
}

addKeywordBtn.addEventListener("click", () => addItem(keywordInput, sports, "Keyword"));
keywordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addItem(keywordInput, sports, "Keyword");
});

addChannelBtn.addEventListener("click", () => addItem(channelInput, channels, "Channel"));
channelInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addItem(channelInput, channels, "Channel");
});

resetKeywordsBtn.addEventListener("click", () => {
  sports = [...DEFAULT_SPORTS];
  save();
  renderAll();
});

resetChannelsBtn.addEventListener("click", () => {
  channels = [...DEFAULT_CHANNELS];
  save();
  renderAll();
});

chrome.storage.sync.get(
  { sports: DEFAULT_SPORTS, channels: DEFAULT_CHANNELS },
  (settings) => {
    sports = settings.sports;
    channels = settings.channels;
    renderAll();
  }
);

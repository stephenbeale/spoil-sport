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

const listEl = document.getElementById("keyword-list");
const input = document.getElementById("new-keyword");
const addBtn = document.getElementById("add-btn");
const resetBtn = document.getElementById("reset-btn");
const statusEl = document.getElementById("status");

let sports = [];

function render() {
  listEl.innerHTML = "";
  sports
    .slice()
    .sort((a, b) => a.localeCompare(b))
    .forEach((keyword) => {
      const tag = document.createElement("span");
      tag.className = "keyword-tag";
      tag.setAttribute("role", "listitem");
      tag.textContent = keyword;

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "\u00d7";
      removeBtn.setAttribute("aria-label", `Remove ${keyword}`);
      removeBtn.addEventListener("click", () => {
        sports = sports.filter((s) => s !== keyword);
        save();
        render();
      });

      tag.appendChild(removeBtn);
      listEl.appendChild(tag);
    });
}

function save() {
  chrome.storage.sync.set({ sports }, () => {
    statusEl.textContent = "Saved";
    setTimeout(() => {
      statusEl.textContent = "";
    }, 1500);
  });
}

function addKeyword() {
  const value = input.value.trim().toLowerCase();
  if (!value) return;
  if (sports.includes(value)) {
    statusEl.textContent = "Keyword already exists";
    setTimeout(() => {
      statusEl.textContent = "";
    }, 1500);
    return;
  }
  sports.push(value);
  save();
  render();
  input.value = "";
  input.focus();
}

addBtn.addEventListener("click", addKeyword);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addKeyword();
});

resetBtn.addEventListener("click", () => {
  sports = [...DEFAULT_SPORTS];
  save();
  render();
});

chrome.storage.sync.get({ sports: DEFAULT_SPORTS }, (settings) => {
  sports = settings.sports;
  render();
});

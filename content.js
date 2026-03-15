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

let blockedSports = [];
let blockedChannels = [];
let enabled = true;
const HIDDEN_TITLE = "Sports video (spoilers hidden)";
const PROCESSED_ATTR = "data-spoilsport";

function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      { sports: DEFAULT_SPORTS, channels: DEFAULT_CHANNELS, enabled: true },
      (settings) => {
        blockedSports = settings.sports.map((s) => s.toLowerCase());
        blockedChannels = settings.channels.map((s) => s.toLowerCase());
        enabled = settings.enabled;
        resolve();
      }
    );
  });
}

function buildPattern() {
  const escaped = blockedSports.map((s) =>
    s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  return new RegExp(`\\b(${escaped.join("|")})\\b`, "i");
}

function isSportsContent(titleText) {
  if (!titleText) return false;
  const pattern = buildPattern();
  return pattern.test(titleText);
}

function getChannelName(videoEl) {
  const channelEl =
    videoEl.querySelector("ytd-channel-name #text") ||
    videoEl.querySelector("ytd-channel-name a") ||
    videoEl.querySelector("#channel-name #text") ||
    videoEl.querySelector("#channel-name a") ||
    videoEl.querySelector(".ytd-channel-name") ||
    videoEl.querySelector("[id='channel-name']");
  if (channelEl) {
    return (channelEl.textContent || "").trim();
  }
  return "";
}

function isBlockedChannel(channelName) {
  if (!channelName) return false;
  const lower = channelName.toLowerCase();
  return blockedChannels.some((ch) => lower.includes(ch));
}

function getTitleText(videoEl) {
  const titleLink =
    videoEl.querySelector("#video-title") ||
    videoEl.querySelector("#video-title-link") ||
    videoEl.querySelector("a#video-title") ||
    videoEl.querySelector("[id='video-title']");
  if (titleLink) {
    return (titleLink.textContent || titleLink.getAttribute("title") || "").trim();
  }
  return "";
}

function sanitiseVideo(videoEl) {
  if (videoEl.getAttribute(PROCESSED_ATTR) === "hidden") return;

  // Hide thumbnail
  const thumbnail =
    videoEl.querySelector("ytd-thumbnail") ||
    videoEl.querySelector("#thumbnail");
  if (thumbnail) {
    thumbnail.setAttribute("aria-hidden", "true");
    thumbnail.classList.add("spoilsport-hidden-thumb");
  }

  // Replace title text
  const titleLink =
    videoEl.querySelector("#video-title") ||
    videoEl.querySelector("#video-title-link") ||
    videoEl.querySelector("a#video-title");
  if (titleLink) {
    if (!titleLink.dataset.spoilsportOriginal) {
      titleLink.dataset.spoilsportOriginal = titleLink.textContent.trim();
    }
    titleLink.textContent = HIDDEN_TITLE;
    titleLink.setAttribute("title", HIDDEN_TITLE);
    titleLink.setAttribute("aria-label", HIDDEN_TITLE);
  }

  videoEl.setAttribute(PROCESSED_ATTR, "hidden");
}

function unsanitiseVideo(videoEl) {
  if (videoEl.getAttribute(PROCESSED_ATTR) !== "hidden") return;

  const thumbnail =
    videoEl.querySelector("ytd-thumbnail") ||
    videoEl.querySelector("#thumbnail");
  if (thumbnail) {
    thumbnail.removeAttribute("aria-hidden");
    thumbnail.classList.remove("spoilsport-hidden-thumb");
  }

  const titleLink =
    videoEl.querySelector("#video-title") ||
    videoEl.querySelector("#video-title-link") ||
    videoEl.querySelector("a#video-title");
  if (titleLink && titleLink.dataset.spoilsportOriginal) {
    titleLink.textContent = titleLink.dataset.spoilsportOriginal;
    titleLink.setAttribute("title", titleLink.dataset.spoilsportOriginal);
    titleLink.setAttribute("aria-label", titleLink.dataset.spoilsportOriginal);
    delete titleLink.dataset.spoilsportOriginal;
  }

  videoEl.removeAttribute(PROCESSED_ATTR);
}

function processVideos() {
  if (!enabled) return;

  const videoSelectors = [
    "ytd-rich-item-renderer",
    "ytd-video-renderer",
    "ytd-compact-video-renderer",
    "ytd-grid-video-renderer"
  ];

  const videos = document.querySelectorAll(videoSelectors.join(","));

  videos.forEach((videoEl) => {
    const originalTitle =
      videoEl.querySelector("#video-title")?.dataset?.spoilsportOriginal ||
      getTitleText(videoEl);

    const channelName = getChannelName(videoEl);

    if (isSportsContent(originalTitle) || isBlockedChannel(channelName)) {
      sanitiseVideo(videoEl);
    }
  });
}

function unsanitiseAll() {
  const hidden = document.querySelectorAll(`[${PROCESSED_ATTR}="hidden"]`);
  hidden.forEach(unsanitiseVideo);
}

// Observe DOM changes for dynamically loaded content
const observer = new MutationObserver((mutations) => {
  if (!enabled) return;
  let shouldProcess = false;
  for (const mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      shouldProcess = true;
      break;
    }
  }
  if (shouldProcess) {
    processVideos();
  }
});

async function init() {
  await loadSettings();
  processVideos();

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Re-process on navigation (YouTube is an SPA)
  let lastUrl = location.href;
  const urlObserver = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      processVideos();
    }
  });
  urlObserver.observe(document.querySelector("title") || document.head, {
    childList: true,
    subtree: true
  });
}

// Listen for settings changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.sports) {
    blockedSports = changes.sports.newValue.map((s) => s.toLowerCase());
  }
  if (changes.channels) {
    blockedChannels = changes.channels.newValue.map((s) => s.toLowerCase());
  }
  if (changes.enabled) {
    enabled = changes.enabled.newValue;
    if (!enabled) {
      unsanitiseAll();
    }
  }
  if (enabled) {
    processVideos();
  }
});

init();

// Browser compatibility shim: normalizes chrome.* vs browser.* APIs
// Firefox uses browser.* namespace with promise-based APIs
// Chrome uses chrome.* namespace (MV3 also supports promises)

(function () {
  if (typeof browser !== "undefined" && typeof chrome === "undefined") {
    // Firefox: alias chrome -> browser
    window.chrome = browser;

    // chrome.storage.session is not supported in Firefox — fall back to chrome.storage.local
    if (!chrome.storage.session) {
      chrome.storage.session = chrome.storage.local;
    }
  }

  // Ensure chrome.runtime.onMessage listener return value works in both browsers
  // Chrome: return true to keep channel open for async sendResponse
  // Firefox: return Promise for async response
  // Our code already uses return true + sendResponse pattern, which works in both
})();

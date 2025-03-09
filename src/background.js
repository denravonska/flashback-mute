const STORAGE_FLUSH_TIMEOUT = 3000;

console.log("Service worker running");

// Installations need to pull synchronized data.
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get(null, (syncData) => {
        commitChangs(syncData, chrome.storage.local);
    });
});

// Storage synchronization.
var timeout;
var queuedChanges = {};
var syncStamp = 1;

chrome.storage.onChanged.addListener(function (changes, area) {
    // Check if it's an echo of our changes
    if (changes.syncStamp && changes.syncStamp.newValue == syncStamp) {
        return;
    }

    if (area == "local") {
        // Change in local storage: queue a flush to sync

        // Reset timeout
        if (timeout)
            clearTimeout(timeout);

        // Merge changes with already queued ones
        for (var key in changes) {
            // Just overwrite old change; we don't care about last newValue
            queuedChanges[key] = changes[key];
        }

        // Schedule flush
        timeout = setTimeout(flushToSync, 3000);

    } else {
        // Change in sync storage: copy to local
        if (changes.syncStamp && changes.syncStamp.newValue) {
            // Ignore those changes when they echo as local
            syncStamp = changes.syncStamp.newValue;
        }
        commitChanges(changes, chrome.storage.local);
    }
});

function flushToSync() {
    // Be mindful of what gets synced: there are also size quotas
    // If needed, filter queuedChanges here

    // Generate a new sync stamp
    // With random instead of sequential, there's a really tiny chance
    //   changes will be ignored, but no chance of stamp overflow
    syncStamp = Math.random();
    queuedChanges.syncStamp = { newValue: syncStamp };

    // Process queue for committing
    commitChanges(queuedChanges, chrome.storage.sync);

    // Reset queue
    queuedChanges = {};
    timeout = undefined;
}

function commitChanges(changes, storage) {
    var setData = {};

    for (var key in changes) {
        setData[key] = changes[key].newValue;
    }

    storage.set(setData, function () {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
        }
    });
}

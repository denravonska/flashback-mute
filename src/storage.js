const MUTED_USERS_KEY = "muted_users";
const STORAGE_VERSION_KEY = "storage_version";
const STORAGE_VERSION = 1;

function migrateFromLocalStorage() {
    // Move local storage to sync storage
    chrome.storage.local.get([MUTED_USERS_KEY], (localData) => {
        if (!localData[MUTED_USERS_KEY])
            return;

        // Local storage data is available. If there is no sync storage data,
        // move the local storage data to sync storage. In case of a conflict,
        // drop the local storage.
        chrome.storage.sync.get([MUTED_USERS_KEY], (syncData) => {
            if (!syncData[MUTED_USERS_KEY])
                chrome.storage.sync.set({ [MUTED_USERS_KEY]: localData[MUTED_USERS_KEY] });
        });

        chrome.storage.local.remove([MUTED_USERS_KEY]);
    });
}

function migrateStorageVersion() {
    chrome.storage.sync.get([STORAGE_VERSION_KEY], (data) => {
        let storageVersion = data[STORAGE_VERSION_KEY] || 0;
        if (storageVersion == 0)
            chrome.storage.sync.set({ [STORAGE_VERSION_KEY]: STORAGE_VERSION });
    });
}

function muteUser(user) {
    chrome.storage.sync.get([MUTED_USERS_KEY], (data) => {
        let mutedUsers = data[MUTED_USERS_KEY] || [];

        if (!mutedUsers.some(u => u.id === user.id)) {
            mutedUsers.push(user);
            chrome.storage.sync.set({ [MUTED_USERS_KEY]: mutedUsers });
        }
    });
}

function unmuteUser(user) {
    chrome.storage.sync.get([MUTED_USERS_KEY], (data) => {
        let mutedUsers = data[MUTED_USERS_KEY] || [];

        let index = mutedUsers.findIndex(u => u.id === user.id);
        if (index !== -1) {
            mutedUsers.splice(index, 1);
            chrome.storage.sync.set({ [MUTED_USERS_KEY]: mutedUsers });
        }
    });
}

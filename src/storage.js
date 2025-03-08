const MUTED_USERS_KEY = "muted_users";
const STORAGE_VERSION_KEY = "storage_version";
const STORAGE_VERSION = 1;


function migrateStorageVersion() {
    chrome.storage.local.get([STORAGE_VERSION_KEY], (data) => {
        let storageVersion = data[STORAGE_VERSION_KEY] || 0;
        if (storageVersion == 0)
            chrome.storage.local.set({ [STORAGE_VERSION_KEY]: STORAGE_VERSION });
    });
}

function muteUser(user) {
    chrome.storage.local.get([MUTED_USERS_KEY], (data) => {
        let mutedUsers = data[MUTED_USERS_KEY] || [];

        if (!mutedUsers.some(u => u.id === user.id)) {
            mutedUsers.push(user);
            chrome.storage.local.set({ [MUTED_USERS_KEY]: mutedUsers });
        }
    });
}

function unmuteUser(user) {
    chrome.storage.local.get([MUTED_USERS_KEY], (data) => {
        let mutedUsers = data[MUTED_USERS_KEY] || [];

        let index = mutedUsers.findIndex(u => u.id === user.id);
        if (index !== -1) {
            mutedUsers.splice(index, 1);
            chrome.storage.local.set({ [MUTED_USERS_KEY]: mutedUsers });
        }
    });
}

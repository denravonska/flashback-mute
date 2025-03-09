const MUTED_USERS_KEY = "muted_users";
const STORAGE_VERSION_KEY = "storage_version";
const STORAGE_VERSION = 1;

let mutedUsers = [];

function initStorage(data) {
    mutedUsers = data[MUTED_USERS_KEY] || [];

    // Storage migration on version change.
    let storageVersion = data[STORAGE_VERSION_KEY] || 0;
    if (storageVersion == 0)
        chrome.storage.local.set({ [STORAGE_VERSION_KEY]: STORAGE_VERSION });
}

function muteUser(user) {
    if (!mutedUsers.some(u => u.id === user.id)) {
        mutedUsers.push(user);
        chrome.storage.local.set({ [MUTED_USERS_KEY]: mutedUsers });
    }
}

function unmuteUser(user) {
    let index = mutedUsers.findIndex(u => u.id === user.id);
    if (index !== -1) {
        mutedUsers.splice(index, 1);
        chrome.storage.local.set({ [MUTED_USERS_KEY]: mutedUsers });
    }
}

function isUserMuted(user) {
    return mutedUsers.some(u => u.id === user.id);
}

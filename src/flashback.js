// TODO
// - Handle quotes
// - Store username in addition to user ID

const STORAGE_KEY = "muted_users";
const STORAGE_VERSION_KEY = "storage_version";
const STORAGE_VERSION = 1;

// Load muted users from storage
chrome.storage.local.get([STORAGE_KEY], (data) => {
    let mutedUsers = data[STORAGE_KEY] || [];

    // TODO: Storage migration
    let storageVersion = data[STORAGE_VERSION_KEY] || 0;
    if (storageVersion == 0)
        chrome.storage.local.set({ [STORAGE_VERSION_KEY]: STORAGE_VERSION });

    function togglePostVisibility(postBody) {
        postBody.style.display = postBody.style.display === 'none' ? '' : 'none';
    }

    function isUserMuted(user) {
        return mutedUsers.some(u => u.id === user.id);
    }

    // Update user post based on mute state
    function updateUserPostState(user, isMuted, postBody, postHeading, muteButton) {
        let mutedUserElement = postHeading.querySelector('.muted-user');

        if (isMuted) {
            if (!mutedUserElement) {
                let mutedUserSpan = document.createElement('span');
                mutedUserSpan.classList.add('muted-user');
                mutedUserSpan.textContent = `Post from muted user ${user.name}. Click to toggle`;
                let pullRight = postHeading.querySelector('.pull-right');
                postHeading.insertBefore(mutedUserSpan, pullRight);
            }
        } else {
            if (mutedUserElement) {
                mutedUserElement.remove();
            }
        }

        muteButton.textContent = isMuted ? "Unmute" : "Mute";
        postBody.style.display = isMuted ? 'none' : '';
    }

    // Mute/Unmute button click handler
    function handleMuteButtonClick(user) {
        let isMuted = isUserMuted(user);
        if (isMuted) {
            // Unmute user
            const index = mutedUsers.findIndex(u => u.id === user.id);
            if (index !== -1)
                mutedUsers.splice(index, 1);
        } else {
            // Mute user
            mutedUsers.push(user);
        }

        // For sake of readability. The mute state is now the inverse of
        // the previous state
        isMuted = !isMuted;

        rescanPostsForUser(user, isMuted);

        chrome.storage.local.set({ [STORAGE_KEY]: mutedUsers });
    }

    // Function to rescan the page for the user's posts after muting or unmuting
    function rescanPostsForUser(user, isMuted) {
        document.querySelectorAll(`a.post-user-username[href="${user.id}"]`).forEach(anchor => {
            let postContainer = anchor.closest('div[id]');
            let postBody = postContainer.querySelector('.post-body');
            let postHeading = postContainer.querySelector('.post-heading');
            let muteButton = postContainer.querySelector('#mute-button');
            updateUserPostState(user, isMuted, postBody, postHeading, muteButton);
        });
    }

    // Add Mute/Unmute button and event listener to each post
    document.querySelectorAll('a.post-user-username').forEach(anchor => {
        let href = anchor.getAttribute("href");
        if (!href)
            return;

        let postContainer = anchor.closest('div[id]');
        if (!postContainer)
            return;

        let postBody = postContainer.querySelector('.post-body');
        let postHeading = postContainer.querySelector('.post-heading');
        if (!postBody || !postHeading)
            return;

        // Create Mute/Unmute button
        let user = {
            name: anchor.textContent.trim(),
            id: href
        }

        let muteButton = document.createElement("div");
        muteButton.setAttribute('id', 'mute-button');
        muteButton.style.cursor = "pointer";
        muteButton.addEventListener("click", () => handleMuteButtonClick(user));
        postContainer.querySelector('.post-user').insertAdjacentElement("afterend", muteButton);

        // All posts can be toggled
        postHeading.style.cursor = 'pointer';
        postHeading.addEventListener('click', () => togglePostVisibility(postBody));

        // Update post state
        updateUserPostState(user, isUserMuted(user), postBody, postHeading, muteButton);
    });
});

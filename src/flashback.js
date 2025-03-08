// TODO
// - Handle quotes
// - Store username in addition to user ID


migrateStorageVersion();

// Load muted users from storage
chrome.storage.local.get([MUTED_USERS_KEY], (data) => {
    let mutedUsers = data[MUTED_USERS_KEY] || [];

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
            mutedUserElement?.remove();
        }

        muteButton.textContent = isMuted ? "Unmute" : "Mute";
        postBody.style.display = isMuted ? 'none' : '';
    }

    // Mute/Unmute button click handler
    function handleMuteButtonClick(user) {
        let isMuted = isUserMuted(user);
        if (isMuted) {
            unmuteUser(user);
        } else {
            muteUser(user);
        }

        // For sake of readability. The mute state is now the inverse of
        // the previous state
        isMuted = !isMuted;

        rescanPostsForUser(user, isMuted);
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

        // Update post state
        updateUserPostState(user, isUserMuted(user), postBody, postHeading, muteButton);
    });

    // Workaround for the jumptarget element residing outside of the post
    // heading element, causing the wrong heading click handler to run.
    // Remove this workaround and switch back to per-heading click handlers
    // when figured out how to.
    document.getElementById("posts").addEventListener("click", (event) => {
        for (post of document.querySelectorAll(".post")) {
            const postHeading = post.querySelector(".post-heading");
            const rect = postHeading.getBoundingClientRect();
            if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)
                continue;

            const postBody = post.querySelector(".post-body");
            togglePostVisibility(postBody);
            break;
        }
    });
});

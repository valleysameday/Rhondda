export function checkBadges(userStats) {
    const badgeContainer = document.getElementById('badge-shelf');
    
    // Example: The "Valley Star" badge for 100 views
    if (userStats.views >= 100) {
        renderBadge('⭐', 'Valley Star', 'Reached 100 local views');
    }
    
    // Example: The "Fast Responder" badge
    if (userStats.responseRate >= 90) {
        renderBadge('⚡', 'Fast Responder', 'Responds to messages in under 1 hour');
    }
}

function renderBadge(emoji, title, desc) {
    const div = document.createElement('div');
    div.className = 'badge-item';
    div.innerHTML = `<span title="${desc}">${emoji} ${title}</span>`;
    document.getElementById('badge-shelf').appendChild(div);
}

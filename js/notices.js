/* js/notices.js */
import { db } from './firebase.js';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, increment } from "www.gstatic.com";

// 1. Listen for Live Updates
export function loadNotices() {
    const container = document.getElementById('notices-container');
    const q = query(collection(db, "notices"), orderBy("timestamp", "desc"));
    
    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            container.innerHTML = "<p>No notices yet. Be the first to post!</p>";
            return;
        }
        
        container.innerHTML = ""; // Clear the loading message
        snapshot.forEach((doc) => {
            const data = doc.data();
            renderNoticeCard(data, doc.id, container);
        });
    }, (error) => {
        console.error("Firebase Error:", error);
        container.innerHTML = "<p>Error loading notices. Check database rules.</p>";
    });
}

// 2. Create the HTML for each card
function renderNoticeCard(data, id, container) {
    const card = document.createElement('div');
    card.className = 'card notice-card';
    
    // Safety check for timestamp
    const dateStr = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleDateString() : "Just now";

    card.innerHTML = `
        <div class="card-header">
            <h3>${data.title}</h3>
            <span class="badge">${data.category || 'General'}</span>
        </div>
        <p>${data.description}</p>
        <div class="card-footer">
            <button class="btn btn-secondary btn-sm" onclick="shareNotice('${data.title}', '${id}')">Share</button>
            <span class="timestamp">${dateStr}</span>
        </div>
    `;
    container.appendChild(card);
}

// 3. Stats Tracking (Income Proof)
export async function trackView(noticeId) {
    const noticeRef = doc(db, "notices", noticeId);
    try {
        await updateDoc(noticeRef, {
            views: increment(1)
        });
    } catch (err) {
        console.error("Stats error:", err);
    }
}

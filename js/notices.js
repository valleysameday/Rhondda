import { db } from './firebase.js';
import { collection, query, onSnapshot, orderBy } from "www.gstatic.com";

const container = document.getElementById('notices-container');

// 1. Listen for Live Updates
export function loadNotices() {
    const q = query(collection(db, "notices"), orderBy("timestamp", "desc"));
    
    onSnapshot(q, (snapshot) => {
        container.innerHTML = ""; // Clear old ones
        snapshot.forEach((doc) => {
            const data = doc.data();
            renderNoticeCard(data, doc.id);
        });
    });
}
import { db } from './firebase.js';
import { doc, updateDoc, increment } from "www.gstatic.com";

export async function trackView(noticeId) {
    const noticeRef = doc(db, "notices", noticeId);
    try {
        // Use 'increment' so multiple people can click at once without errors
        await updateDoc(noticeRef, {
            views: increment(1)
        });
    } catch (err) {
        console.error("Stats error:", err);
    }
}

// 2. Create the HTML for each card
function renderNoticeCard(data, id) {
    const card = document.createElement('div');
    card.className = 'card notice-card';
    card.innerHTML = `
        <div class="card-header">
            <h3>${data.title}</h3>
            <span class="badge">${data.category}</span>
        </div>
        <p>${data.description}</p>
        <div class="card-footer">
            <button class="btn btn-secondary btn-sm" onclick="shareNotice('${id}')">Share</button>
            <span class="timestamp">${new Date(data.timestamp?.toDate()).toLocaleDateString()}</span>
        </div>
    `;
    container.appendChild(card);
}

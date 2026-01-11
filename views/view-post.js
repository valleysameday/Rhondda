import { getPost, getUser, trackContactClick } from "/index/js/firebase/settings.js";
import { doc, setDoc, addDoc, collection } from "www.gstatic.com";

let state = { images: [], current: 0, post: null, seller: null };

export async function init({ auth }) {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id") || sessionStorage.getItem("viewPostId");
    
    if (!id) return;

    // Fetch parallel data for speed
    const postData = await getPost(id);
    if (!postData) return;
    
    const sellerData = await getUser(postData.userId || postData.businessId);
    state.post = postData;
    state.seller = sellerData;
    state.images = [...(postData.imageUrls || []), postData.imageUrl].filter(Boolean);

    renderUI();
    setupActions(auth);
}

function renderUI() {
    document.getElementById("postTitle").textContent = state.post.title;
    document.getElementById("postPrice").textContent = state.post.price ? `£${state.post.price}` : "Free";
    document.getElementById("postDescription").textContent = state.post.description;
    document.getElementById("sellerName").textContent = state.seller?.name || "Seller";
    document.getElementById("sellerInitial").textContent = (state.seller?.name || "S").charAt(0);
    
    updateGallery(0);
}

function updateGallery(idx) {
    state.current = idx;
    const img = document.getElementById("mainImage");
    img.src = state.images[state.current];
    document.getElementById("galleryCount").textContent = `${state.current + 1} / ${state.images.length}`;
}

function setupActions(auth) {
    // Gallery Nav
    document.getElementById("nextImg").onclick = () => updateGallery((state.current + 1) % state.images.length);
    document.getElementById("prevImg").onclick = () => updateGallery((state.current - 1 + state.images.length) % state.images.length);

    // Messaging Logic
    document.getElementById("sendQuickMessageBtn").onclick = async () => {
        const text = document.getElementById("quickMessage").value.trim();
        if (!auth.currentUser) return alert("Log in to message");

        const chatId = [auth.currentUser.uid, state.post.userId].sort().join("_");
        
        await setDoc(doc(window.firebaseDb, "conversations", chatId), {
            participants: [auth.currentUser.uid, state.post.userId],
            updatedAt: Date.now(),
            lastMessage: text
        }, { merge: true });

        await addDoc(collection(window.firebaseDb, "conversations", chatId, "messages"), {
            senderId: auth.currentUser.uid,
            text,
            createdAt: Date.now()
        });

        alert("Message sent!");
    };

    // Phone / WhatsApp
    if (state.post.phone) {
        const call = document.getElementById("callSellerBtn");
        call.style.display = "block";
        call.href = `tel:${state.post.phone}`;

        if (state.post.whatsappAllowed) {
            const wa = document.getElementById("whatsappSellerBtn");
            wa.style.display = "block";
            wa.href = `wa.me{state.post.phone.replace(/\D/g,'')}`;
        }
    }
}

// /views/view-post.js
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function init({ db }) {
  const postId = sessionStorage.getItem("viewPostId");
  if (!postId) return;

  try {
    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return console.warn("Post not found:", postId);
    const post = postSnap.data();

    // DOM Mapping
    document.getElementById("viewTitle").textContent = post.title;
    document.getElementById("viewDescription").textContent = post.description || post.teaser || "";
    document.getElementById("viewPrice").textContent = post.price ? `£${post.price}` : "Contact for price";
    document.getElementById("viewArea").textContent = post.area || "Rhondda";
    document.getElementById("viewCategory").textContent = post.category || "Misc";
    document.getElementById("viewTime").textContent = post.posted || "Just now";

    // ------------------- GALLERY -------------------
    const gallery = document.getElementById("galleryContainer");
    gallery.innerHTML = '';
    const indicators = document.createElement('div');
    indicators.className = 'gallery-indicators';
    gallery.appendChild(indicators);

    let currentIndex = 0;

    function showImage(index) {
      if (!post.images?.length) return;
      currentIndex = (index + post.images.length) % post.images.length;
      gallery.querySelectorAll('img').forEach((img, i) => {
        img.style.transform = `translateX(${(i - currentIndex) * 100}%)`;
      });

      // Update indicators
      const dots = indicators.querySelectorAll('.dot');
      dots.forEach((d,i)=>d.classList.toggle('active', i===currentIndex));
    }

    if (post.images?.length) {
      post.images.forEach((url,i)=>{
        const img = document.createElement('img');
        img.src = url; img.alt = post.title;
        img.style.position = 'absolute';
        img.style.top='0'; img.style.left='0'; img.style.width='100%'; img.style.transition='transform 0.35s ease';
        gallery.appendChild(img);

        // indicator
        const dot = document.createElement('div');
        dot.className='dot';
        dot.addEventListener('click', ()=>showImage(i));
        indicators.appendChild(dot);
      });
      showImage(0);
    } else {
      const img = document.createElement('img');
      img.src='/images/post-placeholder.jpg';
      img.alt='Placeholder';
      gallery.appendChild(img);
    }

    // Navigation arrows (desktop)
    const leftNav = document.createElement('button'); leftNav.className='gallery-nav left'; leftNav.innerHTML='&lt;';
    const rightNav = document.createElement('button'); rightNav.className='gallery-nav right'; rightNav.innerHTML='&gt;';
    leftNav.onclick = ()=>showImage(currentIndex-1);
    rightNav.onclick = ()=>showImage(currentIndex+1);
    gallery.appendChild(leftNav); gallery.appendChild(rightNav);

    // Touch swipe (mobile)
    let startX = null;
    gallery.addEventListener('touchstart', e=>startX=e.touches[0].clientX);
    gallery.addEventListener('touchend', e=>{
      if(startX===null) return;
      let diff = startX - e.changedTouches[0].clientX;
      if(diff>30) showImage(currentIndex+1);
      else if(diff<-30) showImage(currentIndex-1);
      startX=null;
    });

    // ------------------- ACTION HANDLERS -------------------
    document.getElementById("messageSeller").onclick = () => alert("Chat feature coming soon! User ID: " + post.userId);
    document.getElementById("reportPost").onclick = () => {
      const reason = prompt("Reason for reporting (Scam, Spam, Inappropriate):");
      if (reason) alert("Report submitted. Thank you for keeping the marketplace safe.");
    };
  } catch (err) { console.error("Failed to load post:", err); }
}

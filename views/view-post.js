console.log("✅ view-post.js loaded");

if (window.selectedPostId) {
  console.log("▶ Auto-loading post:", window.selectedPostId);
  loadPost();
} else {
  console.warn("⚠ No selectedPostId set when view-post loaded");
}

async function loadPost() {
    console.log("loadPost() called");
    const container = document.getElementById("viewPostContent");
     // Ensure page is visible
    container.innerHTML = ''; // clear previous

    if (!window.selectedPostId) {
        console.warn("No selectedPostId set");
        container.textContent = "Post not found.";
        return;
    }
    console.log("Selected Post ID:", window.selectedPostId);

    const postRef = doc(db,"posts",window.selectedPostId);
    const snap = await getDoc(postRef);

    if (!snap.exists()) {
        console.warn("Post does not exist in Firestore");
        container.textContent="This post no longer exists.";
        return;
    }

    const post = snap.data();
    console.log("Post data loaded:", post);

    try {
        await updateDoc(postRef,{views:increment(1)});
        console.log("Incremented post views");
    } catch(e) {
        console.error("Error incrementing views:", e);
    }

    const isOwner = auth.currentUser?.uid === post.userId;
    console.log("Is current user the owner?", isOwner);

    const images = post.imageUrls?.length ? post.imageUrls : (post.imageUrl ? [post.imageUrl] : []);
    console.log("Images array:", images);

    let seller = null;
    if(post.userId) {
        console.log("Loading seller data for userId:", post.userId);
        const uSnap = await getDoc(doc(db,"users",post.userId));
        if(uSnap.exists()) {
            seller = uSnap.data();
            console.log("Seller data:", seller);
        } else {
            console.warn("Seller not found");
        }
    }

    // ---------- Layout ----------
    const layout = document.createElement('div'); layout.className='view-post-layout';

    // ---------- Left (Gallery) ----------
    const left = document.createElement('div'); left.className='view-post-left';
    const gallery = document.createElement('div'); gallery.className='gallery';
    images.forEach((url,idx)=>{
        const slide = document.createElement('div'); slide.className='gallery-slide'; slide.dataset.index=idx;
        const img=document.createElement('img'); 
        img.src=url||"/index/img/post-placeholder.png"; 
        img.alt=`${post.title} ${idx+1}`; 
        img.loading="lazy"; 
        img.onerror=()=>{ console.warn("Failed to load image:", img.src); img.src="/index/img/post-placeholder.png"; };
        slide.appendChild(img); 
        gallery.appendChild(slide);
    });
    left.appendChild(gallery);

    if(images.length>1){
        const thumbs = document.createElement('div'); thumbs.className='gallery-thumbs';
        images.forEach((url,idx)=>{
            const btn = document.createElement('button'); btn.className='thumb-btn'; btn.dataset.index=idx;
            const img = document.createElement('img'); 
            img.src=url||"/index/img/post-placeholder.png"; 
            img.alt=`Thumb ${idx+1}`; 
            img.loading="lazy"; 
            img.onerror=()=>{ console.warn("Failed to load thumb:", img.src); img.src="/index/img/post-placeholder.png"; };
            btn.appendChild(img); 
            thumbs.appendChild(btn);
        });
        left.appendChild(thumbs);
    }
    layout.appendChild(left);

    // ---------- Right (Content) ----------
    const right = document.createElement('div'); right.className='view-post-right';

    const header=document.createElement('div'); header.className='post-seller-header';
    const avatar=document.createElement('img'); avatar.className='seller-header-avatar'; avatar.src=seller?.photoURL||"/index/img/default-avatar.png"; avatar.onerror=()=>{ console.warn("Failed to load avatar:", avatar.src); avatar.src="/index/img/default-avatar.png"; }; avatar.loading="lazy";
    const info=document.createElement('div'); info.className='seller-header-info';
    const postedBy=document.createElement('p'); postedBy.className='posted-by'; postedBy.innerHTML=`Posted by <strong>${seller?.name||"Local Seller"}</strong>`;
    const postedOn=document.createElement('p'); postedOn.className='posted-on'; postedOn.textContent="Posted on Rhondda Noticeboard";
    const badges=document.createElement('div'); badges.className='seller-badges';
    if(seller?.isBusiness){ const b=document.createElement('span'); b.className='badge business'; b.textContent="Business"; badges.appendChild(b); }
    if(seller?.trusted){ const t=document.createElement('span'); t.className='badge trusted'; t.textContent="Trusted"; badges.appendChild(t); }
    const viewListingsBtn=document.createElement('button'); viewListingsBtn.className='view-listings-btn'; viewListingsBtn.textContent=`View all listings by ${seller?.name||"seller"}`; viewListingsBtn.onclick=()=>{ console.log("View all listings clicked"); window.openSellerProfile(post.userId); };
    info.append(postedBy,postedOn,badges,viewListingsBtn); header.append(avatar,info); right.appendChild(header);

    const h1=document.createElement('h1'); h1.textContent=post.title; right.appendChild(h1);
    if(post.price!==undefined){ const h2=document.createElement('h2'); h2.className='post-price'; h2.textContent=post.price===0?"FREE":`£${post.price}`; right.appendChild(h2); }
    const desc=document.createElement('p'); desc.className='view-post-desc'; desc.textContent=post.description; right.appendChild(desc);

    // ---------- META ----------
    const meta=document.createElement('div'); meta.className='view-post-meta';
    ['category','subcategory','area'].forEach(f=>{
        if(post[f]){
            const p=document.createElement('p'); p.innerHTML=`<strong>${f.charAt(0).toUpperCase()+f.slice(1)}:</strong> ${post[f]}`; meta.appendChild(p);
        }
    });
    const pPosted=document.createElement('p'); pPosted.innerHTML=`<strong>Posted:</strong> ${post.createdAt?.toDate().toLocaleDateString()||"Unknown"}`;
    const pViews=document.createElement('p'); pViews.innerHTML=`<strong>Views:</strong> ${post.views?post.views+1:1}`;
    meta.append(pPosted,pViews); right.appendChild(meta);

    // ---------- CTA ----------
    const engageBtn=document.createElement('button'); engageBtn.className='engage-btn'; engageBtn.textContent=`👍 I'm interested (${post.engagement||0})`; engageBtn.onclick=()=>{ console.log("Engage clicked for post:", window.selectedPostId); window.engagePost(window.selectedPostId); }; right.appendChild(engageBtn);

    const actions=document.createElement('div'); actions.className='view-post-actions';
    if(isOwner){ const manageBtn=document.createElement('button'); manageBtn.className='secondary-btn'; manageBtn.textContent="Manage this ad in your dashboard"; manageBtn.onclick=()=>{ console.log("Manage clicked"); navigateToDashboard(); }; actions.appendChild(manageBtn); }
    const backBtn=document.createElement('button'); backBtn.className='secondary-btn'; backBtn.textContent="Back to home"; backBtn.onclick=()=>{ console.log("Back to home clicked"); navigateToHome(); };
    actions.appendChild(backBtn);
    right.appendChild(actions);

    layout.appendChild(right);
    container.appendChild(layout);

    console.log("Post layout appended, setting up gallery");
    setupGallery();
    console.log("Gallery setup complete");
}

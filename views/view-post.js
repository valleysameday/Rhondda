async function loadPost() {
  const container = document.getElementById("viewPostContent");
  showPage('viewPostPage'); // Ensure page is visible
  container.innerHTML = ''; // clear previous

  if (!window.selectedPostId) { container.textContent = "Post not found."; return; }

  const postRef = doc(db,"posts",window.selectedPostId);
  const snap = await getDoc(postRef);
  if (!snap.exists()) { container.textContent="This post no longer exists."; return; }

  const post = snap.data();
  updateDoc(postRef,{views:increment(1)});
  const isOwner = auth.currentUser?.uid === post.userId;

  const images = post.imageUrls?.length ? post.imageUrls : (post.imageUrl ? [post.imageUrl] : []);
  let seller = null;
  if(post.userId) { const uSnap = await getDoc(doc(db,"users",post.userId)); if(uSnap.exists()) seller=uSnap.data(); }

  const layout = document.createElement('div'); layout.className='view-post-layout';
  
  // LEFT
  const left = document.createElement('div'); left.className='view-post-left';
  const gallery = document.createElement('div'); gallery.className='gallery';
  images.forEach((url,idx)=>{
    const slide = document.createElement('div'); slide.className='gallery-slide'; slide.dataset.index=idx;
    const img=document.createElement('img'); img.src=url||"/index/img/post-placeholder.png"; img.alt=`${post.title} ${idx+1}`; img.loading="lazy"; img.onerror=()=>img.src="/index/img/post-placeholder.png";
    slide.appendChild(img); gallery.appendChild(slide);
  });
  left.appendChild(gallery);

  if(images.length>1){
    const thumbs = document.createElement('div'); thumbs.className='gallery-thumbs';
    images.forEach((url,idx)=>{
      const btn = document.createElement('button'); btn.className='thumb-btn'; btn.dataset.index=idx;
      const img = document.createElement('img'); img.src=url||"/index/img/post-placeholder.png"; img.alt=`Thumb ${idx+1}`; img.loading="lazy"; img.onerror=()=>img.src="/index/img/post-placeholder.png";
      btn.appendChild(img); thumbs.appendChild(btn);
    });
    left.appendChild(thumbs);
  }

  layout.appendChild(left);

  // RIGHT
  const right = document.createElement('div'); right.className='view-post-right';

  const header=document.createElement('div'); header.className='post-seller-header';
  const avatar=document.createElement('img'); avatar.className='seller-header-avatar'; avatar.src=seller?.photoURL||"/index/img/default-avatar.png"; avatar.onerror=()=>avatar.src="/index/img/default-avatar.png"; avatar.loading="lazy";
  const info=document.createElement('div'); info.className='seller-header-info';
  const postedBy=document.createElement('p'); postedBy.className='posted-by'; postedBy.innerHTML=`Posted by <strong>${seller?.name||"Local Seller"}</strong>`;
  const postedOn=document.createElement('p'); postedOn.className='posted-on'; postedOn.textContent="Posted on Rhondda Noticeboard";
  const badges=document.createElement('div'); badges.className='seller-badges';
  if(seller?.isBusiness){ const b=document.createElement('span'); b.className='badge business'; b.textContent="Business"; badges.appendChild(b); }
  if(seller?.trusted){ const t=document.createElement('span'); t.className='badge trusted'; t.textContent="Trusted"; badges.appendChild(t); }
  const viewListingsBtn=document.createElement('button'); viewListingsBtn.className='view-listings-btn'; viewListingsBtn.textContent=`View all listings by ${seller?.name||"seller"}`; viewListingsBtn.onclick=()=>window.openSellerProfile(post.userId);
  info.append(postedBy,postedOn,badges,viewListingsBtn); header.append(avatar,info); right.appendChild(header);

  const h1=document.createElement('h1'); h1.textContent=post.title; right.appendChild(h1);
  if(post.price!==undefined){ const h2=document.createElement('h2'); h2.className='post-price'; h2.textContent=post.price===0?"FREE":`£${post.price}`; right.appendChild(h2); }
  const desc=document.createElement('p'); desc.className='view-post-desc'; desc.textContent=post.description; right.appendChild(desc);

  // META
  const meta=document.createElement('div'); meta.className='view-post-meta';
  ['category','subcategory','area'].forEach(f=>{ if(post[f]){ const p=document.createElement('p'); p.innerHTML=`<strong>${f.charAt(0).toUpperCase()+f.slice(1)}:</strong> ${post[f]}`; meta.appendChild(p); }});
  const pPosted=document.createElement('p'); pPosted.innerHTML=`<strong>Posted:</strong> ${post.createdAt?.toDate().toLocaleDateString()||"Unknown"}`;
  const pViews=document.createElement('p'); pViews.innerHTML=`<strong>Views:</strong> ${post.views?post.views+1:1}`;
  meta.append(pPosted,pViews); right.appendChild(meta);

  // CTA
  const engageBtn=document.createElement('button'); engageBtn.className='engage-btn'; engageBtn.textContent=`👍 I'm interested (${post.engagement||0})`; engageBtn.onclick=()=>window.engagePost(window.selectedPostId); right.appendChild(engageBtn);

  const actions=document.createElement('div'); actions.className='view-post-actions';
  if(isOwner){ const manageBtn=document.createElement('button'); manageBtn.className='secondary-btn'; manageBtn.textContent="Manage this ad in your dashboard"; manageBtn.onclick=navigateToDashboard; actions.appendChild(manageBtn); }
  const backBtn=document.createElement('button'); backBtn.className='secondary-btn'; backBtn.textContent="Back to home"; backBtn.onclick=navigateToHome; actions.appendChild(backBtn);
  right.appendChild(actions);

  layout.appendChild(right);
  container.appendChild(layout);

  setupGallery();
}

/* Gallery thumbnails */
function setupGallery(){
  const slides=document.querySelectorAll('.gallery-slide');
  const thumbs=document.querySelectorAll('.thumb-btn');
  thumbs.forEach(btn=>btn.addEventListener('click',()=>{
    const i=btn.dataset.index;
    slides.forEach(s=>s.style.display='none');
    slides[i].style.display='block';
    thumbs.forEach(t=>t.classList.remove('active')); btn.classList.add('active');
  }));
  if(slides.length) slides[0].style.display='block';
  if(thumbs.length) thumbs[0].classList.add('active');
}

/* Page navigation */
function showPage(pageId){ document.querySelectorAll('.view-post-page,.dashboard-page,.home-page').forEach(p=>p.style.display='none'); const page=document.getElementById(pageId); if(page) page.style.display='block'; }
function navigateToHome(){ showPage('homePage'); }
function navigateToDashboard(){ showPage('dashboardPage'); }

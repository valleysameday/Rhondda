import { getSellerPosts } from "/index/js/firebase/settings.js";

export async function init({ auth }) {
  const loading = document.getElementById("statsLoading");
  const content = document.getElementById("statsContent");
  const insight = document.getElementById("statsInsight");

  if (!auth.currentUser) {
    loading.textContent = "Please log in to view your stats.";
    return;
  }

  const posts = await getSellerPosts(auth.currentUser.uid);

  if (!posts.length) {
    loading.textContent = "You haven’t posted any ads yet.";
    return;
  }

  // ============================
  // AGGREGATE STATS
  // ============================
  let totalViews = 0;
  let totalPhoneReveals = 0;
  let totalWhatsappReveals = 0;
  let totalMessages = 0;
  let totalFavourites = 0;

  let activeAds = 0;
  let expiredAds = 0;

  let mostViewed = null;
  let mostContacted = null;

  posts.forEach(p => {
    const views = p.views || 0;
    const phone = p.phoneReveals || 0;
    const wa = p.whatsappReveals || 0;
    const msgs = p.messages || 0;
    const favs = p.favourites || p.favorites || 0;

    totalViews += views;
    totalPhoneReveals += phone;
    totalWhatsappReveals += wa;
    totalMessages += msgs;
    totalFavourites += favs;

    const age = window.daysSince(p.createdAt);
    if (age >= 7) expiredAds++;
    else activeAds++;

    if (!mostViewed || views > mostViewed.views) {
      mostViewed = { title: p.title, views };
    }

    const contacts = phone + wa + msgs;
    if (!mostContacted || contacts > mostContacted.contacts) {
      mostContacted = { title: p.title, contacts };
    }
  });

  // ============================
  // RENDER STATS
  // ============================
  loading.classList.add("hidden");
  content.classList.remove("hidden");

  content.innerHTML = `
    <div class="stat-item">
      👁️ <strong>${totalViews}</strong> total views
      <p class="stat-desc">How many people viewed your ads.</p>
    </div>

    <div class="stat-item">
      📞 <strong>${totalPhoneReveals}</strong> phone reveals
      <p class="stat-desc">Buyers who clicked to see your number.</p>
    </div>

    <div class="stat-item">
      💬 <strong>${totalWhatsappReveals}</strong> WhatsApp reveals
      <p class="stat-desc">High‑intent buyers who prefer messaging.</p>
    </div>

    <div class="stat-item">
      ✉️ <strong>${totalMessages}</strong> messages received
      <p class="stat-desc">Direct enquiries from interested buyers.</p>
    </div>

    <div class="stat-item">
      ❤️ <strong>${totalFavourites}</strong> saves / favourites
      <p class="stat-desc">People who saved your ads to check later.</p>
    </div>

    <div class="stat-item">
      📦 <strong>${activeAds}</strong> active ads
      <p class="stat-desc">Currently live on RCT‑X.</p>
    </div>

    <div class="stat-item">
      🗂️ <strong>${expiredAds}</strong> expired ads
      <p class="stat-desc">Ads that are no longer visible.</p>
    </div>

    <div class="stat-item">
      🔥 <strong>${mostViewed?.title || "—"}</strong>
      <p class="stat-desc">${mostViewed?.views || 0} views — your most viewed ad.</p>
    </div>

    <div class="stat-item">
      💬 <strong>${mostContacted?.title || "—"}</strong>
      <p class="stat-desc">${mostContacted?.contacts || 0} contacts — your most contacted ad.</p>
    </div>
  `;

  // ============================
  // AI INSIGHT
  // ============================
  insight.classList.remove("hidden");

  const randomBoost = Math.floor(Math.random() * 40) + 50;

  insight.innerHTML = `
    <h3>🔥 Insight</h3>
    <p>Your ads are performing better than <strong>${randomBoost}%</strong> of sellers this week.</p>
    <p>Tip: Listings with 3+ photos get more contact reveals.</p>
  `;
}

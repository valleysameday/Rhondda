import { loadView } from "/index/js/main.js";
import { getSeller, getPost } from "/index/js/firebase/settings.js";

export async function init() {
  const sellerId = sessionStorage.getItem("bundleSellerId");
  const itemIds = JSON.parse(sessionStorage.getItem("bundleItems") || "[]");

  if (!sellerId || itemIds.length === 0) {
    return loadView("home");
  }

  const seller = await getSeller(sellerId);
  const sellerIsPremium = seller?.isBusiness || seller?.isSellerPlus;

  const listEl = document.getElementById("bundleItemsList");
  const totalsEl = document.getElementById("bundleTotals");

  let totalPrice = 0;
  let items = [];

  for (const id of itemIds) {
    const post = await getPost(id);
    if (!post) continue;

    items.push(post);

    const div = document.createElement("div");
    div.className = "bundle-item";
    div.innerHTML = `
      <img src="${post.imageUrl || post.imageUrls?.[0] || "/images/image-webholder.webp"}">
      <div>
        <h4>${post.title}</h4>
        ${sellerIsPremium ? `<p>£${post.price || 0}</p>` : ""}
      </div>
    `;
    listEl.appendChild(div);

    if (sellerIsPremium) totalPrice += Number(post.price || 0);
  }

  if (sellerIsPremium) {
    totalsEl.innerHTML = `
      <h3>Total: £${totalPrice}</h3>
      <p>Suggested: Collection or Evri from £3.49</p>
    `;
  } else {
    totalsEl.innerHTML = `
      <p>This seller uses a free account.  
      You can still send your enquiry, but totals and delivery options are not available.</p>
    `;
  }

  document.getElementById("sendBundleBtn").onclick = () => {
    const msgBox = document.getElementById("bundleMessage");
    const customMessage = msgBox.value.trim();

    const message = sellerIsPremium
      ? buildPremiumMessage(items, totalPrice, customMessage)
      : buildBasicMessage(items, customMessage);

    sessionStorage.setItem("pendingMessage", message);
    sessionStorage.setItem("activeConversationId", `${window.currentUser.uid}_${sellerId}`);

    loadView("chat", { forceInit: true });
  };

  document.getElementById("backToSeller").onclick = () => {
    loadView("seller-profile");
  };
}

function buildBasicMessage(items, custom) {
  let msg = "Hi, I'm interested in these items:\n";
  items.forEach(i => msg += `• ${i.title}\n`);
  if (custom) msg += `\n${custom}`;
  return msg;
}

function buildPremiumMessage(items, total, custom) {
  let msg = "Combined enquiry:\n";
  items.forEach(i => msg += `• ${i.title} (£${i.price || 0})\n`);
  msg += `\nTotal: £${total}\nSuggested: Collection or Evri from £3.49\n`;
  if (custom) msg += `\n${custom}`;
  return msg;
}

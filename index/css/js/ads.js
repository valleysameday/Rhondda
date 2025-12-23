// /index/js/ads.js
export function openAd(ad) {
  window.currentAd = ad;
  document.getElementById("viewAdTitle").textContent = ad.title;
  document.getElementById("viewAdBody").textContent = ad.description;
  openModal("viewAdModal");
}

window.editAd = ad => {
  window.currentAd = ad;
  openModal("postModal");
};

window.repostAd = ad => {
  const repost = { ...ad, repostedAt: Date.now() };
  console.log("🔁 Reposting:", repost);
};

window.shareAd = ad => {
  const url = `${location.origin}/post/${ad.id}`;
  navigator.share
    ? navigator.share({ title: ad.title, url })
    : navigator.clipboard.writeText(url);
};

// subscription.js
import { db, auth, userData } from "./dashboard-hub.js";
import { showUpgradeModal, hideUpgradeModal } from "./modals.js";
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { AI } from "/index/js/ai/assistant.js";

export async function handleSubscription(newPlan) {
  const user = auth.currentUser; if(!user) return;

  if(newPlan==="business"){
    const now = Date.now();
    const expiresAt = now + 30*24*60*60*1000;
    userData.plan="business";
    userData.businessTrial={startedAt:now,expiresAt,active:true};
    await updateDoc(doc(db,"users",user.uid), {plan:"business", businessTrial:userData.businessTrial});
    AI.speak("TRIAL_STARTED", { name: user.displayName || "User" });
  } else if(newPlan==="sellerplus"){
    alert("Redirecting to secure payment for Seller+…");
    userData.plan="sellerplus";
    await updateDoc(doc(db,"users",user.uid), {plan:"sellerplus"});
    AI.speak("UPGRADED_SELLERPLUS", { name: user.displayName || "User" });
  } else if(newPlan==="free"){
    userData.plan="free";
    await updateDoc(doc(db,"users",user.uid), {plan:"free"});
  }

  // Re-render dashboard with AI triggers
  window.renderDashboard?.();
  hideUpgradeModal();
}

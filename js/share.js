export async function shareNotice(title, id) {
  const shareData = {
    title: `Rhondda Notice: ${title}`,
    text: `Check out this notice on the Rhondda Noticeboard:`,
    url: `your-site-name.netlify.app{id}`
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData); // Opens native phone share
    } else {
      // Fallback: Copy link to clipboard
      await navigator.clipboard.writeText(shareData.url);
      alert("Link copied to clipboard!");
    }
  } catch (err) {
    console.log("Error sharing:", err);
  }
}

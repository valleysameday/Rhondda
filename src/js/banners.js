document.addEventListener("DOMContentLoaded", () => {
  const scroller = document.getElementById("bannerScroll");

  let scrollAmount = 0;

  function autoScroll() {
    scrollAmount += 1;
    scroller.scrollTo({
      left: scrollAmount,
      behavior: "smooth"
    });

    if (scrollAmount >= scroller.scrollWidth - scroller.clientWidth) {
      scrollAmount = 0;
    }
  }

  setInterval(autoScroll, 40); // adjust speed here
});

export function scrollToPageTop(behavior: ScrollBehavior = "smooth") {
  requestAnimationFrame(() => {
    const scroller = document.querySelector(".app-grid-body");
    if (scroller instanceof HTMLElement) {
      scroller.scrollTo({ top: 0, behavior });
    }

    window.scrollTo({ top: 0, behavior });
    document.documentElement.scrollTo({ top: 0, behavior });
  });
}

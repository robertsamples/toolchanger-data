// Anchors from the plate point at collapsed <details> sections. Open the one
// being navigated to, otherwise the jump lands on a closed box.
function openHashTarget() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id.startsWith("type-")) return;
  const el = document.getElementById(id);
  if (el && el.tagName === "DETAILS") {
    el.open = true;
    el.scrollIntoView({ block: "start" });
  }
}
window.addEventListener("hashchange", openHashTarget);
document.addEventListener("DOMContentLoaded", openHashTarget);

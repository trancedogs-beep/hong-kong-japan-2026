(() => {
  const app = document.getElementById("app");
  if (!app) return;
  const MODE_KEY = "trip-view-mode-v2";
  const PREP_KEY = "trip-prep-v1";
  const modeButtons = [...document.querySelectorAll("[data-mode]")];
  const prepItems = [...document.querySelectorAll(".prep-item[data-id]")];

  function loadPrep() {
    try { const data = JSON.parse(localStorage.getItem(PREP_KEY) || "[]"); return new Set(Array.isArray(data) ? data : []); }
    catch { return new Set(); }
  }
  let completed = loadPrep();

  function currentMode() { return localStorage.getItem(MODE_KEY) === "yiyi" ? "yiyi" : "517"; }
  function updatePrepProgress() {
    const visible = currentMode() === "517" ? prepItems.filter(x => x.dataset.shared === "true") : prepItems;
    const done = visible.filter(x => completed.has(x.dataset.id)).length;
    document.getElementById("prep-done").textContent = done;
    document.getElementById("prep-total").textContent = visible.length;
  }
  function renderPrep() {
    prepItems.forEach(item => {
      const checked = completed.has(item.dataset.id);
      item.classList.toggle("done", checked);
      const input = item.querySelector("input"); if (input) input.checked = checked;
      const mark = item.querySelector(".checkmark"); if (mark) mark.textContent = checked ? "✓" : "";
    });
    updatePrepProgress();
  }
  function setMode(mode) {
    localStorage.setItem(MODE_KEY, mode);
    app.classList.toggle("view-517", mode === "517"); app.classList.toggle("view-yiyi", mode === "yiyi");
    modeButtons.forEach(btn => { const active = btn.dataset.mode === mode; btn.classList.toggle("active", active); btn.setAttribute("aria-pressed", String(active)); });
    if (mode === "517") document.querySelectorAll(".day-card.open").forEach(card => closeDay(card));
    updatePrepProgress();
  }
  function closeDay(card) { card.classList.remove("open"); const d=card.querySelector(".day-details"); if(d)d.hidden=true; const b=card.querySelector(".day-summary"); if(b)b.setAttribute("aria-expanded","false"); const x=card.querySelector(".expand"); if(x)x.textContent="+"; }
  function toggleDay(card) { if (currentMode() !== "yiyi") return; const open=card.classList.toggle("open"); const d=card.querySelector(".day-details"); if(d)d.hidden=!open; const b=card.querySelector(".day-summary"); if(b)b.setAttribute("aria-expanded",String(open)); const x=card.querySelector(".expand"); if(x)x.textContent=open?"−":"+"; }
  function filterCity(city) {
    document.querySelectorAll("[data-filter]").forEach(b=>b.classList.toggle("active",b.dataset.filter===city));
    document.querySelectorAll(".day-card[data-city]").forEach(card=>{card.hidden = city!=="全部" && card.dataset.city!==city;});
  }

  modeButtons.forEach(btn => btn.addEventListener("click", () => setMode(btn.dataset.mode)));
  document.getElementById("go-itinerary")?.addEventListener("click", () => document.getElementById("itinerary")?.scrollIntoView({behavior:"smooth"}));
  document.querySelectorAll("[data-filter]").forEach(btn => btn.addEventListener("click",()=>filterCity(btn.dataset.filter)));
  document.querySelectorAll(".city-door").forEach(a => a.addEventListener("click",()=>filterCity(a.dataset.city)));
  document.querySelectorAll(".day-card .day-summary").forEach(btn => btn.addEventListener("click",()=>toggleDay(btn.closest(".day-card"))));
  prepItems.forEach(item => item.querySelector("input")?.addEventListener("change",()=>{ const id=item.dataset.id; if(completed.has(id)) completed.delete(id); else completed.add(id); localStorage.setItem(PREP_KEY, JSON.stringify([...completed])); renderPrep(); }));

  setMode(currentMode()); renderPrep(); filterCity("全部");
  const day6=document.querySelector('.day-card[data-day="6"]'); if(day6 && currentMode()==="yiyi") toggleDay(day6);
})();
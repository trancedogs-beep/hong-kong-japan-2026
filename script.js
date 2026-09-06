(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const PREP_KEY = "trip-prep-v1";
  const ITINERARY_KEY = "trip-itinerary-board-v2";
  const prepItems = [...document.querySelectorAll(".prep-item[data-id]")];

  const defaultItems = [
    {id:"hk-flight-in",day:1,title:"HX253・TPE → HKG・14:15 抵達",type:"fixed"},
    {id:"page148-in",day:1,title:"Page 148・Check-in",type:"fixed"},
    {id:"united-hair",day:1,title:"United Hair Shop・21:30",type:"yiyi"},
    {id:"oi-man-sang",day:1,title:"愛文生・23:00",type:"unsure"},
    {id:"avenue-stars",day:1,title:"星光大道",type:"yiyi"},

    {id:"noc",day:2,title:"NOC Coffee",type:"yiyi"},
    {id:"bakehouse",day:2,title:"Bakehouse",type:"yiyi"},
    {id:"hashtag-b",day:2,title:"Hashtag B",type:"yiyi"},
    {id:"the24st",day:2,title:"THE 24 . ST・買伴手禮",type:"yiyi"},
    {id:"fine-foods",day:2,title:"帝苑餅店",type:"unsure"},
    {id:"kams",day:2,title:"甘牌燒鵝",type:"yiyi"},
    {id:"wong-to-yick",day:2,title:"黃道益活絡油",type:"yiyi"},
    {id:"soft-thunder",day:2,title:"Soft Thunder Bakery",type:"unsure"},

    {id:"fineprint",day:3,title:"FINEPRINT",type:"unsure"},
    {id:"tai-hang",day:3,title:"大坑",type:"unsure"},
    {id:"stanley",day:3,title:"赤柱廣場",type:"unsure"},
    {id:"le-petit",day:3,title:"Le Petit Salon",type:"unsure"},

    {id:"aus-dairy",day:4,title:"澳洲牛奶公司・07:30 起早餐",type:"yiyi"},
    {id:"hk-airport",day:4,title:"前往香港機場",type:"fixed"},
    {id:"hk-flight-out",day:4,title:"JX234・HKG → TPE・11:20",type:"fixed"},
    {id:"taipei-reset",day:4,title:"回台整理日本行李＋洗衣服",type:"fixed"},

    {id:"jp-flight-in",day:5,title:"JX820・TPE → KIX・12:15 抵達",type:"fixed"},
    {id:"park-front",day:5,title:"日本環球影城園前飯店・Check-in",type:"fixed"},
    {id:"ten-yen",day:5,title:"10元燒",type:"yiyi"},
    {id:"donki-dotonbori",day:5,title:"唐吉軻德",type:"yiyi"},
    {id:"muji",day:5,title:"無印良品",type:"yiyi"},
    {id:"bic-camera",day:5,title:"BIC CAMERA",type:"yiyi"},
    {id:"lush",day:5,title:"LUSH",type:"yiyi"},

    {id:"usj-fast",day:6,title:"USJ・快速通關攻略日",type:"fixed"},
    {id:"usj-nintendo",day:6,title:"超級任天堂世界",type:"yiyi"},
    {id:"usj-flying",day:6,title:"飛天翼龍",type:"yiyi"},
    {id:"usj-hollywood",day:6,title:"好萊塢美夢",type:"yiyi"},

    {id:"park-front-bag",day:7,title:"園前飯店退房・行李寄櫃檯",type:"fixed"},
    {id:"usj-chill",day:7,title:"USJ・無快速通關 Chill Day",type:"fixed"},
    {id:"usj-halloween",day:7,title:"Halloween／生日拍照",type:"yiyi"},
    {id:"leave-usj",day:7,title:"離開 USJ・領行李",type:"fixed"},
    {id:"chuan-in",day:7,title:"Chuan House Dotonbori・入住",type:"fixed"},

    {id:"osaka-kyoto",day:8,title:"大阪 → 京都",type:"fixed"},
    {id:"kishotei-in",day:8,title:"喜招邸 御所南・入住",type:"fixed"},
    {id:"kamogawa",day:8,title:"鴨川",type:"unsure"},
    {id:"lescamoteur",day:8,title:"L'Escamoteur",type:"unsure"},

    {id:"arashiyama",day:9,title:"嵐山",type:"unsure"},
    {id:"togetsukyo",day:9,title:"渡月橋",type:"unsure"},
    {id:"kyoto-osaka",day:9,title:"京都 → 大阪・回 Chuan House",type:"fixed"},

    {id:"seam-osaka",day:10,title:"大阪 SEAM",type:"unsure"},

    {id:"last-shopping",day:11,title:"最後採買／逛街",type:"unsure"},
    {id:"kix-transfer",day:11,title:"前往關西機場",type:"fixed"},
    {id:"jp-flight-out",day:11,title:"JX823・KIX → TPE・15:10",type:"fixed"}
  ];

  function cloneDefaults() { return defaultItems.map(item => ({...item})); }
  function loadItinerary() {
    try {
      const saved = JSON.parse(localStorage.getItem(ITINERARY_KEY) || "null");
      if (Array.isArray(saved) && saved.length) return saved;
    } catch {}
    return cloneDefaults();
  }
  let itinerary = loadItinerary();

  function saveItinerary() { localStorage.setItem(ITINERARY_KEY, JSON.stringify(itinerary)); }
  function typeLabel(type) {
    return {fixed:"固定", yiyi:"一一必去", unsure:"自由更動", f517:"517 必去"}[type] || "行程";
  }
  function renderItinerary() {
    document.querySelectorAll(".trip-dropzone").forEach(zone => zone.innerHTML = "");
    itinerary.forEach(item => {
      const zone = document.querySelector(`.trip-dropzone[data-day="${item.day}"]`);
      if (!zone) return;
      const card = document.createElement("div");
      card.className = `trip-item trip-item-${item.type}`;
      card.dataset.id = item.id;
      card.draggable = item.type !== "fixed";
      card.innerHTML = `<span class="trip-grip" aria-hidden="true">${item.type === "fixed" ? "●" : "⠿"}</span><span class="trip-item-copy"><small>${typeLabel(item.type)}</small><strong></strong></span>${item.type === "fixed" ? "" : '<button class="trip-remove" type="button" aria-label="刪除行程">×</button>'}`;
      card.querySelector("strong").textContent = item.title;
      zone.appendChild(card);
    });
    bindTripItems();
  }

  let draggingId = null;
  function bindTripItems() {
    document.querySelectorAll('.trip-item[draggable="true"]').forEach(card => {
      card.addEventListener("dragstart", event => {
        draggingId = card.dataset.id;
        card.classList.add("dragging");
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", draggingId);
      });
      card.addEventListener("dragend", () => { draggingId = null; card.classList.remove("dragging"); document.querySelectorAll(".trip-dropzone").forEach(z=>z.classList.remove("drag-over")); });
    });
    document.querySelectorAll(".trip-remove").forEach(button => button.addEventListener("click", () => {
      const id = button.closest(".trip-item")?.dataset.id;
      itinerary = itinerary.filter(item => item.id !== id);
      saveItinerary(); renderItinerary();
    }));
  }

  document.querySelectorAll(".trip-dropzone").forEach(zone => {
    zone.addEventListener("dragover", event => { if (!draggingId) return; event.preventDefault(); zone.classList.add("drag-over"); });
    zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
    zone.addEventListener("drop", event => {
      event.preventDefault(); zone.classList.remove("drag-over");
      const id = draggingId || event.dataTransfer.getData("text/plain");
      const item = itinerary.find(x => x.id === id);
      if (!item || item.type === "fixed") return;
      item.day = Number(zone.dataset.day);
      saveItinerary(); renderItinerary();
    });
  });

  document.getElementById("add-trip-item")?.addEventListener("submit", event => {
    event.preventDefault();
    const titleInput = document.getElementById("trip-item-title");
    const title = titleInput.value.trim();
    if (!title) return;
    itinerary.push({
      id:`custom-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      day:Number(document.getElementById("trip-item-day").value),
      title,
      type:document.getElementById("trip-item-type").value
    });
    saveItinerary(); renderItinerary(); titleInput.value = ""; titleInput.focus();
  });

  document.getElementById("reset-trip-items")?.addEventListener("click", () => {
    if (!window.confirm("要把行程板恢復成網站預設版本嗎？你在這台裝置上的拖曳與新增會被清掉。")) return;
    itinerary = cloneDefaults(); saveItinerary(); renderItinerary();
  });

  function loadPrep() {
    try { const data = JSON.parse(localStorage.getItem(PREP_KEY) || "[]"); return new Set(Array.isArray(data) ? data : []); }
    catch { return new Set(); }
  }
  let completed = loadPrep();
  function renderPrep() {
    prepItems.forEach(item => {
      const checked = completed.has(item.dataset.id);
      item.classList.toggle("done", checked);
      const input = item.querySelector("input"); if (input) input.checked = checked;
      const mark = item.querySelector(".checkmark"); if (mark) mark.textContent = checked ? "✓" : "";
    });
    const done = prepItems.filter(x => completed.has(x.dataset.id)).length;
    const doneEl = document.getElementById("prep-done"); const totalEl = document.getElementById("prep-total");
    if (doneEl) doneEl.textContent = done; if (totalEl) totalEl.textContent = prepItems.length;
  }
  prepItems.forEach(item => item.querySelector("input")?.addEventListener("change",()=>{
    const id=item.dataset.id; if(completed.has(id)) completed.delete(id); else completed.add(id);
    localStorage.setItem(PREP_KEY, JSON.stringify([...completed])); renderPrep();
  }));

  function filterCity(city) {
    document.querySelectorAll("[data-filter]").forEach(b=>b.classList.toggle("active",b.dataset.filter===city));
    document.querySelectorAll(".trip-day[data-city]").forEach(card=>{card.hidden = city!=="全部" && card.dataset.city!==city;});
  }
  document.querySelectorAll("[data-filter]").forEach(btn => btn.addEventListener("click",()=>filterCity(btn.dataset.filter)));
  document.querySelectorAll(".city-door").forEach(a => a.addEventListener("click",()=>filterCity(a.dataset.city)));
  document.getElementById("go-itinerary")?.addEventListener("click", () => document.getElementById("itinerary")?.scrollIntoView({behavior:"smooth"}));

  renderItinerary(); renderPrep(); filterCity("全部");
})();
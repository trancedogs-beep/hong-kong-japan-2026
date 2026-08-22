"use client";

import { useMemo, useState, useSyncExternalStore } from "react";

type City = "香港" | "大阪" | "京都";
type Status = "已確定" | "方向確定" | "候選" | "待確認";
type Day = { day: number; date: string; weekday: string; city: City; title: string; status: Status; summary: string; highlights: string[]; note?: string };
type PrepItem = { id: string; title: string; detail: string; category: "票券與預約" | "金流與網路" | "資料確認"; shared?: boolean };

const days: Day[] = [
  { day: 1, date: "09.12", weekday: "六", city: "香港", title: "抵達香港・維港初夜", status: "方向確定", summary: "14:15 抵達，入住 Page148 後用最舒服的步調迎接旅行。", highlights: ["尖沙咀散步", "星光大道", "維多利亞港夜景"], note: "累的話直接飯店附近吃飯，維港移到 Day 2。" },
  { day: 2, date: "09.13", weekday: "日", city: "香港", title: "港島散步・蛋塔與咖啡", status: "候選", summary: "從新派蛋塔、NOC 咖啡走進中上環街區。", highlights: ["Bakehouse / Hashtag B", "NOC Coffee", "PMQ・中上環", "甘牌燒鵝"], note: "兩人食量小，蛋塔、咖啡、燒鵝不要排太密。" },
  { day: 3, date: "09.14", weekday: "一", city: "香港", title: "深水埗・傳統香港", status: "候選", summary: "拍照、逛街與大排檔，保留一段自由時間。", highlights: ["深水埗", "愛文生", "K11 MUSEA"], note: "雨天改為商場與咖啡店路線。" },
  { day: 4, date: "09.15", weekday: "二", city: "香港", title: "香港收尾・回台北", status: "已確定", summary: "11:20 從香港起飛，13:20 抵達台北；早餐與退房都要留足時間。", highlights: ["Page148 退房", "JX234", "11:20 HKG → 13:20 TPE"], note: "不是香港直飛大阪；今晚回台北，隔天早上再飛大阪。" },
  { day: 5, date: "09.16", weekday: "三", city: "大阪", title: "抵達大阪・USJ 前夜", status: "已確定", summary: "08:30 從台北起飛，12:15 抵達關西機場，入住園前飯店後提早休息。", highlights: ["JX820", "08:30 TPE → 12:15 KIX", "園前飯店", "票券與 App 檢查"], note: "抵達後不塞景點，以入住、補用品和隔日 USJ 準備為主。" },
  { day: 6, date: "09.17", weekday: "四", city: "大阪", title: "USJ 高強度攻略日", status: "已確定", summary: "早到直衝任天堂世界，搭配已購快速通關完成核心設施。", highlights: ["超級任天堂世界", "飛天翼龍", "好萊塢美夢", "哈利波特夜景"], note: "開園前 1–1.5 小時抵達；晚上再看園區夜景。" },
  { day: 7, date: "09.18", weekday: "五", city: "大阪", title: "生日・USJ 輕鬆拍", status: "方向確定", summary: "不追求全制霸，拍照、補遺與生日感優先。", highlights: ["魔法師風穿搭", "芙莉蓮候選", "周邊補買", "移動道頓堀"], note: "晚間入住 Chuan House Dotonbori。" },
  { day: 8, date: "09.19", weekday: "六", city: "京都", title: "住進京都・慢慢探險", status: "方向確定", summary: "睡飽後輕裝前往京都，以南禪寺、鴨川為骨架自由散步。", highlights: ["南禪寺・湯豆腐", "鴨川", "木屋町・酒吧", "京都生活感"], note: "入住 Kyohotel Kishotei Goshominami；大阪房間與大件行李照常保留。" },
  { day: 9, date: "09.20", weekday: "日", city: "京都", title: "嵐山・渡月橋", status: "方向確定", summary: "從京都出發去嵐山；渡月橋是錨點，實際玩法留給 517 帶路與現場探索。", highlights: ["渡月橋", "嵐山自由探索", "細節待 517 決定", "天黑前回到安全區域"], note: "不搭嵯峨野觀光小火車。最重要的安全線：天黑前離開山區，或回到車站、商店街等人多且交通明確的地方，再返回大阪。" },
  { day: 10, date: "09.21", weekday: "一", city: "大阪", title: "大阪自由日", status: "方向確定", summary: "京都回來後留一個完整的大阪日，依體力自由安排。", highlights: ["難波", "心齋橋", "採買", "咖啡與散步"], note: "Silver Week 假期中，不安排必須精準趕場的行程。" },
  { day: 11, date: "09.22", weekday: "二", city: "大阪", title: "回程", status: "已確定", summary: "15:10 從關西機場起飛，17:05 抵達台北；上午只排最後採買。", highlights: ["JX823", "15:10 KIX → 17:05 TPE", "整理行李", "前往機場"], note: "需依國際線報到時間倒推離開大阪市區的時間。" },
];

const decisions = [
  { title: "京都路線骨架", detail: "9/19 南禪寺與鴨川、9/20 嵐山與渡月橋；細節保留現場選擇。", who: "已定方向", tone: "kyoto" },
  { title: "USJ 入場券", detail: "USJ Studio Pass 已完成購買；9/17 快速通關也已備妥。", who: "已購", tone: "osaka" },
  { title: "星星桶版本", detail: "只想買五週年新版，兌換券是否保證指定版本待核實。", who: "行前查證", tone: "hongkong" },
  { title: "香港必吃排序", detail: "Bakehouse、Hashtag B、甘牌、愛文生，不需要每家都吃。", who: "517 Review", tone: "hongkong" },
];
const prepItems: PrepItem[] = [
  { id: "flights", title: "確認航班行李與報到時間", detail: "四段航班時間已補齊；再確認行李額度與各段建議抵達機場時間。", category: "資料確認", shared: true },
  { id: "usj-pass", title: "USJ 入場券已完成購買", detail: "Studio Pass 與 9/17 快速通關皆已購買完成。", category: "票券與預約", shared: true },
  { id: "currency", title: "準備港幣與付款方式", detail: "決定要在台灣先換多少港幣，並確認香港刷卡、電子支付與備用現金。", category: "金流與網路", shared: true },
  { id: "internet", title: "安排香港／日本 eSIM", detail: "由 517 處理購買；完成後補上方案與實際金額。", category: "金流與網路", shared: true },
  { id: "passport", title: "檢查護照與訂房姓名", detail: "確認效期、機票與四間住宿的英文姓名一致。", category: "資料確認" },
  { id: "offline", title: "離線保存重要憑證", detail: "將機票、住宿、USJ 票券及保險資料存到手機，避免現場網路不穩。", category: "資料確認" },
  { id: "insurance", title: "確認旅平險／不便險", detail: "確認保障期間完整涵蓋 9/12–9/22 與香港、日本兩地。", category: "票券與預約" },
  { id: "airport-routes", title: "確認三段機場交通", detail: "台灣出發、香港機場往返，以及大阪機場往返住宿的移動方式。", category: "資料確認" },
];
const cityFilters = ["全部", "香港", "大阪", "京都"] as const;
type ViewMode = "yiyi" | "517";

const subscribeToViewMode = (onStoreChange: () => void) => {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === "trip-view-mode-v2") onStoreChange();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener("trip-view-mode-change", onStoreChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("trip-view-mode-change", onStoreChange);
  };
};

const getViewMode = (): ViewMode => {
  const saved = window.localStorage.getItem("trip-view-mode-v2");
  return saved === "yiyi" ? "yiyi" : "517";
};
const subscribeToPrep = (onStoreChange: () => void) => {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === "trip-prep-v1") onStoreChange();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener("trip-prep-change", onStoreChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("trip-prep-change", onStoreChange);
  };
};
const getPrep = () => window.localStorage.getItem("trip-prep-v1") ?? "[]";

export default function Home() {
  const [city, setCity] = useState<(typeof cityFilters)[number]>("全部");
  const [expanded, setExpanded] = useState<number | null>(6);
  const mode = useSyncExternalStore(subscribeToViewMode, getViewMode, () => "517");
  const prepSnapshot = useSyncExternalStore(subscribeToPrep, getPrep, () => "[]");
  const completedPrep = useMemo(() => {
    try {
      const parsed = JSON.parse(prepSnapshot);
      return new Set<string>(Array.isArray(parsed) ? parsed : []);
    } catch {
      return new Set<string>();
    }
  }, [prepSnapshot]);
  const visiblePrep = mode === "517" ? prepItems.filter((item) => item.shared) : prepItems;
  const prepProgress = visiblePrep.filter((item) => completedPrep.has(item.id)).length;
  const filteredDays = useMemo(() => city === "全部" ? days : days.filter((item) => item.city === city), [city]);
  const scrollToItinerary = () => document.getElementById("itinerary")?.scrollIntoView({ behavior: "smooth" });
  const changeMode = (next: ViewMode) => {
    setExpanded(null);
    window.localStorage.setItem("trip-view-mode-v2", next);
    window.dispatchEvent(new Event("trip-view-mode-change"));
  };
  const togglePrep = (id: string) => {
    const next = new Set(completedPrep);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    window.localStorage.setItem("trip-prep-v1", JSON.stringify([...next]));
    window.dispatchEvent(new Event("trip-prep-change"));
  };

  return (
    <main className={`view-${mode}`}>
      <header className="topbar">
        <a className="brand" href="#top"><span className="brand-mark">HK ⇢ JP</span><span>香港日本行 <i>2026</i></span></a>
        <nav aria-label="主要導覽"><a href="#overview">行程總覽</a><a href="#transport">交通</a><a href="#itinerary">每日行程</a><a href="#prep">行前準備</a><a className="yiyi-only" href="#usj">USJ</a><a className="yiyi-only" href="#decisions">待決定</a><a href="/money">錢錢</a></nav>
        <a className="mobile-money-link" href="/money" aria-label="查看旅費">錢錢</a><div className="mode-switch" role="group" aria-label="切換旅行頁面模式"><button className={mode === "517" ? "active" : ""} onClick={() => changeMode("517")} aria-pressed={mode === "517"}>517</button><button className={mode === "yiyi" ? "active" : ""} onClick={() => changeMode("yiyi")} aria-pressed={mode === "yiyi"}>一一</button></div>
      </header>

      <section className="hero" id="top">
        <div className="hero-glow" />
        <div className="hero-content">
          <p className="eyebrow"><span>HONG KONG</span><b>·</b><span>OSAKA</span><b>·</b><span>KYOTO</span></p>
          <h1>香港日本行 <em>2026</em></h1>
          <div className="trip-date">09.12 — 09.22</div>
          <p className="hero-copy"><span className="mode-copy mode-copy-517">香港、大阪與京都。重要資訊、住宿和大致行程都在這裡。</span><span className="mode-copy mode-copy-yiyi">11 天，從維港霓虹走進大阪魔法世界，最後在京都慢慢散步。</span></p>
          <div className="hero-actions"><button onClick={scrollToItinerary}>查看每日行程</button><a className="ghost-link yiyi-only" href="#decisions">待決定事項 →</a></div>
        </div>
        <aside className="trip-panel"><div className="panel-heading"><span>TRIP AT A GLANCE</span><strong>11 DAYS</strong></div><div className="route-line"><div><b>HKG</b><span>09.12 — 09.15</span></div><i>→</i><div><b>TPE</b><span>09.15 — 09.16</span></div><i>→</i><div><b>KIX</b><span>09.16 — 09.22</span></div></div><p>香港 3 晚・大阪 6 晚・京都 1 晚</p></aside>
      </section>

      <section className="section" id="overview"><div className="section-heading"><p>OVERVIEW</p><h2>行程總覽</h2></div><div className="city-doors"><a href="#itinerary" onClick={() => setCity("香港")}><span>01</span><b>香港</b><small>09.12 — 09.15</small></a><a href="#itinerary" onClick={() => setCity("大阪")}><span>02</span><b>大阪</b><small>09.16 — 09.22</small></a><a href="#itinerary" onClick={() => setCity("京都")}><span>03</span><b>京都</b><small>09.19 — 09.20</small></a></div></section>

      <section className="section transport" id="transport"><div className="section-heading"><p>TRANSPORT</p><h2>交通</h2></div><div className="transport-grid"><article><small>09.12</small><h3>TPE → HKG</h3><p>香港航空 HX253</p><b>12:15 → 14:15</b></article><article><small>09.15</small><h3>HKG → TPE</h3><p>星宇航空 JX234</p><b>11:20 → 13:20</b></article><article><small>09.16</small><h3>TPE → KIX</h3><p>星宇航空 JX820</p><b>08:30 → 12:15</b></article><article><small>09.22</small><h3>KIX → TPE</h3><p>星宇航空 JX823</p><b>15:10 → 17:05</b></article></div></section>

      <section className="section itinerary" id="itinerary"><div className="section-heading split"><div><p>DAY BY DAY</p><h2>每日行程</h2></div><div className="filters">{cityFilters.map((item) => <button key={item} className={city === item ? "active" : ""} onClick={() => setCity(item)}>{item}</button>)}</div></div><div className="day-list">{filteredDays.map((item) => <article key={item.day} className={`day-card ${expanded === item.day ? "expanded" : ""}`}><button className="day-card-main" onClick={() => setExpanded(expanded === item.day ? null : item.day)}><div className="day-number"><small>DAY</small><strong>{String(item.day).padStart(2,"0")}</strong></div><div className="day-date"><b>{item.date}</b><span>週{item.weekday}・{item.city}</span></div><div className="day-title"><h3>{item.title}</h3><p>{item.summary}</p></div><span className={`status ${item.status}`}>{item.status}</span><i>{expanded === item.day ? "−" : "+"}</i></button>{expanded === item.day && <div className="day-detail"><div>{item.highlights.map((h) => <span key={h}>{h}</span>)}</div>{item.note && <p>{item.note}</p>}</div>}</article>)}</div></section>

      <section className="section prep" id="prep"><div className="section-heading split"><div><p>BEFORE WE GO</p><h2>行前準備</h2></div><span>{prepProgress} / {visiblePrep.length} 完成</span></div><div className="prep-grid">{visiblePrep.map((item) => <article key={item.id} className={completedPrep.has(item.id) ? "done" : ""}><button onClick={() => togglePrep(item.id)} aria-pressed={completedPrep.has(item.id)}><span>{completedPrep.has(item.id) ? "✓" : ""}</span><div><small>{item.category}</small><h3>{item.title}</h3><p>{item.detail}</p></div></button></article>)}</div></section>

      <section className="section usj yiyi-only" id="usj"><div className="section-heading"><p>UNIVERSAL STUDIOS JAPAN</p><h2>USJ</h2></div><div className="usj-grid"><article><small>DAY 6・09.17</small><h3>高強度攻略日</h3><p>開園前 1–1.5 小時抵達，直衝任天堂世界；快速通關完成核心設施，晚上看哈利波特夜景。</p></article><article><small>DAY 7・09.18</small><h3>生日・輕鬆拍</h3><p>拍照、補買周邊與芙莉蓮候選；不追求全制霸。</p></article><aside><b>已購</b><p>Express Pass 8・Minecart &amp; Flying Dinosaur Special</p></aside></div></section>

      <section className="section decisions yiyi-only" id="decisions"><div className="section-heading"><p>OPEN ITEMS</p><h2>待決定</h2></div><div className="decision-grid">{decisions.map((item) => <article key={item.title} className={item.tone}><small>{item.who}</small><h3>{item.title}</h3><p>{item.detail}</p></article>)}</div></section>

      <footer><span>HK ⇢ JP</span><p>香港日本行 2026</p></footer>
    </main>
  );
}

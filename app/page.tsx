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
  { title: "USJ 入場券", detail: "9/17 快速通關已買；尚缺 Studio Pass，8/16 開放後購買。", who: "8/16 買票", tone: "osaka" },
  { title: "星星桶版本", detail: "只想買五週年新版，兌換券是否保證指定版本待核實。", who: "行前查證", tone: "hongkong" },
  { title: "香港必吃排序", detail: "Bakehouse、Hashtag B、甘牌、愛文生，不需要每家都吃。", who: "517 Review", tone: "hongkong" },
];
const prepItems: PrepItem[] = [
  { id: "flights", title: "確認航班行李與報到時間", detail: "四段航班時間已補齊；再確認行李額度與各段建議抵達機場時間。", category: "資料確認", shared: true },
  { id: "usj-pass", title: "8/16 購買 USJ 入場券", detail: "9/17 快速通關已購，尚缺 Studio Pass；8/16 開放後購買。", category: "票券與預約", shared: true },
  { id: "currency", title: "準備港幣與付款方式", detail: "決定要在台灣先換多少港幣，並確認香港刷卡、電子支付與備用現金。", category: "金流與網路", shared: true },
  { id: "internet", title: "安排香港／日本網路", detail: "比較 eSIM、SIM 卡或漫遊方案，確認 517 與一一各自的網路需求。", category: "金流與網路", shared: true },
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
        <div className="mode-switch" role="group" aria-label="切換旅行頁面模式"><button className={mode === "517" ? "active" : ""} onClick={() => changeMode("517")} aria-pressed={mode === "517"}>517</button><button className={mode === "yiyi" ? "active" : ""} onClick={() => changeMode("yiyi")} aria-pressed={mode === "yiyi"}>一一</button></div>
      </header>

      <section className="hero" id="top">
        <div className="hero-glow" />
        <div className="hero-content">
          <p className="eyebrow"><span>HONG KONG</span><b>·</b><span>OSAKA</span><b>·</b><span>KYOTO</span></p>
          <h1>香港日本行 <em>2026</em></h1>
          <div className="trip-date">09.12 — 09.22</div>
          <p className="hero-copy"><span className="mode-copy mode-copy-517">香港、大阪與京都。重要資訊、住宿和大致行程都在這裡。</span><span className="mode-copy mode-copy-yiyi">11 天，從維港霓虹走進大阪魔法世界，最後在京都慢慢散步。</span></p>
          <div className="hero-actions"><button onClick={scrollToItinerary}>查看每日行程 <span>↓</span></button><a className="yiyi-only" href="#decisions">待確認事項</a></div>
        </div>
        <aside className="trip-panel" aria-label="旅程摘要">
          <div className="panel-heading"><span className="calendar-icon">✦</span><div><strong>11 天旅程</strong><small>香港・大阪・京都</small></div></div>
          <div className="progress-label"><span>旅程進度</span><b>規劃中</b></div><div className="progress"><i /></div>
          <div className="city-doors">
            <a className="hongkong" href="#itinerary" onClick={() => setCity("香港")}><small>DAY 01—04</small><b>香港</b><span>城市・咖啡・夜景</span></a>
            <a className="osaka" href="#itinerary" onClick={() => setCity("大阪")}><small>DAY 05—07・10—11</small><b>大阪</b><span>USJ・道頓堀</span></a>
            <a className="kyoto" href="#itinerary" onClick={() => setCity("京都")}><small>DAY 08—09</small><b>京都</b><span>古都・散步・探險</span></a>
          </div>
        </aside>
      </section>

      <section className="overview section" id="overview">
        <div className="section-heading"><p>TRIP OVERVIEW</p><h2>三座城市，三種旅行節奏</h2><span className="yiyi-only">這是旅行骨架：確定的先放好，還沒決定的誠實標記。</span></div>
        <div className="route-line">
          <article className="route-stop hongkong"><i>01</i><div><strong>香港</strong><span>9/12 — 9/15</span></div></article><div className="route-connector"><span>✈</span></div>
          <article className="route-stop osaka"><i>02</i><div><strong>大阪</strong><span>9/16 — 9/22・住宿基地</span></div></article><div className="route-connector"><span>↗</span></div>
          <article className="route-stop kyoto"><i>03</i><div><strong>京都</strong><span>9/19 — 9/20・兩天一夜</span></div></article>
        </div>
        <div className="stay-strip">
          <div><span>香港住宿</span><strong>Page 148, 晉緻酒店</strong><small>9/12 — 9/15</small></div>
          <div><span>USJ 住宿</span><strong>日本環球影城園前飯店</strong><small>9/16 — 9/18</small></div>
          <div><span>大阪住宿・全程保留</span><strong>Chuan House Dotonbori</strong><small>9/18 — 9/22</small></div>
          <div className="stay-overlap"><span>京都住宿・額外一晚</span><strong>Kyohotel Kishotei Goshominami</strong><small>9/19 — 9/20</small><em>與大阪住宿重疊是刻意安排</em></div>
        </div>
      </section>

      <section className="transport section" id="transport">
        <div className="section-heading"><p>FLIGHTS & TRANSPORT</p><h2>航班與主要移動</h2><span className="yiyi-only">先保留必要的移動骨架；班次與細節確認後再補，不用現在把每一站綁死。</span></div>
        <div className="transport-grid flights-grid">
          <article><small>09.12・HX253・香港航空</small><strong>台北 TPE → 香港 HKG</strong><span><b>12:15</b> 起飛　→　<b>14:15</b> 抵達</span></article>
          <article><small>09.15・JX234・星宇航空</small><strong>香港 HKG → 台北 TPE</strong><span><b>11:20</b> 起飛　→　<b>13:20</b> 抵達</span></article>
          <article><small>09.16・JX820・星宇航空</small><strong>台北 TPE → 大阪 KIX</strong><span><b>08:30</b> 起飛　→　<b>12:15</b> 抵達</span></article>
          <article><small>09.22・JX823・星宇航空</small><strong>大阪 KIX → 台北 TPE</strong><span><b>15:10</b> 起飛　→　<b>17:05</b> 抵達</span></article>
          <article className="rail-card"><small>09.19–20・京都</small><strong>大阪 ⇄ 京都</strong><span>輕裝移動，不帶大件行李</span></article>
        </div>
      </section>

      <section className="itinerary section" id="itinerary">
        <div className="section-heading split"><div><p>DAILY ITINERARY</p><h2>每日行程</h2></div><span className="yiyi-only">點開卡片查看細節、備案與安全線</span></div>
        <div className="filters" role="group" aria-label="依城市篩選">{cityFilters.map((item) => <button key={item} className={city === item ? "active" : ""} onClick={() => setCity(item)}>{item}</button>)}</div>
        <div className="day-list">{filteredDays.map((item) => {
          const open = expanded === item.day;
          return <article className={`day-card ${item.city === "香港" ? "hongkong" : item.city === "大阪" ? "osaka" : "kyoto"} ${open ? "open" : ""}`} key={item.day}>
            <button className="day-summary" onClick={() => mode === "yiyi" && setExpanded(open ? null : item.day)} aria-expanded={mode === "yiyi" && open}>
              <span className="day-date">{item.date}<small>星期{item.weekday}</small></span><span className="day-number"><small>DAY</small>{String(item.day).padStart(2, "0")}</span>
              <span className="day-main"><small>{item.city}</small><strong>{item.title}</strong><em>{item.summary}</em></span><span className={`status status-${item.status}`}>{item.status}</span><span className="expand yiyi-only">{open ? "−" : "+"}</span>
            </button>
            {mode === "yiyi" && open && <div className="day-details"><div className="chips">{item.highlights.map((x) => <span key={x}>{x}</span>)}</div>{item.note && <p><b>NOTE</b>{item.note}</p>}</div>}
          </article>;
        })}</div>
      </section>

      <section className="prep section" id="prep">
        <div className="section-heading split">
          <div><p>BEFORE THE TRIP</p><h2>行前準備 Checklist</h2></div>
          <div className="prep-progress" aria-label={`已完成 ${prepProgress} 項，共 ${visiblePrep.length} 項`}><strong>{prepProgress}<small> / {visiblePrep.length}</small></strong><span>已完成</span></div>
        </div>
        <p className="prep-intro mode-copy mode-copy-517">先一起確認會影響行程的四件事；打包用品之後再整理。</p>
        <p className="prep-intro mode-copy mode-copy-yiyi">目前先列需要提前處理、會影響行程的事項。衣物、充電線與保養品等打包清單，接近出發時再加入。</p>
        <div className="prep-list">{visiblePrep.map((item) => {
          const done = completedPrep.has(item.id);
          return <label className={`prep-item ${done ? "done" : ""}`} key={item.id}>
            <input type="checkbox" checked={done} onChange={() => togglePrep(item.id)} />
            <span className="checkmark" aria-hidden="true">{done ? "✓" : ""}</span>
            <span className="prep-copy"><small>{item.category}</small><strong>{item.title}</strong><em className="yiyi-only">{item.detail}</em></span>
          </label>;
        })}</div>
        <p className="prep-note yiyi-only">勾選進度會記在目前裝置；換一台電腦或瀏覽器時不會自動同步。</p>
      </section>

      <section className="usj section yiyi-only" id="usj">
        <div className="usj-copy"><p>UNIVERSAL STUDIOS JAPAN</p><h2>兩日攻略，一天衝刺、一天過生日。</h2><span>9/17 用快速通關完成核心目標；9/18 把力氣留給拍照、補遺與喜歡的周邊。</span></div>
        <div className="usj-grid">
          <article><small>DAY 06・策略日</small><h3>開園前 1–1.5 小時到</h3><ul><li>直衝超級任天堂世界</li><li>能量手環與小遊戲</li><li>飛天翼龍・好萊塢美夢</li><li>晚上補任天堂與哈利波特夜景</li></ul></article>
          <article><small>DAY 07・生日</small><h3>不用再跟時間賽跑</h3><ul><li>魔法師風穿搭拍照</li><li>芙莉蓮餐飲候選</li><li>補買前一天猶豫的周邊</li><li>晚間移動至道頓堀</li></ul></article>
          <aside><span>CHECK</span><strong>星星爆米花桶</strong><p>只買五週年新版。版本與兌換券規則尚未核實。</p></aside>
        </div>
      </section>

      <section className="decisions section yiyi-only" id="decisions">
        <div className="section-heading"><p>REVIEW TOGETHER</p><h2>接下來，只要決定這幾題</h2><span>不用一次把整趟旅程規劃完；先解掉會影響訂房與買票的選項。</span></div>
        <div className="decision-grid">{decisions.map((item, index) => <article className={item.tone} key={item.title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{item.title}</h3><p>{item.detail}</p><small>{item.who}</small></article>)}</div>
      </section>
      <footer><div><strong>香港日本行 2026</strong><span>航班與錢錢更新・2026.08.09</span></div><p className="yiyi-only">四間住宿與四段航班已確認；USJ 入場券 8/16 開買。</p><p className="mode-copy mode-copy-517">一一 × 517</p></footer>
    </main>
  );
}

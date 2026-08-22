const hotels = [
  { name: "Page 148, 晉緻酒店", date: "9/12–9/15・香港", amount: 17823 },
  { name: "日本環球影城園前飯店", date: "9/16–9/18・大阪", amount: 10646 },
  { name: "Chuan House Dotonbori", date: "9/18–9/22・大阪", amount: 16523 },
  { name: "Kyohotel Kishotei Goshominami", date: "9/19–9/20・京都", amount: 5041 },
];

const currency = (amount: number) => `NT$ ${amount.toLocaleString("zh-TW")}`;
const hotelTotal = hotels.reduce((sum, item) => sum + item.amount, 0);
const hongKongOutboundFlight = 8139;
const fourSegmentFlight = 22760;
const flightTotal = hongKongOutboundFlight + fourSegmentFlight;
const confirmedTotal = hotelTotal + flightTotal + 11090;

export default function MoneyPage() {
  return (
    <main className="money-page">
      <header className="money-topbar">
        <a className="money-back" href="/">← 回旅行頁</a>
        <span>香港日本行 2026</span>
      </header>

      <section className="money-hero">
        <p>TRIP BUDGET</p>
        <h1>錢錢去哪裡了</h1>
        <span>兩人份・目前已知支出</span>
        <div className="money-total">
          <small>目前已確認支出</small>
          <strong>{currency(confirmedTotal)}</strong>
          <em>飯店、兩筆機票訂單與 USJ 快速通關券</em>
        </div>
      </section>

      <section className="money-content">
        <div className="money-section-heading"><div><p>STAYS</p><h2>飯店</h2></div><strong>{currency(hotelTotal)}</strong></div>
        <div className="expense-list">
          {hotels.map((hotel) => <article key={hotel.name}><div><small>{hotel.date}</small><h3>{hotel.name}</h3></div><strong>{currency(hotel.amount)}</strong><span className="paid">已訂</span></article>)}
        </div>

        <div className="money-section-heading"><div><p>FLIGHTS</p><h2>機票</h2></div><strong>{currency(flightTotal)}</strong></div>
        <div className="expense-list">
          <article><div><small>9/12・HX253・香港航空</small><h3>台北 → 香港單程票</h3><p>12:15 TPE → 14:15 HKG・兩人份</p></div><strong>{currency(hongKongOutboundFlight)}</strong><span className="paid">已出票</span></article>
          <article><div><small>9/15、9/16、9/22、9/23・星宇航空</small><h3>四段票</h3><p>香港 → 台北、台北 → 大阪、大阪 → 台北、台北 → 香港・兩人份</p></div><strong>{currency(fourSegmentFlight)}</strong><span className="paid">已出票</span></article>
        </div>

        <div className="money-section-heading"><div><p>TICKETS</p><h2>票券</h2></div><strong>已付 {currency(11090)}</strong></div>
        <div className="expense-list">
          <article><div><small>9/17・Express Pass 8</small><h3>USJ 快速通關券</h3><p>Minecart &amp; Flying Dinosaur Special</p></div><strong>{currency(11090)}</strong><span className="paid">已購</span></article>
          <article className="pending"><div><small>8/16 開放購買</small><h3>USJ Studio Pass 入場券</h3><p>尚未訂購，買完後再補上實際金額。</p></div><strong>金額待補</strong><span className="todo">待購買</span></article>
        </div>

        <aside className="money-note"><b>目前怎麼看總額？</b><p>{currency(confirmedTotal)} 已包含飯店、台北飛香港單程票、星宇四段票與 USJ 快速通關券；USJ 入場券尚未購買，之後再補入總額。</p></aside>
      </section>
    </main>
  );
}

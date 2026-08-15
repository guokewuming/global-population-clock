/* ============================================================
 * 全球人口实时监测 — 共享 Mock 数据层
 * 严格遵循技术方案文档 §6.1 API 契约。
 * 后期接后端时：仅需将 MockAPI 各方法替换为真实 fetch，页面零改动。
 * ============================================================ */

(function (global) {
  'use strict';

  /* ---------- 基准数据（来源：技术方案文档 §3、§4.4 及 UN WPP 2024 公开值） ---------- */
  const COUNTRIES = {
    CHN: {
      code: 'CHN', name: '中国', en: 'CHINA', flag: 'CN', color: '#ef4444',
      basePop: 1404890000, baseDate: '2026-01-01T00:00:00+08:00',
      annualBirth: 7920000, annualDeath: 11310000,
      source: '国家统计局 · 年度统计公报', freq: '年度（次年1-2月发布）', precision: 2,
      dataStatus: 'model_prediction', nextOfficialUpdate: '2027-02-28',
      growthRate: -2.41, note: '2025年末常住人口 14.0489 亿；出生 792 万，死亡 1131 万',
      confidence: [1401000000, 1404500000]
    },
    IND: {
      code: 'IND', name: '印度', en: 'INDIA', flag: 'IN', color: '#f97316',
      basePop: 1455000000, baseDate: '2026-01-01T00:00:00+08:00',
      annualBirth: 24000000, annualDeath: 9900000,
      source: '内政部登记总署 + UN WPP 2024', freq: '年度（十年普查+年度抽样）', precision: 2,
      dataStatus: 'model_prediction', nextOfficialUpdate: '2027-03-31',
      growthRate: 9.7, note: '世界第一人口大国；无月度出生死亡数据，主要依据 UN WPP',
      confidence: [1448000000, 1462000000]
    },
    USA: {
      code: 'USA', name: '美国', en: 'UNITED STATES', flag: 'US', color: '#3b82f6',
      basePop: 341200000, baseDate: '2026-01-01T00:00:00+08:00',
      annualBirth: 3600000, annualDeath: 3350000,
      source: 'CDC NCHS 季度 + BEA/FRED 月度', freq: '季度出生死亡 + 月度人口估计', precision: 4,
      dataStatus: 'provisional_official', nextOfficialUpdate: '2026-11-15',
      growthRate: 0.7, note: '2025Q1：出生 869,334，死亡 829,935（CDC 临时数据）',
      confidence: [340800000, 341600000]
    },
    JPN: {
      code: 'JPN', name: '日本', en: 'JAPAN', flag: 'JP', color: '#a855f7',
      basePop: 122930000, baseDate: '2026-07-01T00:00:00+09:00',
      annualBirth: 700000, annualDeath: 1600000,
      source: '总务省统计局 e-Stat API', freq: '月度人口动态 + 年度推计', precision: 5,
      dataStatus: 'official_monthly', nextOfficialUpdate: '2026-09-20',
      growthRate: -7.3, note: '65岁以上占比 29.4%（全球最高）；连续 16 年减少',
      confidence: [122800000, 123050000]
    },
    DEU: {
      code: 'DEU', name: '德国', en: 'GERMANY', flag: 'DE', color: '#eab308',
      basePop: 84500000, baseDate: '2026-01-01T00:00:00+01:00',
      annualBirth: 690000, annualDeath: 1030000,
      source: 'Destatis 联邦统计局', freq: '月度', precision: 5,
      dataStatus: 'official_monthly', nextOfficialUpdate: '2026-09-10',
      growthRate: -4.0, note: '月度人口动态统计，死亡持续高于出生',
      confidence: [84300000, 84700000]
    },
    FRA: {
      code: 'FRA', name: '法国', en: 'FRANCE', flag: 'FR', color: '#6366f1',
      basePop: 68600000, baseDate: '2026-01-01T00:00:00+01:00',
      annualBirth: 660000, annualDeath: 650000,
      source: 'INSEE 国家统计与经济研究所', freq: '月度', precision: 5,
      dataStatus: 'official_monthly', nextOfficialUpdate: '2026-09-15',
      growthRate: 0.1, note: '自然增长接近归零，欧洲生育率高地正在失守',
      confidence: [68400000, 68800000]
    },
    GBR: {
      code: 'GBR', name: '英国', en: 'UNITED KINGDOM', flag: 'GB', color: '#06b6d4',
      basePop: 69100000, baseDate: '2026-01-01T00:00:00+00:00',
      annualBirth: 600000, annualDeath: 645000,
      source: 'ONS 国家统计局', freq: '季度', precision: 3,
      dataStatus: 'provisional_official', nextOfficialUpdate: '2026-10-30',
      growthRate: -0.7, note: '季度人口动态；自然变动已转负，增长依赖移民',
      confidence: [68800000, 69400000]
    },
    KOR: {
      code: 'KOR', name: '韩国', en: 'SOUTH KOREA', flag: 'KR', color: '#ec4899',
      basePop: 51700000, baseDate: '2026-01-01T00:00:00+09:00',
      annualBirth: 240000, annualDeath: 370000,
      source: '统计厅 KOSIS', freq: '月度', precision: 5,
      dataStatus: 'official_monthly', nextOfficialUpdate: '2026-09-25',
      growthRate: -2.5, note: '总和生育率 0.75，全球最低；死亡交叉持续加深',
      confidence: [51500000, 51900000]
    }
  };

  /* 展示顺序：中国置顶 */
  const ORDER = ['CHN', 'IND', 'USA', 'JPN', 'DEU', 'FRA', 'GBR', 'KOR'];

  const GLOBAL = {
    basePop: 8147293856, baseDate: '2026-01-01T00:00:00+00:00',
    annualBirth: 140000000, annualDeath: 61000000
  };

  /* 历史（2016-2025）与预测（2026-2030），单位：人。预测=自研模型中性情景 */
  const HISTORY = {
    CHN: {
      hist: [[2016,1382710000,17860000,9770000],[2017,1390010000,17230000,9860000],[2018,1395380000,15230000,9930000],[2019,1400050000,14650000,9980000],[2020,1411100000,12000000,9980000],[2021,1412600000,10620000,10140000],[2022,1411750000,9560000,10410000],[2023,1409670000,9020000,11100000],[2024,1408280000,9540000,10930000],[2025,1404890000,7920000,11310000]],
      fcst: [[2026,1400700000,7500000,11700000,'model'],[2027,1396200000,7400000,11800000,'model'],[2028,1391500000,7350000,11900000,'model'],[2029,1386700000,7300000,12050000,'model'],[2030,1381800000,7280000,12200000,'model']],
      un:   [[2026,1401200000],[2027,1397300000],[2028,1393200000],[2029,1388900000],[2030,1384500000]]
    },
    IND: {
      hist: [[2016,1324517000,25800000,9400000],[2017,1338650000,25600000,9480000],[2018,1352642000,25400000,9560000],[2019,1366417756,25200000,9640000],[2020,1380004385,25000000,10200000],[2021,1393409038,24800000,10800000],[2022,1407563842,24600000,9800000],[2023,1421775793,24400000,9720000],[2024,1438069596,24200000,9810000],[2025,1455000000,24000000,9900000]],
      fcst: [[2026,1469000000,23900000,9950000,'model'],[2027,1482900000,23800000,10000000,'model'],[2028,1496600000,23700000,10080000,'model'],[2029,1510100000,23600000,10150000,'model'],[2030,1523400000,23500000,10220000,'model']],
      un:   [[2026,1469600000],[2027,1483900000],[2028,1497900000],[2029,1511600000],[2030,1524900000]]
    },
    USA: {
      hist: [[2016,323127513,3945875,2744248],[2017,325719178,3855500,2813503],[2018,327167434,3791712,2839205],[2019,328239523,3747540,2854838],[2020,331511512,3613647,3383729],[2021,332031554,3664292,3458897],[2022,333287557,3667820,3279571],[2023,334914895,3591328,3090244],[2024,337000000,3622903,3300000],[2025,339500000,3610000,3330000]],
      fcst: [[2026,341200000,3600000,3350000,'model'],[2027,342800000,3590000,3370000,'model'],[2028,344300000,3580000,3390000,'model'],[2029,345800000,3570000,3410000,'model'],[2030,347200000,3560000,3430000,'model']],
      un:   [[2026,341300000],[2027,342900000],[2028,344500000],[2029,346000000],[2030,347500000]]
    },
    JPN: {
      hist: [[2016,127076183,976978,1307748],[2017,126797000,946060,1340397],[2018,126529100,918397,1362482],[2019,126167000,865239,1381098],[2020,125836000,840835,1372648],[2021,125502000,811622,1439856],[2022,125124989,770747,1569050],[2023,124352000,727277,1575936],[2024,123690000,720988,1576268],[2025,123300000,705000,1605000]],
      fcst: [[2026,122930000,700000,1600000,'model'],[2027,122040000,692000,1615000,'model'],[2028,121130000,685000,1630000,'model'],[2029,120200000,678000,1645000,'model'],[2030,119260000,672000,1660000,'model']],
      un:   [[2026,122900000],[2027,121980000],[2028,121050000],[2029,120100000],[2030,119150000]]
    },
    DEU: {
      hist: [[2016,82348669,792141,910899],[2017,82792351,784901,932272],[2018,83019213,787523,954874],[2019,83166711,778090,939520],[2020,83160871,773144,985572],[2021,83200000,795492,1023202],[2022,83700000,738819,1066341],[2023,84400000,692989,1027339],[2024,84500000,685000,1020000],[2025,84480000,690000,1025000]],
      fcst: [[2026,84500000,690000,1030000,'model'],[2027,84450000,688000,1035000,'model'],[2028,84400000,685000,1040000,'model'],[2029,84340000,682000,1045000,'model'],[2030,84280000,680000,1050000,'model']],
      un:   [[2026,84510000],[2027,84460000],[2028,84410000],[2029,84350000],[2030,84290000]]
    },
    FRA: {
      hist: [[2016,66992616,784000,594000],[2017,67186636,770000,606000],[2018,67372000,758000,614000],[2019,67542000,753000,612000],[2020,67499000,740000,669000],[2021,67675000,742000,661000],[2022,67813000,723000,667000],[2023,68043000,678000,651000],[2024,68300000,663000,646000],[2025,68450000,660000,648000]],
      fcst: [[2026,68600000,660000,650000,'model'],[2027,68720000,658000,653000,'model'],[2028,68830000,655000,656000,'model'],[2029,68930000,652000,659000,'model'],[2030,69020000,650000,662000,'model']],
      un:   [[2026,68610000],[2027,68740000],[2028,68860000],[2029,68960000],[2030,69050000]]
    },
    GBR: {
      hist: [[2016,65648100,696271,595000],[2017,66040229,679106,607000],[2018,66435550,657076,616000],[2019,66834405,640370,604707],[2020,67081234,613936,689629],[2021,67281039,694685,666659],[2022,67569281,605479,697261],[2023,68265209,591072,681000],[2024,68500000,605000,650000],[2025,68800000,602000,642000]],
      fcst: [[2026,69100000,600000,645000,'model'],[2027,69350000,598000,648000,'model'],[2028,69600000,596000,651000,'model'],[2029,69850000,594000,654000,'model'],[2030,70100000,592000,657000,'model']],
      un:   [[2026,69110000],[2027,69360000],[2028,69610000],[2029,69860000],[2030,70110000]]
    },
    KOR: {
      hist: [[2016,51221721,406243,280827],[2017,51361911,357771,285534],[2018,51607129,326822,298820],[2019,51709098,302676,295100],[2020,51836269,272337,305100],[2021,51745096,260562,317800],[2022,51672569,249022,372800],[2023,51712619,230028,352700],[2024,51750000,238300,358400],[2025,51730000,242000,365000]],
      fcst: [[2026,51700000,240000,370000,'model'],[2027,51570000,238000,373000,'model'],[2028,51440000,236000,376000,'model'],[2029,51300000,234000,379000,'model'],[2030,51160000,232000,382000,'model']],
      un:   [[2026,51710000],[2027,51580000],[2028,51450000],[2029,51310000],[2030,51170000]]
    }
  };

  /* ---------- 人口时钟（对应文档 §5.2 PopulationClock） ---------- */
  class PopClock {
    constructor(cfg) {
      this.basePop = cfg.basePop;
      this.baseDate = new Date(cfg.baseDate);
      this.annualBirth = cfg.annualBirth;
      this.annualDeath = cfg.annualDeath;
      this.spy = 365.25 * 24 * 3600; // seconds per year
    }
    current() {
      const elapsed = (Date.now() - this.baseDate.getTime()) / 1000;
      return this.basePop + elapsed * (this.annualBirth - this.annualDeath) / this.spy;
    }
    today() {
      const now = new Date();
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const sec = (now.getTime() - dayStart.getTime()) / 1000;
      const birth = sec * this.annualBirth / this.spy;
      const death = sec * this.annualDeath / this.spy;
      return { birth, death, net: birth - death };
    }
    perDay() { // 日均速率
      const b = this.annualBirth / 365.25, d = this.annualDeath / 365.25;
      return { birth: b, death: d, net: b - d };
    }
    perSecond() {
      return { birth: this.annualBirth / this.spy, death: this.annualDeath / this.spy, net: (this.annualBirth - this.annualDeath) / this.spy };
    }
  }

  const clocks = {};
  ORDER.forEach(c => clocks[c] = new PopClock(COUNTRIES[c]));
  const globalClock = new PopClock(GLOBAL);

  /* ---------- MockAPI：返回结构与文档 §6.1 契约一致 ---------- */
  const MockAPI = {
    /* GET /api/v1/population/{code}/current */
    current(code) {
      const c = COUNTRIES[code], t = clocks[code].today();
      return {
        country: c.code, name: c.name,
        timestamp: new Date().toISOString(),
        population: Math.round(clocks[code].current()),
        today_birth: Math.floor(t.birth),
        today_death: Math.floor(t.death),
        today_net: Math.floor(t.net),
        growth_rate: c.growthRate,
        data_status: c.dataStatus,
        next_official_update: c.nextOfficialUpdate,
        confidence_interval: c.confidence
      };
    },
    /* GET /api/v1/population/leaderboard */
    leaderboard() {
      const list = ORDER.map(code => ({
        code, name: COUNTRIES[code].name, flag: COUNTRIES[code].flag,
        population: Math.round(clocks[code].current())
      })).sort((a, b) => b.population - a.population)
        .sort((a, b) => (a.code === 'CHN' ? -1 : b.code === 'CHN' ? 1 : 0)) /* 中国置顶 */
        .map((d, i) => Object.assign({ rank: i + 1 }, d));
      const gt = globalClock.today();
      return { countries: list, global_total: Math.round(globalClock.current()), global_today_net: Math.floor(gt.net) };
    },
    /* GET /api/v1/population/{code}/history */
    history(code) {
      const h = HISTORY[code];
      return {
        country: code,
        historical: h.hist.map(r => ({ year: r[0], population: r[1], birth: r[2], death: r[3] })),
        forecast: h.fcst.map(r => ({ year: r[0], population: r[1], birth: r[2], death: r[3], source: r[4] })),
        un_wpp: h.un.map(r => ({ year: r[0], population: r[1], source: 'un_wpp_2024' }))
      };
    },
    meta(code) { return COUNTRIES[code]; },
    clock(code) { return clocks[code]; },
    globalClock() { return globalClock; },
    order: ORDER
  };

  /* ---------- 工具 ---------- */
  const Util = {
    fmt(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); },
    fmtSigned(n) { return (n >= 0 ? '+' : '−') + Util.fmt(Math.abs(n)); },
    fmtWan(n) { // 中文万单位
      if (Math.abs(n) >= 1e8) return (n / 1e8).toFixed(3) + ' 亿';
      if (Math.abs(n) >= 1e4) return (n / 1e4).toFixed(1) + ' 万';
      return Util.fmt(n);
    },
    statusLabel(s) {
      return {
        official_monthly: '官方月度数据',
        provisional_official: '官方临时数据',
        model_prediction: '模型预测'
      }[s] || s;
    }
  };

  /* ── 即时电讯（mock）：由数据事件驱动的快讯，后端阶段可接 RSS / 自动生成 ── */
  const NEWS = [
    { tag: '数据', text: '中国 2025 年出生人口 902 万，死亡人口 1110 万，自然增长率连续第四年为负' },
    { tag: '现场', text: '日本总务省：65 岁以上人口占比升至 29.4%，为全球最高水平' },
    { tag: '纪录', text: '韩国总和生育率 0.75，连续八年位居全球最低，首尔市区已跌破 0.6' },
    { tag: '预测', text: '联合国 WPP 2024：全球人口将于 2084 年达峰 103 亿，早于此前预期' },
    { tag: '数据', text: '印度超越中国成为全球人口第一大国，但总和生育率已降至 2.0 更替线下' },
    { tag: '政策', text: '德国联邦统计局：2025 年净移民 34 万人，为唯一人口正增长来源' },
    { tag: '现场', text: '意大利小镇阿尔皮诺为挽留居民发放新生儿奖金，全国乡村空心化加剧' },
    { tag: '数据', text: '美国人口普查局：2025 年自然增长降至 51 万，为 1900 年以来最低' },
    { tag: '预测', text: '模型推演：日本今日净减约 4.3 万人，相当于每天消失一座村庄' },
    { tag: '政策', text: '法国出生率跌破 1.6，政府拟将育儿假补贴提高 40% 以扭转趋势' },
    { tag: '纪录', text: '英国 2025 年死亡人数首次连续两年超过出生人数' },
    { tag: '数据', text: '全球每秒诞生 4.4 人、逝去 1.9 人，净增 2.5 人——增速仍在放缓' },
  ];
  MockAPI.news = async () => NEWS.map((n, i) => ({ id: i + 1, tag: n.tag, text: n.text, ts: Date.now() }));

  /* ---------- 后端接入（§6.1）----------
   * 页面以 file:// 或静态预览打开时静默回退到内置 mock；
   * 由后端服务托管时自动连接 /api/v1/bootstrap，基线热更新到现有时钟实例，
   * 此后每 5 分钟重新同步一次（后端管理员更新基线后前端无感生效）。 */
  MockAPI.serverOnline = false;
  function applyBootstrap(b) {
    if (!b || !b.countries) return;
    ORDER.forEach(code => {
      const s = b.countries[code];
      if (!s) return;
      Object.assign(COUNTRIES[code], s);          // 元数据/基线
      const ck = clocks[code];                     // 就地更新时钟（页面引用不变）
      ck.basePop = s.basePop;
      ck.baseDate = new Date(s.baseDate);
      ck.annualBirth = s.annualBirth;
      ck.annualDeath = s.annualDeath;
    });
    if (b.global) Object.assign(GLOBAL, b.global);
    if (b.global) {
      globalClock.basePop = b.global.basePop;
      globalClock.baseDate = new Date(b.global.baseDate);
      globalClock.annualBirth = b.global.annualBirth;
      globalClock.annualDeath = b.global.annualDeath;
    }
    if (Array.isArray(b.news) && b.news.length) {
      NEWS.length = 0;
      b.news.forEach(n => NEWS.push({ tag: n.tag, text: n.text }));
    }
  }
  MockAPI.connect = async function () {
    try {
      const r = await fetch('/api/v1/bootstrap', { cache: 'no-store' });
      if (!r.ok) throw new Error('http ' + r.status);
      applyBootstrap(await r.json());
      MockAPI.serverOnline = true;
    } catch (e) {
      MockAPI.serverOnline = false; /* 离线：继续使用内置基线 */
    }
  };
  if (typeof fetch === 'function' && typeof location !== 'undefined' && location.protocol.indexOf('http') === 0) {
    MockAPI.connect();
    setInterval(MockAPI.connect, 5 * 60 * 1000);
  }

  /* ---------- 浏览器端全自动校准（静态托管的全自动模式） ----------
   * 打开页面时，浏览器直连世界银行公开 API（允许跨域）取 8 国最新年度总人口；
   * 合理性检查：仅当其口径日期晚于当前基线、且与基线偏差 ≤3% 时自动采纳，
   * 将时钟起点校准到该官方值（年中口径）。偏差过大或网络失败一律沿用内置基线。
   * 结果缓存 24 小时（localStorage），避免每次打开都请求。 */
  const WB_CACHE_KEY = 'popcalib_v1';
  MockAPI.calibration = {};   // 各国家校准记录 {year, population, dev}
  async function wbCalibrate() {
    try {
      let latest = null;
      try {
        const c = JSON.parse(localStorage.getItem(WB_CACHE_KEY) || 'null');
        if (c && Date.now() - c.ts < 24 * 3600 * 1000) latest = c.latest;
      } catch (e) {}
      if (!latest) {
        const r = await fetch('https://api.worldbank.org/v2/country/CHN;IND;USA;JPN;DEU;FRA;GBR;KOR/indicator/SP.POP.TOTL?format=json&per_page=100&date=2022:2035', { cache: 'no-store' });
        const j = await r.json();
        latest = {};
        (j[1] || []).forEach(row => {
          if (row.value != null && !latest[row.countryiso3code])
            latest[row.countryiso3code] = { year: +row.date, population: row.value };
        });
        try { localStorage.setItem(WB_CACHE_KEY, JSON.stringify({ ts: Date.now(), latest })); } catch (e) {}
      }
      ORDER.forEach(code => {
        const w = latest[code];
        if (!w) return;
        const c = COUNTRIES[code], ck = clocks[code];
        const wbDate = new Date(Date.UTC(w.year, 6, 1));       // 世界银行年度值为年中口径
        if (wbDate <= ck.baseDate) return;                     // 内置/服务端基线更新，跳过
        const dev = Math.abs(w.population - c.basePop) / c.basePop;
        if (dev > 0.03) return;                                // 偏差过大：拒绝自动采纳，沿用基线
        ck.basePop = w.population;                             // 采纳：回拨时钟起点
        ck.baseDate = wbDate;
        c.basePop = w.population;
        c.baseDate = wbDate.toISOString();
        c.source += ' · 已自动校准至世界银行 ' + w.year + ' 年度值';
        MockAPI.calibration[code] = { year: w.year, population: w.population, dev: +(dev * 100).toFixed(2) };
      });
    } catch (e) { /* 离线/被拦截：静默沿用内置基线 */ }
  }
  if (typeof fetch === 'function' && location.protocol.indexOf('http') === 0) {
    wbCalibrate();
    setInterval(wbCalibrate, 6 * 3600 * 1000);
  }

  global.PopClock = PopClock;
  global.MockAPI = MockAPI;
  global.PopUtil = Util;
})(window);

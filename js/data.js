/* ============================================================
 * data.js — 数据层：canonical 数据形状 + 派生数据加载 + 钩稽自检
 * 数据源模式：
 *   'derived' — 真实模拟病人聚合数据（js/derived-data.js，主模式）
 *   'mock'    — 原演示假数据（回退备用）
 * 标注约定：[REAL] 原图真实数值 | [MOCK] 演示造数 | [ANCHOR] 锚点值
 * ============================================================ */

window.DRC = window.DRC || {};

/* ---------- 全局配置 ---------- */
DRC.config = {
  dataSource: 'derived',         // 'derived' 主模式 | 'mock' 演示回退
  apiBaseUrl: './api',
  carousel: {
    ringMs: 3000,                // 性别/年龄环图扇区轮播间隔
    tooltipMs: 4000,             // 折线/柱图 Tooltip 自动巡检间隔
    tableScrollSec: 20
  },
  refresh: {
    clockMs: 1000,               // 高频：系统时钟
    midMs: 30000                 // 中频：仅 mock 模式模拟增量（derived 为定数不清加）
  }
};

/* ---------- Mock 回退数据（形状与 derived 模式完全一致） ---------- */
DRC.data = {

  overview: {
    totalManaged: 1000, todayEnrolled: 0,
    totalVisits: 8174, todayVisits: 1,
    totalCgmUsers: 1000, todayNewCgm: 0,
    revisitRate: 87.77
  },

  trend: {  // [MOCK] 形状演示值
    months: ['2026年01月', '2026年02月', '2026年03月', '2026年04月', '2026年05月', '2026年06月'],
    newVisits:   [587, 495, 486, 308, 283, 128],
    newMeasures: [3840, 3469, 3358, 1940, 2033, 856],
    newCgm:      [968, 730, 607, 412, 262, 41]
  },

  weightDist: { total: 1000, underweight: 51, normal: 343, obese: 216, overweight: 390 },

  renalAlbum: {  // 白蛋白尿(A2/A3 异常) / 肾功能(eGFR<60 异常)
    items: ['白蛋白尿', '肾功能'],
    abnormal: [26.8, 5.9],
    normal: [73.2, 94.1]
  },

  genderDist: [
    { name: '男', value: 61.8, color: '#2A5CD8' },
    { name: '女', value: 38.2, color: '#F97316' }
  ],

  ageDist: [
    { name: '40岁以下', value: 8.0,  color: '#1B4FB8' },
    { name: '40-50岁',  value: 18.4, color: '#2A5CD8' },
    { name: '50-60岁',  value: 30.7, color: '#2AA0F0' },
    { name: '60-65岁',  value: 14.3, color: '#5FD9C4' },
    { name: '65-70岁',  value: 11.9, color: '#2EC8A8' },
    { name: '70岁以上', value: 16.7, color: '#35D0B0' }
  ],

  diseaseDist: [
    { name: '2型糖尿病', registered: 1000, confirmed: 1000, ratio: '100.00%' },
    { name: '高血压', registered: 1000, confirmed: 648, ratio: '64.80%' },
    { name: '血脂异常', registered: 1000, confirmed: 519, ratio: '51.90%' },
    { name: '慢性肾脏病', registered: 1000, confirmed: 214, ratio: '21.40%' },
    { name: '视网膜病变', registered: 1000, confirmed: 132, ratio: '13.20%' }
  ],

  hospital: [
    { name: '血压', sub: '', times: 8174, abnormal: 3560, ratio: '43.55%' },
    { name: '空腹血糖', sub: '', times: 3000, abnormal: 2162, ratio: '72.07%' },
    { name: '糖化血红蛋白', sub: 'HbA1c', times: 3000, abnormal: 1936, ratio: '64.53%' },
    { name: '血脂', sub: 'LDL-C', times: 3000, abnormal: 1419, ratio: '47.30%' },
    { name: '肾功能', sub: 'eGFR', times: 3000, abnormal: 196, ratio: '6.53%' }
  ],

  home: {
    diet:  { people: 493, times: 44593 },
    sport: { people: 486, times: 15111 },
    monitors: [
      { name: 'CGM血糖', sub: '动态血糖', times: 44581, abnormal: 22731, ratio: '50.99%', people: 493, peopleRatio: '49.30%' },
      { name: '指尖血糖', sub: 'SMBG', times: 1597, abnormal: 571, ratio: '35.75%', people: 493, peopleRatio: '49.30%' },
      { name: '睡眠监测', sub: '', times: 44593, abnormal: 4874, ratio: '10.93%', people: 493, peopleRatio: '49.30%' }
    ]
  },

  glyControl: {  // 血糖控制成效（右栏主指标）
    caption: '糖化血红蛋白达标率 (<7%)',
    latestRate: 37.3, latestCount: 373, n: 1000,
    baselineRate: 33.9, deltaPp: 3.4,
    avgBase: 8.41, avgLast: 8.13, avgDrop: 0.28
  },

  trajectory: {  // 入组后第 1~6 次随访均值轨迹
    stages: ['F1', 'F2', 'F3', 'F4', 'F5', 'F6'],
    weightKg: [68.37, 68.35, 68.4, 68.39, 68.36, 68.37],
    sbp: [131.56, 130.74, 130.69, 130.46, 130.27, 130.17]
  },

  standard: {
    indicators: ['血压', '血糖', '糖化', '血脂', '肾功能'],
    baseline: [46.4, 28.5, 33.9, 19.7, 93.6],
    latest:   [51.5, 28.6, 37.3, 27.7, 93.4]
  }
};

/* ---------- 工具：四舍五入保留两位（与原系统口径一致） ---------- */
DRC.round2 = function (v) { return Math.round(v * 100) / 100; };
DRC.fmtPercent = function (num, den) { return DRC.round2(num / den * 100).toFixed(2) + '%'; };
DRC.fmtThousands = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };

/* ---------- 应用派生数据（tools/derive_dashboard_data.py 生成） ---------- */
DRC.applyDerived = function () {
  var d = DRC.derived;
  if (!d) { console.warn('[DRC] derived-data.js 未加载，保持 Mock 回退'); return false; }

  DRC.data.overview = {
    totalManaged: d.overview.totalManaged,
    todayEnrolled: d.overview.todayEnrolled,
    totalVisits: d.overview.totalVisits,
    todayVisits: d.overview.todayVisits,
    totalCgmUsers: d.overview.cgmUsers,
    todayNewCgm: d.overview.todayNewCgm,
    revisitRate: d.overview.revisitRate
  };
  DRC.data.trend = d.trend;
  DRC.data.weightDist = d.weightDist;
  DRC.data.renalAlbum = d.renalAlbum;
  DRC.data.genderDist = d.genderDist;
  DRC.data.ageDist = d.ageDist;
  DRC.data.diseaseDist = d.diseaseDist;
  DRC.data.hospital = d.hospital;
  DRC.data.home = d.home;
  DRC.data.glyControl = d.glyControl;
  DRC.data.trajectory = d.trajectory;
  DRC.data.standard = d.standard;

  console.info('%c[DRC] 已应用派生数据: ' + d.meta.dataset +
    ' · 窗口 ' + d.meta.window + ' · 锚点 ' + d.meta.anchor, 'color:#2EC8A8');
  return true;
};

/* ---------- 钩稽公式自检（通用：对当前 DRC.data 生效） ---------- */
DRC.checkDataIntegrity = function () {
  var d = DRC.data, ok = true;
  var fail = function (msg) { ok = false; console.error('[钩稽校验失败] ' + msg); };

  // 公式 1：体重分层汇总闭环 = 中心总人数
  var wd = d.weightDist;
  var wdSum = wd.underweight + wd.normal + wd.obese + wd.overweight;
  wdSum === wd.total || fail('体重分布：' + wdSum + ' ≠ 中心总人数 ' + wd.total);

  // 公式 2：异常占比 = 异常次数 ÷ 总次数，保留两位
  d.hospital.forEach(function (r) {
    var calc = DRC.fmtPercent(r.abnormal, r.total);
    calc === r.ratio || fail(r.name + ' 异常占比：计算 ' + calc + ' ≠ 展示 ' + r.ratio);
  });
  d.home.monitors.forEach(function (r) {
    var calc = DRC.fmtPercent(r.abnormal, r.times);
    calc === r.ratio || fail(r.name + ' 异常占比：计算 ' + calc + ' ≠ 展示 ' + r.ratio);
  });

  // 公式 3：居家人数占比分母固定为总计管理人数
  d.home.monitors.forEach(function (r) {
    var calc = DRC.fmtPercent(r.people, d.overview.totalManaged);
    calc === r.peopleRatio || fail(r.name + ' 人数占比：计算 ' + calc + ' ≠ 展示 ' + r.peopleRatio);
  });

  // 公式 4：糖化达标率 = 达标人数 ÷ 队列人数；提升 pp 自洽
  if (d.glyControl) {
    var g = d.glyControl;
    var calcRate = DRC.fmtPercent(g.latestCount, g.n);
    calcRate === g.latestRate.toFixed(2) + '%'
      || fail('糖化达标率：计算 ' + calcRate + ' ≠ 展示 ' + g.latestRate + '%');
    DRC.round2(g.latestRate - g.baselineRate) === g.deltaPp
      || fail('达标提升 pp：' + g.deltaPp + ' ≠ ' + DRC.round2(g.latestRate - g.baselineRate));
  }

  // 附带：年龄/性别分段合计 100%
  var ageSum = d.ageDist.reduce(function (s, x) { return s + x.value; }, 0);
  Math.abs(ageSum - 100) < 0.05 || fail('年龄分布合计 ' + ageSum + '% ≠ 100%');
  var genSum = d.genderDist.reduce(function (s, x) { return s + x.value; }, 0);
  Math.abs(genSum - 100) < 0.05 || fail('性别分布合计 ' + genSum + '% ≠ 100%');

  console[ok ? 'info' : 'error'](ok
    ? '%c[DRC] 钩稽公式 + 结构合计校验全部通过 ✓'
    : '[DRC] 数据自检未通过，请检查数据源',
    ok ? 'color:#22D3EE' : '');
  return ok;
};

/* ---------- 数据源获取 ---------- */
DRC.getDashboardData = function () {
  if (DRC.config.dataSource === 'derived') {
    DRC.applyDerived();
  } else if (DRC.config.dataSource === 'api') {
    // 阶段四：按"人群画像 / 运营概况 / 院内居家汇总 / 随访成果"四大聚合接口拉取
    console.warn('[DRC] api 模式尚未接入后端，当前回退 Mock 数据');
  }
};

/* ---------- 中频刷新模拟增量（仅 mock 模式；derived 为定数不模拟） ---------- */
DRC.simulateTick = function () {
  if (DRC.config.dataSource !== 'mock') return {};
  var d = DRC.data;
  var changed = {};
  if (d.overview.todayVisits < 12 && Math.random() < 0.3) {
    d.overview.todayVisits += 1;
    d.overview.totalVisits += 1;
    changed.todayVisits = d.overview.todayVisits;
    changed.totalVisits = d.overview.totalVisits;
  }
  d.home.diet.times += 1 + Math.floor(Math.random() * 4);
  d.home.sport.times += 1 + Math.floor(Math.random() * 3);
  changed.dietTimes = d.home.diet.times;
  changed.sportTimes = d.home.sport.times;
  return changed;
};

/* ============================================================
 * core.js — 自适应缩放 / 实时时钟 / 分级调度 / CountUp / 轮播引擎
 * 依赖：lib/echarts.min.js、js/data.js
 * ============================================================ */

DRC.$ = function (id) { return document.getElementById(id); };

DRC.core = {
  scale: 1,
  charts: {},    // echarts 实例登记表
  registry: {},  // 业务模块注册表 { name: { init, refresh } }
  hoverLock: 0   // >0 表示鼠标正悬停在某图表上，轮播类动效应暂停
};

/* ---------- 模块注册与启动 ---------- */
DRC.registerModule = function (name, def) {
  DRC.core.registry[name] = def;
};

DRC.initModules = function () {
  Object.keys(DRC.core.registry).forEach(function (name) {
    try {
      DRC.core.registry[name].init();
    } catch (e) {
      console.error('[DRC] 模块初始化失败: ' + name, e);
    }
  });
};

/* ---------- 1920×1080 等比缩放容器（规格 5.1） ---------- */
DRC.fitScreen = function () {
  var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  DRC.core.scale = s;
  DRC.$('screen').style.transform = 'translate(-50%, -50%) scale(' + s + ')';
};

/* ---------- ECharts 初始化包装（2K/4K 超采样，保证 transform 放大后锐利） ---------- */
DRC.initChart = function (id) {
  var el = DRC.$(id);
  var dpr = (window.devicePixelRatio || 1) * Math.min(2, Math.max(1, DRC.core.scale || 1));
  var inst = echarts.init(el, null, { devicePixelRatio: dpr });
  DRC.core.charts[id] = inst;
  return inst;
};

/* ---------- ECharts 公共主题配置 ---------- */
DRC.chartBase = {
  textStyle: { fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif', color: '#8CA3C7' },
  axisLine: { lineStyle: { color: 'rgba(140,163,199,.35)' } },
  splitLine: { lineStyle: { color: 'rgba(140,163,199,.14)', type: 'dashed' } },
  tooltip: {
    backgroundColor: 'rgba(5,10,24,.92)',
    borderColor: 'rgba(42,160,240,.45)',
    borderWidth: 1,
    textStyle: { color: '#F2F7FF', fontSize: 13 },
    confine: true,  // 将浮层限制在图表容器内，避免巡检时遮挡相邻模块
    extraCssText: 'box-shadow: 0 0 14px rgba(42,160,240,.25); border-radius: 4px;'
  }
};

/* ---------- 实时时钟（高频：每秒） ---------- */
DRC.startClock = function () {
  var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
  function tick() {
    var t = new Date();
    DRC.$('clock-date').textContent = t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate());
    DRC.$('clock-time').textContent = pad(t.getHours()) + ':' + pad(t.getMinutes()) + ':' + pad(t.getSeconds());
  }
  tick();
  setInterval(tick, DRC.config.refresh.clockMs);
};

/* ---------- 数字 CountUp 平滑滚动（rAF，ease-out cubic） ---------- */
DRC.countUp = function (el, to, opts) {
  if (!el) return;
  opts = opts || {};
  var from = el.__drcVal != null ? el.__drcVal : 0;
  var dur = opts.duration || 900;
  var dec = opts.decimals || 0;
  var t0 = null;
  // 动画令牌：新目标启动后旧动画的 rAF 回调自动作废，避免过期帧覆盖最新值
  var token = (el.__drcToken = (el.__drcToken || 0) + 1);

  function fmt(v) {
    var parts = v.toFixed(dec).split('.');
    var int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (opts.prefix || '') + int + (parts[1] ? '.' + parts[1] : '') + (opts.suffix || '');
  }
  el.__drcVal = to;
  if (opts.instant) { el.textContent = fmt(to); return; }

  function frame(ts) {
    if (token !== el.__drcToken) return;
    if (t0 === null) t0 = ts;
    var p = Math.min(1, (ts - t0) / dur);
    var eased = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(from + (to - from) * eased);
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
};

/* ---------- 环图扇区自动轮播（3s 切换高亮 + 中心标签同步 + hover 暂停） ---------- */
DRC.ringCarousel = function (chart, data, overlayEl, opts) {
  opts = opts || {};
  var idx = opts.startIndex || 0;
  var timer = null;
  var paused = false;

  function show(i, withAction) {
    idx = ((i % data.length) + data.length) % data.length;
    if (withAction !== false) {
      chart.dispatchAction({ type: 'downplay' });
      chart.dispatchAction({ type: 'highlight', dataIndex: idx });
    }
    if (overlayEl) {
      overlayEl.innerHTML =
        '<b>' + data[idx].value + (opts.suffix || '%') + '</b><span>' + data[idx].name + '</span>';
    }
  }

  function play() {
    stop();
    timer = setInterval(function () {
      if (!paused && !DRC.core.hoverLock) show(idx + 1);
    }, DRC.config.carousel.ringMs);
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  // 鼠标接管：移入扇区暂停并跟随，移出恢复轮播
  chart.on('mouseover', function (p) {
    paused = true;
    if (p.dataIndex != null) show(p.dataIndex, false);
  });
  chart.on('globalout', function () {
    paused = false;
    show(idx, true);
  });

  show(idx, true);
  play();
  return { show: show, replay: play };
};

/* ---------- Tooltip 自动巡检（周期性 showTip，鼠标悬停时让位） ---------- */
DRC.tooltipTour = function (chart, opts) {
  opts = opts || {};
  var count = opts.count;
  var seriesIndex = opts.seriesIndex || 0;
  var i = -1;
  setInterval(function () {
    if (DRC.core.hoverLock) return;   // 鼠标正在交互，跳过本轮巡检
    i = (i + 1) % count;
    chart.dispatchAction({ type: 'showTip', seriesIndex: seriesIndex, dataIndex: i });
  }, DRC.config.carousel.tooltipMs);
};

/* ---------- 表格构建（固定表头 + 双份 tbody 无缝滚动 + hover 暂停） ---------- */
DRC.buildTable = function (containerId, columns, rows) {
  var box = DRC.$(containerId);
  if (!box) return;

  // fixed 布局下列宽由 colgroup 声明，thead 表与 tbody 表共用同一组宽度保证对齐
  var colgroup = '<colgroup>' + columns.map(function (c) {
    return '<col' + (c.width ? ' style="width:' + c.width + '"' : '') + '>';
  }).join('') + '</colgroup>';

  var headHtml = '<table class="drc-table">' + colgroup + '<thead><tr>' +
    columns.map(function (c) {
      return '<th>' + c.label + '</th>';
    }).join('') + '</tr></thead></table>';

  var bodyHtml = function () {
    return '<table class="drc-table">' + colgroup + '<tbody>' +
      rows.map(function (r) {
        return '<tr>' + columns.map(function (c) {
          return '<td class="' + (c.cls || '') + '">' + r[c.key] + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table>';
  };

  box.innerHTML =
    headHtml +
    '<div class="table-viewport" style="position:relative;overflow:hidden;flex:1;min-height:0;">' +
      '<div class="table-inner" style="--scroll-dur:' + (rows.length * 2.4) + 's">' +
        bodyHtml() + bodyHtml() +
      '</div>' +
    '</div>';

  // 内容不足一屏时停用滚动
  requestAnimationFrame(function () {
    var inner = box.querySelector('.table-inner');
    var viewport = box.querySelector('.table-viewport');
    if (inner.scrollHeight / 2 <= viewport.clientHeight) inner.classList.add('static');
  });
};

/* ---------- 分级刷新调度器（规格 5.2：高频 / 中频 / 低频） ---------- */
DRC.scheduler = {
  run: function () {
    // 中频：模拟增量数据 → 通知各模块 refresh(changed)
    setInterval(function () {
      var changed = DRC.simulateTick();
      Object.keys(DRC.core.registry).forEach(function (name) {
        var mod = DRC.core.registry[name];
        if (typeof mod.refresh === 'function') {
          try { mod.refresh(changed); } catch (e) { console.error('[DRC] refresh 失败: ' + name, e); }
        }
      });
    }, DRC.config.refresh.midMs);
    // 低频（结构性数据）：demo 中启动即加载，不重复拉取
  }
};

/* ---------- 一键全屏 ---------- */
DRC.bindFullscreen = function () {
  DRC.$('btn-fullscreen').addEventListener('click', function () {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  });
};

/* ---------- hoverLock：鼠标进入任意图表区域时挂起自动轮播 ---------- */
DRC.bindHoverLock = function () {
  ['mouseover', 'mouseout'].forEach(function (type) {
    document.addEventListener(type, function (e) {
      if (e.target.closest && e.target.closest('.chart')) {
        DRC.core.hoverLock = Math.max(0, DRC.core.hoverLock + (type === 'mouseover' ? 1 : -1));
      }
    }, true);
  });
};

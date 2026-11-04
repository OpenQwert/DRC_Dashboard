/* ============================================================
 * main.js — 入口：缩放 → 自检 → 模块初始化 → 调度启动
 * ============================================================ */

(function boot() {
  // 1. 画布等比缩放（窗口变化时重算，非 16:9 由 body 背景无缝延展）
  DRC.fitScreen();
  window.addEventListener('resize', DRC.fitScreen);

  // 2. 钩稽公式自检（控制台可查看 4 条公式校验结果）
  DRC.checkDataIntegrity();

  // 3. 数据源加载（mock 直返 / api 预留）
  DRC.getDashboardData();

  // 4. 交互绑定 + 业务模块初始化 + 分级调度
  DRC.bindFullscreen();
  DRC.bindHoverLock();
  DRC.startClock();
  DRC.scheduler.run();

  // 图表初始化推迟两帧，确保浏览器完成样式计算与 flex 布局，
  // 避免 ECharts 读到 1px 高的容器（画布定格为 1px 导致空白）；
  // 另加 setTimeout 兜底：页面不可见时 rAF 会被浏览器暂停
  var initialized = false;
  function doInit() {
    if (initialized) return;
    initialized = true;
    DRC.initModules();
    // 保险：按最终容器尺寸校正一次全部画布
    Object.keys(DRC.core.charts).forEach(function (id) {
      DRC.core.charts[id].resize();
    });
  }
  requestAnimationFrame(function () { requestAnimationFrame(doInit); });
  setTimeout(doInit, 120);

  console.info('%c[DRC] 糖尿病专病管理数据大屏启动完成 · ' +
    '演示模式(Mock) · 画布 1920×1080 × ' + DRC.core.scale.toFixed(2),
    'color:#22D3EE');
})();

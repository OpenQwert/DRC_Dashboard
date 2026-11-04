/* ============================================================
 * charts-left.js — 左栏·人群画像（4 子模块）
 *   1. 体重分布：同心刻度环 + 四角引线指标卡
 *   2. 腰臀比、体脂率：100% 堆叠柱状图
 *   3. 性别、年龄：双环形饼图（3s 扇区轮播 + hover 接管）
 *   4. 疾病分布：斑马纹无缝滚动表格
 * ============================================================ */

/* ---------- 1. 体重分布 ---------- */
DRC.registerModule('weight-dist', {
  init: function () {
    var d = DRC.data.weightDist;
    var R = 85, CIRC = 2 * Math.PI * R;
    var pct = d.total / DRC.data.overview.totalManaged;  // 有 BMI 评估人数占比
    var ring = DRC.$('wd-progress');

    ring.setAttribute('stroke-dasharray', '0 ' + CIRC);
    // 首帧后启动进度环过渡 + 数字滚动
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        ring.setAttribute('stroke-dasharray', (CIRC * pct).toFixed(2) + ' ' + CIRC.toFixed(2));
      });
    });

    DRC.countUp(DRC.$('wd-total'), d.total);
    DRC.countUp(DRC.$('wd-under'), d.underweight);
    DRC.countUp(DRC.$('wd-normal'), d.normal);
    DRC.countUp(DRC.$('wd-obese'), d.obese);
    DRC.countUp(DRC.$('wd-over'), d.overweight);
  },
  refresh: function () { /* 体重分层为低频结构指标，demo 不做中频刷新 */ }
});

/* ---------- 2. 肾功能、白蛋白尿分布（原腰臀比/体脂率位，无数据源已替换） ---------- */
DRC.registerModule('renal-album', {
  init: function () {
    var d = DRC.data.renalAlbum;
    var chart = DRC.initChart('chart-renal');

    chart.setOption({
      textStyle: DRC.chartBase.textStyle,
      tooltip: Object.assign({ trigger: 'axis', axisPointer: { type: 'shadow' } }, DRC.chartBase.tooltip),
      legend: {
        right: 4, top: 0, itemWidth: 9, itemHeight: 9, itemGap: 12,
        textStyle: { color: '#8CA3C7', fontSize: 12 },
        data: ['异常', '正常']
      },
      grid: { left: 40, right: 14, top: 28, bottom: 24 },
      xAxis: {
        type: 'category',
        data: d.items,
        axisLine: DRC.chartBase.axisLine,
        axisTick: { show: false },
        axisLabel: { color: '#C9DCF5', fontSize: 13 }
      },
      yAxis: {
        type: 'value', max: 100,
        interval: 33.33,
        axisLabel: { formatter: function (v) { return Math.round(v) + '%'; }, fontSize: 11 },
        axisLine: { show: false },
        splitLine: DRC.chartBase.splitLine
      },
      series: [
        {
          name: '异常', type: 'bar', stack: 'total', barWidth: 30,
          itemStyle: { color: '#F59E0B', borderRadius: [3, 3, 0, 0] },
          label: { show: true, position: 'inside', color: '#0B1E3D', fontWeight: 700, formatter: '{c}%' },
          data: d.abnormal
        },
        {
          name: '正常', type: 'bar', stack: 'total', barWidth: 30,
          itemStyle: { color: '#2A5CD8' },
          label: { show: true, position: 'inside', color: '#fff', formatter: '{c}%' },
          data: d.normal
        }
      ]
    });
  }
});

/* ---------- 3. 性别、年龄分布 ---------- */
function makeRing(id, data, startIdx) {
  var chart = DRC.initChart(id);

  // 中心动态标签层（跟随轮播切换）
  var wrap = DRC.$(id).parentElement;
  var overlay = document.createElement('div');
  overlay.style.cssText =
    'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;' +
    'justify-content:center;pointer-events:none;text-align:center;';
  overlay.innerHTML =
    '<b style="font-family:Bahnschrift,Arial;font-size:21px;font-weight:800;color:#fff;' +
    'text-shadow:0 0 10px rgba(42,160,240,.5);line-height:1.2;"></b>' +
    '<span style="font-size:11px;color:#8CA3C7;margin-top:3px;max-width:90%;"></span>';
  wrap.appendChild(overlay);

  chart.setOption({
    textStyle: DRC.chartBase.textStyle,
    tooltip: Object.assign({
      trigger: 'item',
      formatter: '{b}<br/><b style="color:#2AA0F0">{c}%</b>'
    }, DRC.chartBase.tooltip),
    series: [{
      type: 'pie',
      radius: ['52%', '76%'],
      center: ['50%', '52%'],
      avoidLabelOverlap: true,
      itemStyle: { borderColor: '#0B1E3D', borderWidth: 2 },
      label: { show: false },
      labelLine: { show: false },
      emphasis: {
        scale: true, scaleSize: 7,
        itemStyle: { shadowBlur: 16, shadowColor: 'rgba(42,160,240,.55)' }
      },
      data: data
    }]
  });

  DRC.ringCarousel(chart, data, overlay, { startIndex: startIdx });
}

DRC.registerModule('gender-age', {
  init: function () {
    // 初始高亮：女（idx 1）、50-60岁最大分段（idx 2）
    makeRing('chart-gender', DRC.data.genderDist, 1);
    makeRing('chart-age', DRC.data.ageDist, 2);
  }
});

/* ---------- 4. 疾病分布（滚动表格） ---------- */
DRC.registerModule('disease-table', {
  init: function () {
    DRC.buildTable('table-disease',
      [
        { label: '疾病诊断', key: 'name', cls: 'name', width: '42%' },
        { label: '总登记人数', key: 'registered', cls: 'num' },
        { label: '确诊人数', key: 'confirmed', cls: 'num' },
        { label: '占比', key: 'ratio', cls: 'hl' }
      ],
      DRC.data.diseaseDist
    );
  }
});

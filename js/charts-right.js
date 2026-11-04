/* ============================================================
 * charts-right.js — 右栏·管理成果（血糖控制叙事，真实疗效口径）
 *   1. 血糖控制成效：糖化达标率大字看板 + 双胶囊统计卡
 *   2. 体重随访均值：第 1~6 次随访真实均值轨迹
 *   3. 收缩压随访均值：第 1~6 次随访真实均值轨迹
 *   4. 指标达标率对比：基线 vs 末次分组柱（真实配对口径）
 * ============================================================ */

/* ---------- 1. 血糖控制成效 ---------- */
DRC.registerModule('gly-control-hero', {
  init: function () {
    var g = DRC.data.glyControl;
    DRC.countUp(DRC.$('gc-rate'), g.latestRate, { decimals: 2, suffix: '%', duration: 1200 });
    DRC.countUp(DRC.$('gc-count'), g.latestCount);
    DRC.countUp(DRC.$('gc-delta'), g.deltaPp, { decimals: 2, prefix: '+', suffix: 'pp' });
  }
});

/* ---------- 2/3. 随访均值轨迹柱状图（体重 KG / 收缩压 mmHg 共用） ---------- */
function trajBarChart(id, values, yMax, yInterval, unit) {
  var t = DRC.data.trajectory;
  var chart = DRC.initChart(id);

  chart.setOption({
    textStyle: DRC.chartBase.textStyle,
    tooltip: Object.assign({
      trigger: 'axis', axisPointer: { type: 'shadow' },
      formatter: '队列均值<br/>{b} 次随访：<b style="color:#2AA0F0">{c}' + (unit ? ' ' + unit : '') + '</b>'
    }, DRC.chartBase.tooltip),
    legend: {
      right: 4, top: 0, itemWidth: 9, itemHeight: 9,
      textStyle: { color: '#8CA3C7', fontSize: 12 },
      data: ['队列均值']
    },
    grid: { left: 44, right: 10, top: 26, bottom: 22 },
    xAxis: {
      type: 'category',
      data: t.stages,
      axisLine: DRC.chartBase.axisLine,
      axisTick: { show: false },
      axisLabel: { color: '#C9DCF5', fontSize: 12, interval: 0 }
    },
    yAxis: {
      type: 'value', max: yMax, interval: yInterval,
      axisLabel: { color: '#8CA3C7', fontSize: 11 },
      axisLine: { show: false },
      splitLine: DRC.chartBase.splitLine
    },
    series: [{
      name: '队列均值',
      type: 'bar',
      barWidth: 16,
      // 直通顶部的半透明背景槽（ECharts 原生 showBackground）
      showBackground: true,
      backgroundStyle: { color: 'rgba(140,163,199,.12)', borderRadius: 2 },
      itemStyle: {
        borderRadius: [2, 2, 0, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#2AA0F0' },
          { offset: 1, color: 'rgba(42,92,216,.25)' }
        ])
      },
      emphasis: {
        itemStyle: { shadowBlur: 12, shadowColor: 'rgba(42,160,240,.6)' }
      },
      data: values
    }]
  });
  return chart;
}

DRC.registerModule('trajectory-bars', {
  init: function () {
    // 体重 ~68.4 KG → 轴 0-80；收缩压 ~130 mmHg → 轴 0-160
    var c1 = trajBarChart('chart-weight-traj', DRC.data.trajectory.weightKg, 80, 20, 'KG');
    var c2 = trajBarChart('chart-sbp-traj', DRC.data.trajectory.sbp, 160, 40, 'mmHg');
    DRC.tooltipTour(c1, { count: DRC.data.trajectory.stages.length });
    DRC.tooltipTour(c2, { count: DRC.data.trajectory.stages.length });
  }
});

/* ---------- 4. 指标达标率对比（基线 vs 末次 分组柱） ---------- */
DRC.registerModule('standard-rate', {
  init: function () {
    var s = DRC.data.standard;
    var chart = DRC.initChart('chart-standard');

    chart.setOption({
      textStyle: DRC.chartBase.textStyle,
      tooltip: Object.assign({ trigger: 'axis', axisPointer: { type: 'shadow' } }, DRC.chartBase.tooltip),
      legend: {
        right: 4, top: 0, itemWidth: 9, itemHeight: 9, itemGap: 12,
        textStyle: { color: '#8CA3C7', fontSize: 12 },
        data: ['基线达标率', '末次达标率']
      },
      grid: { left: 40, right: 10, top: 28, bottom: 22 },
      xAxis: {
        type: 'category',
        data: s.indicators,
        axisLine: DRC.chartBase.axisLine,
        axisTick: { show: false },
        axisLabel: { color: '#C9DCF5', fontSize: 12, interval: 0 }
      },
      yAxis: {
        type: 'value', max: 100, interval: 25,
        axisLabel: { formatter: '{value}%', color: '#8CA3C7', fontSize: 11 },
        axisLine: { show: false },
        splitLine: DRC.chartBase.splitLine
      },
      series: [
        {
          name: '基线达标率', type: 'bar', barWidth: 10, barGap: '40%',
          itemStyle: { borderRadius: [2, 2, 0, 0], color: '#2EC8A8' },
          emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(46,200,168,.55)' } },
          data: s.baseline
        },
        {
          name: '末次达标率', type: 'bar', barWidth: 10,
          itemStyle: {
            borderRadius: [2, 2, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#2AA0F0' },
              { offset: 1, color: '#1B4FB8' }
            ])
          },
          emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(42,160,240,.55)' } },
          data: s.latest
        }
      ]
    });

    DRC.tooltipTour(chart, { count: s.indicators.length });
  }
});

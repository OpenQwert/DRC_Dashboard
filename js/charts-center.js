/* ============================================================
 * charts-center.js — 中栏
 *   管理概况：4 张 KPI 玻璃卡 + 管理窗口月度趋势双轴折线
 *   院内数据汇总：4 列统计表（就诊测量真实口径）
 *   居家数据汇总：双环形打卡（按打卡频次分档）+ 6 列监测表
 * ============================================================ */

/* ---------- 管理概况：KPI 卡 + 趋势折线 ---------- */
DRC.registerModule('overview', {
  init: function () {
    var o = DRC.data.overview;

    // KPI 数字滚动
    DRC.countUp(DRC.$('kpi-managed'), o.totalManaged);
    DRC.countUp(DRC.$('kpi-visits'), o.totalVisits);
    DRC.countUp(DRC.$('kpi-app'), o.totalCgmUsers);
    // HTML 中的 <i>%</i> 单位由 countUp 的 suffix 拼接，先清空避免重复
    DRC.$('kpi-revisit').innerHTML = '';
    DRC.countUp(DRC.$('kpi-revisit'), o.revisitRate, { suffix: '%', decimals: 2 });
    DRC.$('kpi-today-enroll').textContent = o.todayEnrolled;
    DRC.$('kpi-today-visit').textContent = o.todayVisits;
    DRC.$('kpi-today-cgm').textContent = o.todayNewCgm;

    // 管理窗口月度趋势：就诊/CGM 左轴，检验测量次数右轴（量级差 6 倍+）
    var t = DRC.data.trend;
    var chart = DRC.initChart('chart-trend');

    var niceMax = function (arr) {
      var m = Math.max.apply(null, arr);
      var step = Math.pow(10, Math.floor(Math.log10(m))) / 2;
      return Math.ceil(m / step) * step;
    };
    var leftMax = niceMax(t.newVisits.concat(t.newCgm));
    var rightMax = niceMax(t.newMeasures);

    var line = function (name, data, color, yIdx) {
      return {
        name: name, type: 'line', smooth: true, showSymbol: false,
        symbol: 'circle', symbolSize: 7, yAxisIndex: yIdx || 0,
        lineStyle: { width: 2.4, color: color, shadowBlur: 7, shadowColor: color },
        itemStyle: { color: color },
        emphasis: { focus: 'series' },
        data: data
      };
    };

    chart.setOption({
      textStyle: DRC.chartBase.textStyle,
      tooltip: Object.assign({ trigger: 'axis', axisPointer: { type: 'line' } }, DRC.chartBase.tooltip),
      legend: {
        right: 10, top: 2, itemWidth: 18, itemHeight: 2, itemGap: 14,
        icon: 'rect',
        textStyle: { color: '#8CA3C7', fontSize: 12 },
        data: ['月度就诊人次', '月度检验测量次数', '月度CGM新增佩戴']
      },
      grid: { left: 46, right: 48, top: 34, bottom: 28 },
      xAxis: {
        type: 'category', boundaryGap: false,
        data: t.months,
        axisLine: DRC.chartBase.axisLine,
        axisTick: { show: false },
        axisLabel: { color: '#8CA3C7', fontSize: 12 }
      },
      yAxis: [
        {
          type: 'value', max: leftMax, interval: leftMax / 4,
          axisLabel: { color: '#8CA3C7', fontSize: 11 },
          axisLine: { show: false },
          splitLine: DRC.chartBase.splitLine
        },
        {
          type: 'value', max: rightMax, interval: rightMax / 4,
          axisLabel: { color: '#8CA3C7', fontSize: 11 },
          axisLine: { show: false },
          splitLine: { show: false }
        }
      ],
      series: [
        line('月度就诊人次', t.newVisits, '#2AA0F0'),
        line('月度检验测量次数', t.newMeasures, '#9FD4F9', 1),
        line('月度CGM新增佩戴', t.newCgm, '#FACC15')
      ]
    });

    // Tooltip 自动巡检（鼠标悬停时自动让位）
    DRC.tooltipTour(chart, { count: t.months.length, seriesIndex: 0 });
  },

  refresh: function (ch) {
    // 中频增量仅在 mock 模式产生（derived 为定数）
    if (ch.todayVisits != null) {
      DRC.$('kpi-today-visit').textContent = ch.todayVisits;
      DRC.countUp(DRC.$('kpi-visits'), ch.totalVisits);
    }
  }
});

/* ---------- 院内数据汇总表 ---------- */
DRC.registerModule('hospital-table', {
  init: function () {
    var rows = DRC.data.hospital.map(function (r) {
      return {
        name: r.sub
          ? r.name + '<br><i style="font-size:11px;color:#8CA3C7;font-style:normal">' + r.sub + '</i>'
          : r.name,
        total: DRC.fmtThousands(r.total),
        abnormal: DRC.fmtThousands(r.abnormal),
        ratio: r.ratio
      };
    });
    DRC.buildTable('table-hospital',
      [
        { label: '院内检查', key: 'name', cls: 'name', width: '31%' },
        { label: '总检查次数', key: 'total', cls: 'num' },
        { label: '异常次数', key: 'abnormal', cls: 'num' },
        { label: '异常占比', key: 'ratio', cls: 'hl' }
      ],
      rows
    );
  }
});

/* ---------- 居家数据汇总：双环打卡 + 监测表 ---------- */
function homeRing(id, cfg) {
  var chart = DRC.initChart(id);
  // 打卡频次分档（真实天数分桶：>=100 / 50-99 / 10-49 / <10 天）
  var layers = ['高频(≥100天)', '经常(50-99天)', '偶尔(10-49天)', '极少(<10天)'];
  var colors = ['#2AA0F0', '#2A5CD8', '#2EC8A8', '#5FD9C4'];

  chart.setOption({
    textStyle: DRC.chartBase.textStyle,
    tooltip: Object.assign({
      trigger: 'item',
      formatter: function (p) { return layers[p.dataIndex] + '：' + p.value + ' 人'; }
    }, DRC.chartBase.tooltip),
    title: {
      text: cfg.people + '',
      subtext: '人',
      left: 'center', top: '30%',
      textStyle: { fontSize: 23, fontWeight: 800, color: '#fff', fontFamily: 'Bahnschrift, Arial' },
      subtextStyle: { fontSize: 11, color: '#8CA3C7' }
    },
    series: [{
      type: 'pie',
      radius: ['58%', '82%'],
      center: ['50%', '50%'],
      itemStyle: { borderColor: '#0B1E3D', borderWidth: 2 },
      label: { show: false },
      labelLine: { show: false },
      emphasis: {
        scale: true, scaleSize: 5,
        itemStyle: { shadowBlur: 14, shadowColor: 'rgba(42,160,240,.5)' }
      },
      data: cfg.dist.map(function (v, i) {
        return { name: layers[i], value: v, itemStyle: { color: colors[i] } };
      })
    }]
  });
}

DRC.registerModule('home-summary', {
  init: function () {
    var h = DRC.data.home;

    homeRing('chart-diet', h.diet);
    homeRing('chart-sport', h.sport);
    DRC.countUp(DRC.$('diet-times'), h.diet.times);
    DRC.countUp(DRC.$('sport-times'), h.sport.times);

    var rows = h.monitors.map(function (r) {
      return {
        name: r.sub
          ? r.name + '<br><i style="font-size:11px;color:#8CA3C7;font-style:normal">' + r.sub + '</i>'
          : r.name,
        times: DRC.fmtThousands(r.times),
        abnormal: DRC.fmtThousands(r.abnormal),
        ratio: r.ratio,
        people: r.people,
        peopleRatio: r.peopleRatio
      };
    });
    DRC.buildTable('table-home',
      [
        { label: '居家数据', key: 'name', cls: 'name', width: '19%' },
        { label: '测量次数', key: 'times', cls: 'num' },
        { label: '异常次数', key: 'abnormal', cls: 'num' },
        { label: '异常占比', key: 'ratio', cls: 'hl' },
        { label: '测量人数', key: 'people', cls: 'num' },
        { label: '人数占比', key: 'peopleRatio', cls: 'hl' }
      ],
      rows
    );
  },

  refresh: function (ch) {
    // 打卡次数中频增量（仅 mock 模式）→ CountUp 滚动
    if (ch.dietTimes != null) DRC.countUp(DRC.$('diet-times'), ch.dietTimes);
    if (ch.sportTimes != null) DRC.countUp(DRC.$('sport-times'), ch.sportTimes);
  }
});

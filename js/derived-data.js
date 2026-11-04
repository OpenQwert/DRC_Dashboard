/* ============================================================
 * derived-data.js — 由 tools/derive_dashboard_data.py 自动生成, 勿手改
 * 数据源: virtual_t2dm_1000x180d v2.1 (reference 1000人)
 * 管理窗口: 2026-01-01 ~ 2026-06-29 · 今日锚点: 2026-06-29
 * ============================================================ */
DRC.derived = {
  "meta": {
    "dataset": "virtual_t2dm_1000x180d v2.1 (reference 1000人)",
    "window": "2026-01-01 ~ 2026-06-29",
    "anchor": "2026-06-29",
    "note": "challenge/debug/golden/scenarios 为评测集, 按方案不并入统计"
  },
  "overview": {
    "totalManaged": 1000,
    "todayEnrolled": 0,
    "totalVisits": 8174,
    "todayVisits": 1,
    "cgmUsers": 1000,
    "todayNewCgm": 0,
    "revisitRate": 87.77
  },
  "trend": {
    "months": [
      "2026年01月",
      "2026年02月",
      "2026年03月",
      "2026年04月",
      "2026年05月",
      "2026年06月"
    ],
    "newVisits": [
      587,
      495,
      486,
      308,
      283,
      128
    ],
    "newMeasures": [
      3840,
      3469,
      3358,
      1940,
      2033,
      856
    ],
    "newCgm": [
      968,
      730,
      607,
      412,
      262,
      41
    ]
  },
  "weightDist": {
    "underweight": 51,
    "normal": 343,
    "overweight": 390,
    "obese": 216,
    "total": 1000
  },
  "renalAlbum": {
    "items": [
      "白蛋白尿",
      "肾功能"
    ],
    "abnormal": [
      26.8,
      5.9
    ],
    "normal": [
      73.2,
      94.1
    ]
  },
  "genderDist": [
    {
      "name": "男",
      "value": 61.8,
      "color": "#2A5CD8"
    },
    {
      "name": "女",
      "value": 38.2,
      "color": "#F97316"
    }
  ],
  "ageSegCounts": [
    80,
    184,
    307,
    143,
    119,
    167
  ],
  "ageDist": [
    {
      "name": "40岁以下",
      "value": 8.0,
      "color": "#1B4FB8"
    },
    {
      "name": "40-50岁",
      "value": 18.4,
      "color": "#2A5CD8"
    },
    {
      "name": "50-60岁",
      "value": 30.7,
      "color": "#2AA0F0"
    },
    {
      "name": "60-65岁",
      "value": 14.3,
      "color": "#5FD9C4"
    },
    {
      "name": "65-70岁",
      "value": 11.9,
      "color": "#2EC8A8"
    },
    {
      "name": "70岁以上",
      "value": 16.7,
      "color": "#35D0B0"
    }
  ],
  "diseaseDist": [
    {
      "name": "2型糖尿病",
      "registered": 1000,
      "confirmed": 1000,
      "ratio": "100.00%"
    },
    {
      "name": "血脂异常",
      "registered": 1000,
      "confirmed": 469,
      "ratio": "46.90%"
    },
    {
      "name": "高血压",
      "registered": 1000,
      "confirmed": 459,
      "ratio": "45.90%"
    },
    {
      "name": "神经病变",
      "registered": 1000,
      "confirmed": 392,
      "ratio": "39.20%"
    },
    {
      "name": "慢性肾脏病",
      "registered": 1000,
      "confirmed": 298,
      "ratio": "29.80%"
    },
    {
      "name": "动脉粥样硬化性心血管疾病",
      "registered": 1000,
      "confirmed": 199,
      "ratio": "19.90%"
    },
    {
      "name": "视网膜病变",
      "registered": 1000,
      "confirmed": 167,
      "ratio": "16.70%"
    },
    {
      "name": "心力衰竭",
      "registered": 1000,
      "confirmed": 50,
      "ratio": "5.00%"
    }
  ],
  "hospital": [
    {
      "name": "血压",
      "sub": "",
      "total": 8174,
      "abnormal": 3560,
      "ratio": "43.55%"
    },
    {
      "name": "空腹血糖",
      "sub": "",
      "total": 3000,
      "abnormal": 2162,
      "ratio": "72.07%"
    },
    {
      "name": "糖化血红蛋白",
      "sub": "HbA1c",
      "total": 3000,
      "abnormal": 1936,
      "ratio": "64.53%"
    },
    {
      "name": "血脂",
      "sub": "LDL-C",
      "total": 3000,
      "abnormal": 1419,
      "ratio": "47.30%"
    },
    {
      "name": "肾功能",
      "sub": "eGFR",
      "total": 3000,
      "abnormal": 196,
      "ratio": "6.53%"
    }
  ],
  "home": {
    "diet": {
      "people": 493,
      "times": 44593,
      "dist": [
        217,
        143,
        109,
        24
      ]
    },
    "sport": {
      "people": 486,
      "times": 15111,
      "dist": [
        0,
        101,
        316,
        69
      ]
    },
    "monitors": [
      {
        "name": "CGM血糖",
        "sub": "动态血糖",
        "times": 44581,
        "abnormal": 22731,
        "ratio": "50.99%",
        "people": 493,
        "peopleRatio": "49.30%",
        "readings": 4260256
      },
      {
        "name": "指尖血糖",
        "sub": "SMBG",
        "times": 1597,
        "abnormal": 571,
        "ratio": "35.75%",
        "people": 493,
        "peopleRatio": "49.30%"
      },
      {
        "name": "睡眠监测",
        "sub": "",
        "times": 44593,
        "abnormal": 4874,
        "ratio": "10.93%",
        "people": 493,
        "peopleRatio": "49.30%"
      }
    ]
  },
  "glyControl": {
    "caption": "糖化血红蛋白达标率 (<7%)",
    "latestRate": 37.3,
    "latestCount": 373,
    "n": 1000,
    "baselineRate": 33.9,
    "deltaPp": 3.4,
    "avgBase": 8.41,
    "avgLast": 8.13,
    "avgDrop": 0.29
  },
  "trajectory": {
    "stages": [
      "F1",
      "F2",
      "F3",
      "F4",
      "F5",
      "F6"
    ],
    "weightKg": [
      68.37,
      68.35,
      68.4,
      68.39,
      68.36,
      68.37
    ],
    "sbp": [
      131.56,
      130.74,
      130.69,
      130.46,
      130.27,
      130.17
    ]
  },
  "standard": {
    "indicators": [
      "血压",
      "血糖",
      "糖化",
      "血脂",
      "肾功能"
    ],
    "baseline": [
      46.4,
      28.5,
      33.9,
      19.7,
      93.6
    ],
    "latest": [
      51.5,
      28.6,
      37.3,
      27.7,
      93.4
    ]
  }
};

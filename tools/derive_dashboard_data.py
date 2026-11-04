# -*- coding: utf-8 -*-
"""
derive_dashboard_data.py — 从 JENSIO_V3 mock 病人数据聚合出大屏全部指标
输出: js/derived-data.js (DRC.derived = {...})

数据源: virtual_t2dm_1000x180d (v2.1 reference 队列, 1000人)
       challenge / debug_patients / golden_cases / scenarios 为 Agent 评测集,
       按《数据合成方案》"分别统计不混合"原则不并入大屏统计。

阈值口径(脚本内注释可调):
  体重分层   中国标准: <18.5 过轻 | 18.5-24 正常 | 24-28 超重 | >=28 肥胖
  院内异常   血压 SBP>=140 或 DBP>=90 | 空腹血糖 >=7.0 | 糖化 >=7.0
             血脂 LDL>=2.6 | 肾功能 eGFR<60
  达标目标   血压 SBP<130 | 血糖 FPG<7.0 | 糖化 <7.0 | 血脂 LDL<1.8 | 肾功能 eGFR>=60
  居家异常   CGM 患者日 TIR<70% (覆盖>=70% 才计入) | 指尖血糖 >=10.0 或 <3.9 | 睡眠 <6h
"""
import csv, json, sys, io
from pathlib import Path
from statistics import mean

MOCK = Path(r"C:\Users\IPASON\Documents\JENSIO_V3\mock\virtual_t2dm_1000x180d")
OUT = Path(r"C:\Users\IPASON\Documents\DRC_Dashboard\js\derived-data.js")

W_START, W_END = "2026-01-01", "2026-06-29"   # 管理窗口(居家/趋势/今日锚点)
ANCHOR = W_END                                # "今日"锚点 = 数据末日

def r2(v): return round(v + 1e-12, 2)
def pct(num, den): return round(num / den * 100 + 1e-12, 2)
def pcts(num, den): return f"{pct(num, den):.2f}%"

def read_rows(path):
    with open(path, encoding="utf-8-sig", newline="") as f:
        r = csv.reader(f)
        header = next(r)
        return header, list(r)

def main():
    # ─────────── 患者主表 ───────────
    header, rows = read_rows(MOCK / "patients.csv")
    ix = {k: header.index(k) for k in
          ("patient_id","sex","age_years","bmi","egfr_baseline","uacr_baseline",
           "albuminuria_stage","hypertension","hyperlipidemia","ascvd","heart_failure",
           "retinopathy","neuropathy","frailty","ckd")}
    P = {}
    for row in rows:
        pid = row[ix["patient_id"]]
        P[pid] = {
            "sex": row[ix["sex"]], "age": float(row[ix["age_years"]]),
            "bmi": float(row[ix["bmi"]]), "egfr": float(row[ix["egfr_baseline"]]),
            "uacr": float(row[ix["uacr_baseline"]]), "alb": row[ix["albuminuria_stage"]],
            "htn": row[ix["hypertension"]] == "True", "hld": row[ix["hyperlipidemia"]] == "True",
            "ascvd": row[ix["ascvd"]] == "True", "hf": row[ix["heart_failure"]] == "True",
            "ret": row[ix["retinopathy"]] == "True", "neu": row[ix["neuropathy"]] == "True",
            "frail": row[ix["frailty"]] == "True", "ckd": row[ix["ckd"]] == "True",
        }
    N = len(P)
    total_managed = N

    # ── 1. 体重分布(中国 BMI 标准) ──
    wd = {"underweight": 0, "normal": 0, "overweight": 0, "obese": 0}
    for p in P.values():
        b = p["bmi"]
        if b < 18.5: wd["underweight"] += 1
        elif b < 24: wd["normal"] += 1
        elif b < 28: wd["overweight"] += 1
        else: wd["obese"] += 1
    wd["total"] = sum(wd.values())

    # ── 2. 肾功能、白蛋白尿(100% 堆叠柱: 正常/异常) ──
    alb_abn = sum(1 for p in P.values() if p["alb"] in ("A2", "A3"))
    egfr_abn = sum(1 for p in P.values() if p["egfr"] < 60)

    # ── 3. 性别、年龄 ──
    male = sum(1 for p in P.values() if p["sex"] == "male")
    female = N - male
    age_seg = [0]*6   # <40, 40-50, 50-60, 60-65, 65-70, >=70
    for p in P.values():
        a = p["age"]
        if a < 40: age_seg[0] += 1
        elif a < 50: age_seg[1] += 1
        elif a < 60: age_seg[2] += 1
        elif a < 65: age_seg[3] += 1
        elif a < 70: age_seg[4] += 1
        else: age_seg[5] += 1

    # ── 4. 疾病分布(合并症确诊人数, 降序取前8) ──
    diseases = [
        ("2型糖尿病", N),
        ("高血压", sum(1 for p in P.values() if p["htn"])),
        ("血脂异常", sum(1 for p in P.values() if p["hld"])),
        ("动脉粥样硬化性心血管疾病", sum(1 for p in P.values() if p["ascvd"])),
        ("慢性肾脏病", sum(1 for p in P.values() if p["ckd"])),
        ("视网膜病变", sum(1 for p in P.values() if p["ret"])),
        ("神经病变", sum(1 for p in P.values() if p["neu"])),
        ("心力衰竭", sum(1 for p in P.values() if p["hf"])),
        ("衰弱综合征", sum(1 for p in P.values() if p["frail"])),
    ]
    diseases.sort(key=lambda x: -x[1])
    disease_rows = [{"name": n, "registered": N, "confirmed": c, "ratio": pcts(c, N)}
                    for n, c in diseases[:8] if c > 0]

    # ─────────── 就诊 ───────────
    header, rows = read_rows(MOCK / "ehr_encounters.csv")
    ix = {k: header.index(k) for k in ("encounter_id","patient_id","date","reason_code")}
    total_visits = len(rows)
    today_visits = sum(1 for r in rows if r[ix["date"]][:10] == ANCHOR)
    followups = sum(1 for r in rows if r[ix["reason_code"]] != "initial_visit")
    revisit_rate = pct(followups, total_visits)
    # 月度就诊(管理窗口)
    m_visits = {m: 0 for m in ("2026-01","2026-02","2026-03","2026-04","2026-05","2026-06")}
    for r in rows:
        ym = r[ix["date"]][:7]
        if ym in m_visits: m_visits[ym] += 1

    # ─────────── 院内检查(就诊测量) ───────────
    header, rows = read_rows(MOCK / "ehr_observations.csv")
    obs_ix = {k: header.index(k) for k in
              ("patient_id","date","loinc","value","encounter_id")}  # 独立命名, 防闭包重绑定
    ix = obs_ix
    obs_by_code = {}
    for r in rows:
        obs_by_code.setdefault(r[ix["loinc"]], []).append(r)
    # 月度检验测量次数(管理窗口, 全部编码)
    m_meas = {m: 0 for m in m_visits}
    for r in rows:
        ym = r[ix["date"]][:7]
        if ym in m_meas: m_meas[ym] += 1

    def vals(code):
        return [(r[obs_ix["patient_id"]], r[obs_ix["date"]][:10], float(r[obs_ix["value"]]),
                 r[obs_ix["encounter_id"]]) for r in obs_by_code.get(code, [])]

    # 血压: SBP 计数, 异常 = SBP>=140 或同次就诊 DBP>=90
    sbp = vals("8480-6"); dbp = vals("8462-4")
    dbp_by_enc = {e: v for _, _, v, e in dbp}
    bp_abn = sum(1 for _, _, v, e in sbp if v >= 140 or dbp_by_enc.get(e, 0) >= 90)
    fpg = vals("1558-6"); a1c = vals("4548-4"); ldl = vals("13457-7"); egfr_o = vals("33914-3")

    def abn(seq, cond): return sum(1 for _, _, v, _ in seq if cond(v))
    hospital = [
        {"name": "血压",     "sub": "", "total": len(sbp),   "abnormal": bp_abn,
         "ratio": pcts(bp_abn, len(sbp))},
        {"name": "空腹血糖", "sub": "", "total": len(fpg),   "abnormal": abn(fpg, lambda v: v >= 7.0),
         "ratio": pcts(abn(fpg, lambda v: v >= 7.0), len(fpg))},
        {"name": "糖化血红蛋白", "sub": "HbA1c", "total": len(a1c),
         "abnormal": abn(a1c, lambda v: v >= 7.0),
         "ratio": pcts(abn(a1c, lambda v: v >= 7.0), len(a1c))},
        {"name": "血脂",     "sub": "LDL-C", "total": len(ldl),
         "abnormal": abn(ldl, lambda v: v >= 2.6),
         "ratio": pcts(abn(ldl, lambda v: v >= 2.6), len(ldl))},
        {"name": "肾功能",   "sub": "eGFR", "total": len(egfr_o),
         "abnormal": abn(egfr_o, lambda v: v < 60),
         "ratio": pcts(abn(egfr_o, lambda v: v < 60), len(egfr_o))},
    ]

    # 首末次配对(达标率/疗效): 每患者按日期排序取首/末
    def first_last(seq):
        d = {}
        for pid, dt, v, _ in seq: d.setdefault(pid, []).append((dt, v))
        out = {}
        for pid, lst in d.items():
            lst.sort(); out[pid] = (lst[0][1], lst[-1][1])
        return out
    fl_sbp, fl_fpg, fl_a1c = first_last(sbp), first_last(fpg), first_last(a1c)
    fl_ldl, fl_egfr = first_last(ldl), first_last(egfr_o)

    # 随访轨迹 F1~F6: 每患者按日期排序, 逐次取均值
    def traj(seq, k=6):
        d = {}
        for pid, dt, v, _ in seq: d.setdefault(pid, []).append((dt, v))
        acc = [[] for _ in range(k)]
        for pid, lst in d.items():
            lst.sort()
            for i in range(min(k, len(lst))): acc[i].append(lst[i][1])
        return [round(mean(a), 2) if a else None for a in acc]

    # 随访轨迹: 每患者按日期排序, 逐次取均值 (k 次)
    def traj_vals(code, k=6):
        d = {}
        for r in obs_by_code.get(code, []):
            d.setdefault(r[obs_ix["patient_id"]], []).append(
                (r[obs_ix["date"]], float(r[obs_ix["value"]])))
        acc = [[] for _ in range(k)]
        for pid, lst in d.items():
            lst.sort()
            for i in range(min(k, len(lst))): acc[i].append(lst[i][1])
        return [round(mean(a), 2) if a else None for a in acc]

    traj_weight = traj_vals("29463-7")
    traj_sbp = traj_vals("8480-6")

    # ── 血糖控制成效(右栏主指标) ──
    a1c_n = len(fl_a1c)
    base_ok = sum(1 for b, _ in fl_a1c.values() if b < 7.0)
    last_ok = sum(1 for _, l in fl_a1c.values() if l < 7.0)
    base_rate, last_rate = pct(base_ok, a1c_n), pct(last_ok, a1c_n)
    avg_base = mean(b for b, _ in fl_a1c.values())
    avg_last = mean(l for _, l in fl_a1c.values())

    # ── 达标率对比(基线 vs 末次, 5 指标) ──
    def rate(fl, cond):
        ok_b = sum(1 for b, _ in fl.values() if cond(b))
        ok_l = sum(1 for _, l in fl.values() if cond(l))
        return pct(ok_b, len(fl)), pct(ok_l, len(fl))
    r_bp = rate(fl_sbp, lambda v: v < 130)
    r_fpg = rate(fl_fpg, lambda v: v < 7.0)
    r_a1c = rate(fl_a1c, lambda v: v < 7.0)
    r_ldl = rate(fl_ldl, lambda v: v < 1.8)
    r_egfr = rate(fl_egfr, lambda v: v >= 60)

    # ─────────── 居家数据 ───────────
    # 饮食/运动打卡 + 睡眠( lifestyle_daily, 管理窗口 )
    header, rows = read_rows(MOCK / "lifestyle_daily.csv")
    ix = {k: header.index(k) for k in
          ("patient_id","date","exercise_min","steps","sleep_hours",
           "carb_breakfast_g","carb_lunch_g","carb_dinner_g")}
    diet_days, diet_pids, sport_days, sport_pids, sleep_days, sleep_abn, sleep_pids = 0, set(), 0, set(), 0, 0, set()
    diet_days_by_p, sport_days_by_p = {}, {}   # 每人打卡天数(环图频次分桶用)
    for r in rows:
        dt = r[ix["date"]]
        if not (W_START <= dt <= W_END): continue
        pid = r[ix["patient_id"]]
        if float(r[ix["carb_breakfast_g"]]) + float(r[ix["carb_lunch_g"]]) + float(r[ix["carb_dinner_g"]]) > 0:
            diet_days += 1; diet_pids.add(pid)
            diet_days_by_p[pid] = diet_days_by_p.get(pid, 0) + 1
        if float(r[ix["exercise_min"]]) > 0:
            sport_days += 1; sport_pids.add(pid)
            sport_days_by_p[pid] = sport_days_by_p.get(pid, 0) + 1
        sh = float(r[ix["sleep_hours"]])
        if sh > 0:
            sleep_days += 1; sleep_pids.add(pid)
            if sh < 6: sleep_abn += 1

    def freq_buckets(days_by_p):
        """按打卡天数分 4 档: >=100 / 50-99 / 10-49 / <10"""
        b = [0, 0, 0, 0]
        for n in days_by_p.values():
            if n >= 100: b[0] += 1
            elif n >= 50: b[1] += 1
            elif n >= 10: b[2] += 1
            else: b[3] += 1
        return b

    diet_dist = freq_buckets(diet_days_by_p)
    sport_dist = freq_buckets(sport_days_by_p)

    # CGM(患者日)
    header, rows = read_rows(MOCK / "cgm_daily_summary.csv")
    ix = {k: header.index(k) for k in
          ("patient_id","date","tir_3_9_10","valid_readings","coverage_fraction")}
    cgm_days, cgm_day_cnt, cgm_abn_days, cgm_pids = 0, 0, 0, set()
    for r in rows:
        dt = r[ix["date"]]
        if not (W_START <= dt <= W_END): continue
        cov = float(r[ix["coverage_fraction"]])
        if cov < 0.7: continue
        pid = r[ix["patient_id"]]
        cgm_days += int(r[ix["valid_readings"]])   # 测量次数(读数级)
        cgm_day_cnt += 1                           # 有效监测患者日
        cgm_pids.add(pid)
        if float(r[ix["tir_3_9_10"]]) < 0.7: cgm_abn_days += 1
    cgm_ratio = pcts(cgm_abn_days, cgm_day_cnt)    # 异常占比 = 异常患者日/有效患者日(同单位)

    # 指尖血糖(居家 SMBG, 管理窗口)
    smb = [x for x in vals("41653-7") if W_START <= x[1] <= W_END]
    smb_abn = sum(1 for _, _, v, _ in smb if v >= 10.0 or v < 3.9)
    smb_pids = {p for p, _, _, _ in smb}

    home_monitors = [
        # 测量次数口径 = 有效监测患者日(与异常患者日同单位, 钩稽自洽); 读数级总量另行备注
        {"name": "CGM血糖", "sub": "动态血糖", "times": cgm_day_cnt,
         "abnormal": cgm_abn_days, "ratio": cgm_ratio,
         "people": len(cgm_pids), "peopleRatio": pcts(len(cgm_pids), total_managed),
         "readings": cgm_days},
        {"name": "指尖血糖", "sub": "SMBG", "times": len(smb),
         "abnormal": smb_abn, "ratio": pcts(smb_abn, len(smb)),
         "people": len(smb_pids), "peopleRatio": pcts(len(smb_pids), total_managed)},
        {"name": "睡眠监测", "sub": "", "times": sleep_days,
         "abnormal": sleep_abn, "ratio": pcts(sleep_abn, sleep_days),
         "people": len(sleep_pids), "peopleRatio": pcts(len(sleep_pids), total_managed)},
    ]

    # CGM 佩戴(KPI + 月度新增)
    header, rows = read_rows(MOCK / "sensor_sessions.csv")
    ix = {k: header.index(k) for k in ("patient_id","start_time")}
    cgm_users = {r[ix["patient_id"]] for r in rows}
    today_cgm = sum(1 for r in rows if r[ix["start_time"]][:10] == ANCHOR)
    m_cgm = {m: 0 for m in m_visits}
    for r in rows:
        ym = r[ix["start_time"]][:7]
        if ym in m_cgm: m_cgm[ym] += 1

    # ─────────── 汇总输出 ───────────
    months = ["2026年01月","2026年02月","2026年03月","2026年04月","2026年05月","2026年06月"]
    data = {
        "meta": {
            "dataset": "virtual_t2dm_1000x180d v2.1 (reference 1000人)",
            "window": W_START + " ~ " + W_END, "anchor": ANCHOR,
            "note": "challenge/debug/golden/scenarios 为评测集, 按方案不并入统计",
        },
        "overview": {
            "totalManaged": total_managed,
            "todayEnrolled": 0,   # 入组均在 2026-01, 锚点日无新入组
            "totalVisits": total_visits,
            "todayVisits": today_visits,
            "cgmUsers": len(cgm_users),
            "todayNewCgm": today_cgm,
            "revisitRate": revisit_rate,
        },
        "trend": {
            "months": months,
            "newVisits": [m_visits[m] for m in sorted(m_visits)],
            "newMeasures": [m_meas[m] for m in sorted(m_meas)],
            "newCgm": [m_cgm[m] for m in sorted(m_cgm)],
        },
        "weightDist": wd,
        "renalAlbum": {
            "items": ["白蛋白尿", "肾功能"],
            "abnormal": [pct(alb_abn, N), pct(egfr_abn, N)],
            "normal": [r2(100 - pct(alb_abn, N)), r2(100 - pct(egfr_abn, N))],
        },
        "genderDist": [
            {"name": "男", "value": pct(male, N), "color": "#2A5CD8"},
            {"name": "女", "value": pct(female, N), "color": "#F97316"},
        ],
        "ageSegCounts": age_seg,
        "ageDist": [
            {"name": n, "value": pct(c, N), "color": c_color}
            for n, c, c_color in zip(
                ["40岁以下","40-50岁","50-60岁","60-65岁","65-70岁","70岁以上"],
                age_seg, ["#1B4FB8","#2A5CD8","#2AA0F0","#5FD9C4","#2EC8A8","#35D0B0"])
        ],
        "diseaseDist": disease_rows,
        "hospital": hospital,
        "home": {
            "diet": {"people": len(diet_pids), "times": diet_days, "dist": diet_dist},
            "sport": {"people": len(sport_pids), "times": sport_days, "dist": sport_dist},
            "monitors": home_monitors,
        },
        "glyControl": {
            "caption": "糖化血红蛋白达标率 (<7%)",
            "latestRate": last_rate, "latestCount": last_ok, "n": a1c_n,
            "baselineRate": base_rate, "deltaPp": r2(last_rate - base_rate),
            "avgBase": round(avg_base, 2), "avgLast": round(avg_last, 2),
            "avgDrop": r2(avg_base - avg_last),
        },
        "trajectory": {
            "stages": ["F1","F2","F3","F4","F5","F6"],
            "weightKg": traj_weight, "sbp": traj_sbp,
        },
        "standard": {
            "indicators": ["血压", "血糖", "糖化", "血脂", "肾功能"],
            "baseline": [r_bp[0], r_fpg[0], r_a1c[0], r_ldl[0], r_egfr[0]],
            "latest": [r_bp[1], r_fpg[1], r_a1c[1], r_ldl[1], r_egfr[1]],
        },
    }

    OUT.write_text(
        "/* ============================================================\n"
        " * derived-data.js — 由 tools/derive_dashboard_data.py 自动生成, 勿手改\n"
        f" * 数据源: {data['meta']['dataset']}\n"
        f" * 管理窗口: {data['meta']['window']} · 今日锚点: {ANCHOR}\n"
        " * ============================================================ */\n"
        "DRC.derived = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8")

    # 控制台摘要(供交叉校验)
    print("=== 聚合完成 ===")
    print(f"管理人数 {total_managed} | 就诊 {total_visits} (今日 {today_visits}) | 复诊率 {revisit_rate}%")
    print(f"CGM佩戴 {len(cgm_users)} 人 (今日新增 {today_cgm})")
    print(f"体重分层: {wd}")
    print(f"白蛋白尿异常 {alb_abn} ({pct(alb_abn,N)}%) | eGFR<60 {egfr_abn} ({pct(egfr_abn,N)}%)")
    print(f"性别 男{male}/女{female} | 年龄段 {age_seg}")
    print(f"院内: " + "; ".join(f"{h['name']} {h['total']}/{h['abnormal']}={h['ratio']}" for h in hospital))
    print(f"居家打卡: 饮食 {len(diet_pids)}人/{diet_days}次 分桶{diet_dist} | 运动 {len(sport_pids)}人/{sport_days}次 分桶{sport_dist}")
    print(f"居家监测: " + "; ".join(f"{m['name']} {m['times']}/{m['abnormal']}={m['ratio']} {m['people']}人={m['peopleRatio']}" + (f" (读数{m.get('readings')})" if m.get('readings') else "") for m in home_monitors))
    print(f"糖化: 达标 {base_rate}% -> {last_rate}% (n={a1c_n}), 均值 {avg_base:.2f}->{avg_last:.2f}")
    print(f"轨迹体重: {traj_weight}")
    print(f"轨迹收缩压: {traj_sbp}")
    print(f"达标率 基线 {data['standard']['baseline']}")
    print(f"达标率 末次 {data['standard']['latest']}")
    print(f"月度就诊 {data['trend']['newVisits']} | 月度测量 {data['trend']['newMeasures']} | 月度CGM {data['trend']['newCgm']}")
    print(f"输出: {OUT} ({OUT.stat().st_size} bytes)")

if __name__ == "__main__":
    main()

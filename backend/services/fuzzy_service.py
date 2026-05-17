"""
Fuzzy logic service — port langsung dari fuzzy_logic.ipynb (file #4).
Membership functions, rules, dan grading thresholds identik dengan notebook user.

Catatan implementasi:
- skfuzzy ControlSystemSimulation TIDAK thread-safe. Untuk FastAPI yang
  multi-threaded, kita rebuild simulation per-request untuk amannya.
- Versi cached optimasi bisa ditambahkan nanti dengan asyncio.Lock.
"""
import numpy as np
import skfuzzy as fuzz
from skfuzzy import control as ctrl


def _preprocess(weight_g, total_beans, moldy, black, defective):
    bean_count_100g = (total_beans / weight_g) * 100 if weight_g > 0 else 0
    pct_moldy = (moldy / total_beans) * 100 if total_beans > 0 else 0
    pct_black = (black / total_beans) * 100 if total_beans > 0 else 0
    pct_defective = (defective / total_beans) * 100 if total_beans > 0 else 0
    return {
        "bean_count_100g": bean_count_100g,
        "pct_moldy": pct_moldy,
        "pct_black": pct_black,
        "pct_defective": pct_defective,
    }


def _build_block1():
    """Blok 1: Evaluasi Cacat Visual."""
    jamur = ctrl.Antecedent(np.arange(0, 101, 1), "jamur")
    hitam = ctrl.Antecedent(np.arange(0, 101, 1), "hitam")
    cacat_fisik = ctrl.Antecedent(np.arange(0, 101, 1), "cacat_fisik")
    skor_cacat = ctrl.Consequent(np.arange(0, 101, 1), "skor_cacat")

    jamur["rendah"] = fuzz.trapmf(jamur.universe, [0, 0, 1, 2])
    jamur["sedang"] = fuzz.trimf(jamur.universe, [1, 2.5, 4])
    jamur["tinggi"] = fuzz.trapmf(jamur.universe, [3, 5, 100, 100])

    hitam["rendah"] = fuzz.trapmf(hitam.universe, [0, 0, 2, 4])
    hitam["sedang"] = fuzz.trimf(hitam.universe, [3, 5, 8])
    hitam["tinggi"] = fuzz.trapmf(hitam.universe, [6, 10, 100, 100])

    cacat_fisik["rendah"] = fuzz.trapmf(cacat_fisik.universe, [0, 0, 4, 7])
    cacat_fisik["sedang"] = fuzz.trimf(cacat_fisik.universe, [5, 8, 12])
    cacat_fisik["tinggi"] = fuzz.trapmf(cacat_fisik.universe, [10, 15, 100, 100])

    skor_cacat["rendah"] = fuzz.trimf(skor_cacat.universe, [0, 0, 40])
    skor_cacat["sedang"] = fuzz.trimf(skor_cacat.universe, [30, 50, 70])
    skor_cacat["tinggi"] = fuzz.trimf(skor_cacat.universe, [60, 100, 100])

    rules = [
        ctrl.Rule(jamur["tinggi"] | hitam["tinggi"], skor_cacat["tinggi"]),
        ctrl.Rule(jamur["sedang"] & (hitam["sedang"] | cacat_fisik["tinggi"]), skor_cacat["tinggi"]),
        ctrl.Rule(jamur["rendah"] & hitam["sedang"] & cacat_fisik["sedang"], skor_cacat["sedang"]),
        ctrl.Rule(jamur["rendah"] & hitam["rendah"] & cacat_fisik["tinggi"], skor_cacat["sedang"]),
        ctrl.Rule(jamur["rendah"] & hitam["rendah"] & cacat_fisik["sedang"], skor_cacat["rendah"]),
        ctrl.Rule(jamur["rendah"] & hitam["rendah"] & cacat_fisik["rendah"], skor_cacat["rendah"]),
        ctrl.Rule(jamur["sedang"] & hitam["rendah"] & cacat_fisik["rendah"], skor_cacat["sedang"]),
    ]
    return ctrl.ControlSystemSimulation(ctrl.ControlSystem(rules))


def _build_block2():
    """Blok 2: Penentuan Mutu Akhir."""
    bean_count = ctrl.Antecedent(np.arange(50, 151, 1), "bean_count")
    skor_cacat_input = ctrl.Antecedent(np.arange(0, 101, 1), "skor_cacat_input")
    skor_mutu = ctrl.Consequent(np.arange(0, 101, 1), "skor_mutu")

    skor_cacat_input["rendah"] = fuzz.trimf(skor_cacat_input.universe, [0, 0, 40])
    skor_cacat_input["sedang"] = fuzz.trimf(skor_cacat_input.universe, [30, 50, 70])
    skor_cacat_input["tinggi"] = fuzz.trimf(skor_cacat_input.universe, [60, 100, 100])

    bean_count["bagus"] = fuzz.trapmf(bean_count.universe, [50, 50, 80, 100])
    bean_count["sedang"] = fuzz.trimf(bean_count.universe, [90, 110, 130])
    bean_count["buruk"] = fuzz.trapmf(bean_count.universe, [120, 140, 150, 150])

    skor_mutu["mutu_3"] = fuzz.trimf(skor_mutu.universe, [0, 0, 40])
    skor_mutu["mutu_2"] = fuzz.trimf(skor_mutu.universe, [30, 50, 70])
    skor_mutu["mutu_1"] = fuzz.trimf(skor_mutu.universe, [60, 100, 100])

    rules = [
        ctrl.Rule(bean_count["bagus"] & skor_cacat_input["rendah"], skor_mutu["mutu_1"]),
        ctrl.Rule(bean_count["sedang"] & skor_cacat_input["rendah"], skor_mutu["mutu_2"]),
        ctrl.Rule(bean_count["bagus"] & skor_cacat_input["sedang"], skor_mutu["mutu_2"]),
        ctrl.Rule(bean_count["buruk"] | skor_cacat_input["tinggi"], skor_mutu["mutu_3"]),
        ctrl.Rule(bean_count["sedang"] & skor_cacat_input["sedang"], skor_mutu["mutu_3"]),
    ]
    return ctrl.ControlSystemSimulation(ctrl.ControlSystem(rules))


def jalankan_sistem_fuzzy(weight_g, total_beans, moldy, black, defective, harga_config):
    """
    harga_config: {"mutu_1": 50000, "mutu_2": 42000, "mutu_3": 33000}
    Returns: dict { bean_count_100g, skor_cacat_internal, fuzzy_value, grade, estimasi_harga_per_kg }
    """
    data = _preprocess(weight_g, total_beans, moldy, black, defective)

    sim1 = _build_block1()
    sim1.input["jamur"] = data["pct_moldy"]
    sim1.input["hitam"] = data["pct_black"]
    sim1.input["cacat_fisik"] = data["pct_defective"]
    sim1.compute()
    skor_cacat = sim1.output["skor_cacat"]

    sim2 = _build_block2()
    bean_count_val = max(50, min(150, data["bean_count_100g"]))
    sim2.input["bean_count"] = bean_count_val
    sim2.input["skor_cacat_input"] = skor_cacat
    sim2.compute()
    skor_mutu = sim2.output["skor_mutu"]

    if skor_mutu >= 70:
        grade = "Mutu I"
        pos = (skor_mutu - 70) / 30
        harga = harga_config["mutu_2"] + pos * (harga_config["mutu_1"] - harga_config["mutu_2"])
    elif skor_mutu >= 40:
        grade = "Mutu II"
        pos = (skor_mutu - 40) / 30
        harga = harga_config["mutu_3"] + pos * (harga_config["mutu_2"] - harga_config["mutu_3"])
    else:
        grade = "Mutu III"
        pos = skor_mutu / 40
        harga = pos * harga_config["mutu_3"]

    return {
        "bean_count_100g": round(data["bean_count_100g"], 2),
        "skor_cacat_internal": round(skor_cacat, 2),
        "fuzzy_value": round(skor_mutu / 100, 3),
        "grade": grade,
        "estimasi_harga_per_kg": round(harga, 2),
    }

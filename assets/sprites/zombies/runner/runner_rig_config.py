# Runner (Iramodó) — vágási határok + rig-config
# ================================================
# A runner_raw.png (1024x1024, valódi alfa) tartalom-elemzéséből kimérve.
# A te PART_RIG_PIPELINE.md 3-4. pontod formátumát követi.
#
# FONTOS ELTÉRÉS a Kóbortól: a runner futó-pózban van, BALRA dőlve
# (fej a jobb oldalon, x~750; a hátsó kar fel-balra nyúlik, az elülső
# kar le-balra lóg). A test-arányok emiatt teljesen mások, mint a
# Kóboré — ezért kellett újramérni (nem másolható a Kóbor configja).
#
# Mért referencia-pontok (pixel, 1024x1024 térben):
#   Fej teteje:      y = 114
#   Talp (alsó láb): y = 929
#   Nyak (fej a vállon ül, szűkület vége): y ~ 205
#   Csípő-vonal (lábak szétválása kezdődik): y ~ 575
#   Alak vízszintes közepe (medián): x = 565
#   Csípő közepe (y=580 rés közepe): x ~ 502

# ------------------------------------------------------------------
# cut_parts.py HATÁROK (másold a Runner cut_parts.py-jába)
# ------------------------------------------------------------------
# A runner BALRA néz, ezért a "front" (elülső) kar a bal-alsó lelógó kar,
# a "back" kar a törzzsel marad (fel-balra nyúló). A lábak diagonálisan
# szétnyílnak: a hátsó láb bal-lent (x kicsi), az elülső láb jobb-lent.

CUT_RULES = {
    # head: fej + nyak, a váll felett
    "head":      lambda x, y: y < 210,

    # arm_front: az elülső, lelógó kar (bal-alsó, ferde vágóvonal).
    # A kar a válltól (~x430,y360) lefelé-balra lóg a kézig (~x290,y470).
    "arm_front": lambda x, y: (350 <= y <= 495) and (x < 430 - (y - 350) * 0.30),

    # torso: törzs + hátsó (fel-balra nyúló) kar. y 195..600, ami nem kar és nem láb.
    "torso":     lambda x, y: (195 <= y < 600),

    # leg_back: a hátrafelé nyúló bal láb (kis x), y >= 575
    "leg_back":  lambda x, y: (y >= 575) and (x < 502),

    # leg_front: az előre nyúló jobb láb (nagy x), y >= 575
    "leg_front": lambda x, y: (y >= 575) and (x >= 502),
}
# Megjegyzés: a torso és a lábak/kar között pár px szándékos átfedés
# elrejti a varratokat forgáskor (ahogy a Kóbornál is).

# ------------------------------------------------------------------
# RIGS['runner'] BEJEGYZÉS (másold a js/part_rig.js RIGS regiszterébe)
# ------------------------------------------------------------------
RIGS_RUNNER_JS = r"""
runner: {
  src: 'assets/sprites/zombies/runner/',
  parts: ['head','torso','arm_front','leg_back','leg_front'],
  anchor:  { x:502, y:929 },        // TALP (csípő-közép x, alsó láb y)
  contentH: 815,                    // 929 - 114 (fej teto)
  height:   50,                     // kirajzolt magasság (runner kicsit nyúlánkabb)
  pivots: {                         // ízületek = forgáspontok
    neck:     { x:715, y:210 },     // fej forog a nyak körül (jobb oldal!)
    shoulder: { x:445, y:355 },     // elülső kar forog a váll körül
    hipB:     { x:470, y:585 },     // hátsó láb csípője
    hipF:     { x:540, y:585 },     // elülső láb csípője
  },
  cent: {                           // testrész-középpontok (gib forgásközéppont)
    head:      { x:755, y:175 },
    torso:     { x:560, y:400 },
    arm_front: { x:355, y:415 },
    leg_back:  { x:300, y:760 },
    leg_front: { x:700, y:730 },
  },
  order: ['leg_back','torso','head','leg_front','arm_front'],  // hátulról előre
  // hangolás (a Kóbor-alapról indulva, futó-típusra gyorsabb ütem):
  legSwing: 14,      // futó = nagyobb láblengés, mint a walker (10)
  armSwing: 8,
  cadence:  2.6,     // gyorsabb járásütem (walker 2.0)
}
"""

if __name__ == "__main__":
    print("Runner rig-config kimérve. Másold a RIGS_RUNNER_JS tartalmát a")
    print("js/part_rig.js RIGS regiszterébe, a CUT_RULES-t pedig a runner")
    print("cut_parts.py-jába. A pivot/cent értékek a runner_raw.png valódi")
    print("tartalom-elemzéséből származnak (nem tippelt).")
    print()
    print(RIGS_RUNNER_JS)

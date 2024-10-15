import json

wrMultipliers = {
    0.99: 1.0,
    1.0: 0.99,
    1.01: 0.98,
    1.02: 0.97,
    1.03: 0.96,
    1.04: 0.95,
    1.05: 0.94,
    1.06: 0.93,
    1.08: 0.92,
    1.09: 0.91,
    1.10: 0.90,
    1.11: 0.89,
    1.13: 0.88,
    1.14: 0.87,
    1.15: 0.86,
    1.16: 0.85,
    1.18: 0.84,
    1.19: 0.83,
    1.21: 0.82,
    1.22: 0.81,
    1.24: 0.80,
    1.25: 0.79,
    1.27: 0.78,
    1.29: 0.77,
    1.30: 0.76,
    1.32: 0.75,
    1.34: 0.74,
    1.36: 0.73,
    1.38: 0.72,
    1.39: 0.71,
    1.41: 0.70,
    1.43: 0.69,
    1.46: 0.68,
    1.48: 0.67,
    1.5: 0.66,
    1.52: 0.65,
    1.55: 0.64,
    1.57: 0.63,
    1.6: 0.62,
    1.62: 0.61,
    1.65: 0.60,
    1.68: 0.59,
    1.71: 0.58,
    1.74: 0.57,
    1.77: 0.56,
    1.8: 0.55,
    1.83: 0.54,
    1.87: 0.53,
    1.9: 0.52,
    1.94: 0.51,
    1.98: 0.50,
    2.02: 0.49,
    2.06: 0.48,
    2.11: 0.47,
    2.15: 0.46,
    2.20: 0.45,
    2.25: 0.44,
    2.3: 0.43,
    2.36: 0.42,
    2.41: 0.41,
    2.47: 0.40,
    2.54: 0.39,
    2.61: 0.38,
    2.68: 0.37,
    2.75: 0.36,
    2.83: 0.35,
    2.91: 0.34,
    3.0: 0.33,
    3.09: 0.32,
    3.19: 0.31,
    3.30: 0.30,
    3.41: 0.29,
    3.54: 0.28,
    3.67: 0.27,
    3.81: 0.26,
    3.96: 0.25,
    4.13: 0.24,
    4.30: 0.23,
    4.50: 0.22,
    4.71: 0.21,
    4.95: 0.20,
    5.21: 0.19,
    5.50: 0.18,
    5.82: 0.17,
    6.19: 0.16,
    6.60: 0.15,
    7.07: 0.14,
    7.62: 0.13,
    8.25: 0.12,
    9.0: 0.11,
    9.90: 0.10,
    11.0: 0.09,
    12.38: 0.08,
    14.14: 0.07,
    16.5: 0.06,
    19.8: 0.05,
    24.75: 0.04,
    33.0: 0.03,
    49.5: 0.02,
    99.0: 0.01,
}

MIN_NEG_EV = -25

filterMultipliers = []

def calculateEVs(betMinRange, betMaxRange: int):

    betsEVs = {}
    for bet in range(betMinRange, betMaxRange + 1):
        expectedValues = {}
        for multiplier in wrMultipliers.keys():
            if multiplier not in filterMultipliers and len(filterMultipliers) != 0: continue
            winRate = wrMultipliers[multiplier]
            expectedValue = round(((round(bet * multiplier) - bet) * winRate) + (bet * -1 * (1 - winRate)), 4)
            if expectedValue >= MIN_NEG_EV:
                expectedValues[multiplier] = expectedValue
        betsEVs[bet] = expectedValues
    return betsEVs


def getBestEVs(bestEVs: dict):
    betMultTopCombos = {}
    betMultTopNegCombos = {}
    for betValue in bestEVs.keys():
        greatestEV = 0
        greatestNegEV = MIN_NEG_EV
        multiplier = None
        multiplierNeg = None
        for mult in bestEVs[betValue].keys():
            if bestEVs[betValue][mult] > greatestEV:
                greatestEV = bestEVs[betValue][mult]
                multiplier = mult
            elif greatestNegEV < bestEVs[betValue][mult] < 0:
                greatestNegEV = bestEVs[betValue][mult]
                multiplierNeg = mult
        if greatestEV != 0:
            betMultTopCombos[betValue] = (multiplier, greatestEV)
        if greatestNegEV != MIN_NEG_EV:
            betMultTopNegCombos[betValue] = (multiplierNeg, greatestNegEV)
    print(json.dumps(betMultTopNegCombos, indent=1))
    return json.dumps(betMultTopCombos, indent=1)


if __name__ == '__main__':
    print(getBestEVs(calculateEVs(0, 10000)))

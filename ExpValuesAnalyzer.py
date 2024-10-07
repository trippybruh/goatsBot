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
}


def calculateEVs(betMaxRange: int):
    betsEVs = {}
    for bet in range(1, betMaxRange + 1):
        expectedValues = {}
        for multiplier in wrMultipliers.keys():
            winRate = wrMultipliers[multiplier]
            expectedValue = round(((round(bet * multiplier) - bet) * winRate) + (bet * -1 * (1 - winRate)), 4)
            if expectedValue >= 0:
                expectedValues[multiplier] = expectedValue
        betsEVs[bet] = expectedValues
    return betsEVs


def getBestEVs(bestEVs: dict):
    betMultTopCombos = {}
    for betValue in bestEVs.keys():
        greatestEV = 0
        multiplier = None
        for mult in bestEVs[betValue].keys():
            if bestEVs[betValue][mult] > greatestEV:
                greatestEV = bestEVs[betValue][mult]
                multiplier = mult
        if greatestEV != 0:
            betMultTopCombos[betValue] = (multiplier, greatestEV)
    return json.dumps(betMultTopCombos, indent=1)


if __name__ == '__main__':
    print(getBestEVs(calculateEVs(100)))

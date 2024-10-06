const Chance = require('chance');
const chance = new Chance();

// head or tail game config
const totalBets = 50000;
const betAmount = 2000;
const expectedVolume = totalBets * betAmount * 1.5; // non torna in app

// head or tail game stats
let winRate = 0;
let winCount = 0;
let lossCount = 0;
let winStreakCount = 0;
let lossStreakCount = 0;
let lastResult = true;
let winStreak = 0;
let lossStreak = 0;

// balance stats
const maxAllowedDownSide = 300000;
let netChange = 0;
let netMaxUpside = 0;
let netMaxDownside = 0;

//optimization stats
const sessions = 1000;
let winRates = [];
let streaks = [];
let upDownSides = [];

function testRandomResult() {
    return chance.bool();
}

function logStats(result) {
    if (result) {
        winCount++;
        if (lastResult) {
            winStreakCount++;
        } else {
            if (winStreakCount > winStreak) {
                winStreak = winStreakCount;
            }
            winStreakCount = 0;
        }
        lastResult = result;
    } else {
        lossCount++;
        if (!lastResult) {
            lossStreakCount++;
        } else {
            if (lossStreakCount > lossStreak) {
                lossStreak = lossStreakCount;
            }
            lossStreakCount = 0;
        }
        lastResult = result;
    }
    if (lossCount !== 0) {
        winRate = (winCount/(winCount+lossCount)).toFixed(4) * 100;
    }
    netChange = (winCount*betAmount) - (lossCount*betAmount);
    if (netChange > netMaxUpside) {
        netMaxUpside = netChange;
    } else if (netChange < netMaxDownside) {
        netMaxDownside = netChange;
    }
}

function logAndResetSessionStats() {
    winRates.push(winRate);
    streaks.push(winStreak, lossStreak);
    upDownSides.push(netMaxUpside, Math.abs(netMaxDownside))
    winRate = 0;
    winCount = 0;
    lossCount = 0;
    winStreakCount = 0;
    lossStreakCount = 0;
    lastResult = true;
    winStreak = 0;
    lossStreak = 0;
    netChange = 0;
    netMaxUpside = 0;
    netMaxDownside = 0;
}

function printSessionsStats() {

    function stdDev(array) {
        return (Math.sqrt(array.reduce((acc, val) => acc + Math.pow(val - (array.reduce((acc, val) => acc + val, 0) / array.length), 2), 0)/ array.length)).toFixed(4);
    }

    const avgWR = (winRates.reduce((acc, val) => acc + val, 0) / winRates.length).toFixed(2);
    const avgStreak = (streaks.reduce((acc, val) => acc + val, 0) / streaks.length).toFixed(2);
    const avgUpDownSides = (upDownSides.reduce((acc, val) => acc + val, 0) / upDownSides.length).toFixed(2);
    console.log(`Sessioni simulate: ${sessions} --- Partite per sessione: ${totalBets} --- Importo per partita: ${betAmount} GOATS --- Volume atteso per partita: ${(expectedVolume)} GOATS
    Win rate medio: ${avgWR} % --- Strisce consecutiva media: ${avgStreak} (max: ${Math.max(streaks)}) --- Swing medio a rialzo/ribasso: +/- ${avgUpDownSides} (max: +/- ${Math.max(upDownSides)})
    Std dev WR: ${stdDev(winRates)} % --- Std dev strisce: ${stdDev(streaks)} --- Std dev swing: +/- ${stdDev(upDownSides)}`)
}

function runSessionsBacktest() {
    let currentSession = 0;
    let cycles = 0;
    while (currentSession < sessions) {
        while (cycles < totalBets) {
            logStats(testRandomResult());
           cycles++;
        }
        logAndResetSessionStats();
        cycles = 0;
        currentSession++;
    }
    printSessionsStats();
}

runSessionsBacktest();

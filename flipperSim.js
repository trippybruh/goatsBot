const Chance = require('chance');
const chance = new Chance();
const startTime = Date.now();
const bearer = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmMDI2NGZhNzVkYjBjZjYzYmY4YjAwIiwiaWF0IjoxNzI3ODkwMTU1LCJleHAiOjE3Mjc5NzY1NTUsInR5cGUiOiJhY2Nlc3MifQ.OIvv3TonWy7xl-j3mkicIycMHT1Z2RZWV1CvIhA5daQ';
const bearerTokens = [
    bearer
];
// request stats
const REQ_INTERVAL_DELAY = 330; // ms

// head or tail game config
const totalBets = 1000;
let betAmount = 1000;
const expectedTimeRequired = totalBets * (REQ_INTERVAL_DELAY/1000);
let head_tail = "HEADS";

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
let netChange = 0;
let netGain = 0;
let netLoss = 0;
let netMaxUpside = 0;
let netMaxDownside = 0;

function getElapsedTimeInSeconds() {
    const currentTime = Date.now();
    return ((currentTime - startTime) / 1000).toFixed(2);
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function printStatistics() {
    const elapsedTime = getElapsedTimeInSeconds();
    const elapsedTimeMin = elapsedTime/60;

    console.log(`Tempo dall'avvio: ${elapsedTime} secondi (${(elapsedTimeMin).toFixed(0)} minuti) --- Al completamento: ${(expectedTimeRequired - elapsedTime).toFixed(0)} secondi --- Target richieste/min: ${60000/REQ_INTERVAL_DELAY})
        Vincite totali: ${winCount} --- Sconfitte totali: ${lossCount} --- Win rate attuale: ${winRate} % --- Guadagno/perdita: ${netChange} GOATS
        Serie più lunga di vittorie: ${winStreak} --- Serie più lunga di sconfitte: ${lossStreak} --- Max upside: ${netMaxUpside} --- Max downside: ${netMaxDownside} 
        Serie corrente vittorie: ${winStreakCount} --- Serie corrente sconfitte: ${lossStreakCount} --- Prossima bet: ${betAmount} `);
}

function adjustBetAmount() {
    let newBetAmount;
    if (lossStreakCount === 0) {
        newBetAmount = 1000;
    } else if (1 <= lossStreakCount <= 2) {
        newBetAmount = 2000;
    } else if (lossStreakCount === 3) {
        newBetAmount = 5000;
    } else if (4 <= lossStreakCount <= 7) {
        newBetAmount = 10000;
    } else if (lossStreakCount === 8) {
        newBetAmount = 50000;
    } else if (lossStreakCount >= 9) {
        newBetAmount = 100000;
    }
    return newBetAmount;
}

function testLogStats(result) {
    if (result) {
        netGain += (betAmount*2)
        winCount++;
        if (winStreakCount === 0) {
            winStreakCount++;
        }
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
        netLoss += betAmount;
        lossCount++;
        if (lossStreakCount === 0) {
            lossStreakCount++;
        }
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
    netChange = netGain - netLoss;
    if (netChange > netMaxUpside) {
        netMaxUpside = netChange;
    } else if (netChange < netMaxDownside) {
        netMaxDownside = netChange;
    }
    betAmount = adjustBetAmount();
}

function testRandomResult() {
    return chance.bool();
}

async function simulateReqCycle() {
    let cycles = 0;
    const consoleLogStep = (totalBets/50).toFixed(0);
    while (cycles < totalBets) {
        testLogStats(testRandomResult());
        if (cycles % consoleLogStep === 0) {
           printStatistics();
       }
       cycles++;
    }
    printStatistics();
    await sleep(1000);
    process.exit(0);
}

function testStart() {
    bearerTokens.forEach(async (bearerToken) => {
        console.log(`Inizio cicli di flipping per Bearer Token: ${bearerToken.slice(0, 5)}...${bearer.slice(-5)} --- TEST FUNCTION WITH GAME SIMULATOR
        Configurato per eseguire max ${(1000 / REQ_INTERVAL_DELAY).toFixed(2)} richieste/s --- Max richieste (partite): ${totalBets}
        Tempo stimato per eseguire tutte le richieste: ${expectedTimeRequired} secondi (${(expectedTimeRequired / 60).toFixed(0)} minuti)`);
        await  simulateReqCycle();
    });
}

//main
testStart();
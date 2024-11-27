const cloudscraper = require('cloudscraper');
const express = require('express');
const app = express();
const startTime = Date.now();
const bearer = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcxNmEzOGMxOTM3ZDJlZWU3MWI2YTM4IiwiaWF0IjoxNzMyNjY5OTgyLCJleHAiOjE3MzI3NTYzODIsInR5cGUiOiJhY2Nlc3MifQ.MYaD0rU2ifto9-5ku2LcpOSbXbplm3Ey7fifHcMsqmg';
const bearerTokens = [
    bearer
];

const headerApi = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) ' +
        'Chrome/129.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
    'Origin': 'https://dev.goatsbot.xyz',
    'Referer': 'https://dev.goatsbot.xyz/',
    'Sec-CH-UA': '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
    'Sec-CH-UA-Mobile': '?0',
    'Sec-CH-UA-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
}

const oldHeaderApi = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'it-IT,it;q=0.8,en-US;q=0.5,en;q=0.3',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Origin': 'https://dev.goatsbot.xyz',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Referer': 'https://dev.goatsbot.xyz/',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    'Sec-GPC': '1',
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache'
}

// request stats
const REQ_INTERVAL_DELAY = 2000; // ms
const INTRA_REQ_DELAY = 1500;
let successCount = 0;
let failureCount = 0;
let failureStreak = 0;

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

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getElapsedTimeInSeconds() {
    const currentTime = Date.now();
    return ((currentTime - startTime) / 1000).toFixed(2);
}

async function makeRequest(bearerToken, data) {
    const options = {
        method: 'POST',
        url: 'https://dev-api-v4.goatsbot.xyz/flips/action',
        headers: {
            ...oldHeaderApi,
            Authorization: `Bearer ${bearerToken}`
        },
        body: JSON.stringify(data),
        timeout: 5000
    };

    try {
        const response = await cloudscraper(options);
        const jsonResponse = JSON.parse(response);
        await sleep(INTRA_REQ_DELAY);
        successCount++;
        failureStreak = 1;
        return jsonResponse;
    } catch (error) {
        console.log(`Errore richiesta: ${(error.message)}`)
        failureCount++;
        failureStreak++;
        return null;
    }
}

function adjustBetAmount() {
    let newBetAmount;
    if (lossStreakCount === 0) {
        newBetAmount = 1000;
    } else if (lossStreakCount === 1) {
        newBetAmount = 2000;
    } else if (lossStreakCount === 2) {
        newBetAmount = 5000;
    } else if (3 <= lossStreakCount <= 6) {
        newBetAmount = 10000;
    } else if (lossStreakCount === 7) {
        newBetAmount = 50000;
    } else if (lossStreakCount > 8) {
        newBetAmount = 100000;
    } // play catching with 5 bombs
    return newBetAmount;
}

function logStats(response) {
    const result = response?.flip?.is_win;
    if (result) {
        netGain += betAmount
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

function printStatistics() {
    const elapsedTime = getElapsedTimeInSeconds();
    const elapsedTimeMin = elapsedTime/60;
    let ratioWLreq = 'inf';
    if (failureCount !== 0) {
        ratioWLreq = (successCount/failureCount).toFixed(4);
    }
    console.log(`Tempo dall'avvio: ${Math.floor(elapsedTime/3600)} ore ${((elapsedTime/60) % 60).toFixed(0)} minuti ${(elapsedTime % 60).toFixed(0)} secondi`);
    console.log(`-> Richieste elaborate: ${successCount} --- Richieste fallite: ${failureCount} --- Richieste totali/min: ${((successCount + failureCount)/elapsedTimeMin).toFixed(2)} (target: ${(60000/REQ_INTERVAL_DELAY).toFixed(1)})`);
    console.log(`-> Successi/Fallimenti: ${ratioWLreq} % --- Successi/min: ${(successCount/elapsedTimeMin).toFixed(2)} --- Fallimenti/min: ${(failureCount/elapsedTimeMin).toFixed(2)}`);
    console.log(`-> Vittorie: ${winCount} --- Sconfitte: ${lossCount} --- Wr: ${winRate} % --- Bet base: 1000 GOATS`);
    console.log(`-> Streak vittorie ${winStreakCount} (Max: ${winStreak}) --- Streak sconfitte: ${lossStreakCount} (Max: ${lossStreak}) --- Prossima bet: ${betAmount}`);
    console.log(`-> Performance: ${netChange} GOATS --- Max upside: ${netMaxUpside} GOATS --- Max downside: ${netMaxDownside} GOATS`);
}

async function performRequestCycle(bearerToken) {
    const consoleLogStep = 5;
    let cycles = 0;
    setInterval(async () => {
        if (successCount === totalBets) {
            printStatistics();
            await sleep(1000);
            process.exit(0);
        }
        const data = {
            "bet_amount": betAmount,
            "head_tail": head_tail
        };
        const response = await makeRequest(bearerToken, data);
        if (response) {
            logStats(response);
        }
        if (cycles % consoleLogStep === 0) {
            printStatistics();
        }
        cycles++;
    }, REQ_INTERVAL_DELAY);
}

function start() {
    bearerTokens.forEach(async (bearerToken) => {
        console.log(`Inizio cicli di flipping per Bearer Token: ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)} --- YOU ARE NOT IN KANSAS ANYMORE!
        Configurato per eseguire max ${(1000/REQ_INTERVAL_DELAY).toFixed(2)} richieste/s --- Timeout minimo tra una richiesta ed un altra: ${(INTRA_REQ_DELAY/1000).toFixed(3)} s
        Configurato per eseguire max ${totalBets} richieste (partite) --- Tempo stimato per eseguire tutte le richieste: ${expectedTimeRequired} secondi (${(expectedTimeRequired/60).toFixed(0)} minuti)`);
        await performRequestCycle(bearerToken);
    });
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Service is running on port ${port}`);
});
start();

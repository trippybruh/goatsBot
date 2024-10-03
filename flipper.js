const cloudscraper = require('cloudscraper');
const axios = require('axios');
const express = require('express');
const app = express();
const startTime = Date.now();
const bearer = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmMDI2NGZhNzVkYjBjZjYzYmY4YjAwIiwiaWF0IjoxNzI3ODkwMTU1LCJleHAiOjE3Mjc5NzY1NTUsInR5cGUiOiJhY2Nlc3MifQ.OIvv3TonWy7xl-j3mkicIycMHT1Z2RZWV1CvIhA5daQ';
const bearerTokens = [
    bearer
];

// request stats
const REQ_INTERVAL_DELAY = 800; // ms
const INTRA_REQ_DELAY = 750;
let successCount = 0;
let failureCount = 0;

// head or tail game config
const totalBets = 100;
const betAmount = 10000;
const expectedVolume = totalBets * betAmount * 1.5;
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
let netMaxUpside = 0;
let netMaxDownside = 0;


function getElapsedTimeInSeconds() {
    const currentTime = Date.now();
    return ((currentTime - startTime) / 1000).toFixed(2);
}

async function makeRequest(data, bearerToken) {
    const options = {
        method: 'POST',
        url: 'https://dev-api-v4.goatsbot.xyz/flips/action',
        headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        timeout: 5000
    };

    try {
        const response = await cloudscraper(options);
        const jsonResponse = JSON.parse(response);
        await sleep(INTRA_REQ_DELAY);
        successCount++;
        return jsonResponse;
    } catch (error) {
        failureCount++;
        return null;
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function logStatistics(response) {
    if (response?.flip?.is_win) {
        winCount++;
    } else {
        lossCount++;
    }
    if (lossCount !== 0) {
        winRate = (winCount/(winCount+lossCount)).toFixed(4) * 100;
    }
    netChange = (winCount*betAmount) - (lossCount*betAmount);
}

function printStatistics() {
    const elapsedTime = getElapsedTimeInSeconds();
    const elapsedTimeMin = elapsedTime/60;
    let ratioWLreq = 'inf';
    if (failureCount !== 0) {
        ratioWLreq = (successCount/failureCount).toFixed(4);
    }
    let currentVolume = (winCount*betAmount*2) + (lossCount*betAmount);

    console.log(`Tempo dall'avvio: ${elapsedTime} secondi (${(elapsedTimeMin).toFixed(0)} minuti) --- Al completamento: ${expectedTimeRequired - elapsedTime} secondi
        Richieste totali: ${successCount + failureCount} --- Richieste totali/min: ${((successCount + failureCount)/elapsedTimeMin).toFixed(2)} (target/min: ${60000/REQ_INTERVAL_DELAY})
        Successi: ${successCount} --- Fallimenti: ${failureCount} --- Successi/Fallimenti: ${ratioWLreq}
        Successi/min: ${(successCount/elapsedTimeMin).toFixed(2)} --- Fallimenti/min: ${(failureCount/elapsedTimeMin).toFixed(2)}
        Vincite totali: ${winCount} --- Sconfitte totali: ${lossCount} --- Win rate attuale: ${winRate} % --- Guadagno/perdita: ${netChange} GOATS
        Serie più lunga di vittorie: ${winStreak} --- Serie più lunga di sconfitte: ${lossStreak} --- Max upside: ${netMaxUpside} --- Max downside: ${netMaxDownside} 
        Volume effettivo generato: ${currentVolume} GOATS (target: ${expectedVolume} -> ${(currentVolume/expectedVolume) * 100} % completato)`);
}

async function performRequestCycle(bearerToken) {
    const consoleLogStep = 30;
    let cycles = 0;
    const data = {
        "head_tail": head_tail,
        "bet_amount": betAmount
    };

    setInterval(async () => {
        const response = await makeRequest(data, bearerToken);
        logStatistics(response);
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
        Configurato per eseguire max ${totalBets} richieste (partite) --- Importo per partita: ${betAmount} GOATS --- Volume atteso: ${(expectedVolume)}
        Tempo stimato per eseguire tutte le richieste: ${expectedTimeRequired} secondi (${(expectedTimeRequired/60).toFixed(0)} minuti)`);
        await performRequestCycle(bearerToken);
    });
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Service is running on port ${port}`);
});
testStart();

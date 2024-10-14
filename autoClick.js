const cloudscraper = require('cloudscraper');
const express = require('express');

const app = express();
const startTime = Date.now();
const REQ_INTERVAL_DELAY = 1250; // ms
const INTRA_REQ_DELAY = 1100;
const bearer = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcwNzIxOTkwMTRmNDcwZTVhMDUxNjcxIiwiaWF0IjoxNzI4OTQ2MDU5LCJleHAiOjE3MjkwMzI0NTksInR5cGUiOiJhY2Nlc3MifQ.2mT7GFcGNNbD1bdD2g774SZkWGmSjBcQnWJTCq8ggjU';
const bearerTokens = [
    bearer
];

const negEV = -23.88;
const winChanceMilestone = 88;
const bet_amount = 4335;
const data = {
    "point_milestone": winChanceMilestone,
    "is_upper": false,
    "bet_amount": bet_amount
};
let successCount = 0;
let failureCount = 0;
let failureStreak = 0;

function getElapsedTimeInSeconds() {
    return ((Date.now() - startTime) / 1000).toFixed(2);
}

async function makeRequest(bearerToken) {
    const options = {
        method: 'POST',
        url: 'https://api-dice.goatsbot.xyz/dice/action',
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
        failureStreak = 1;
        return jsonResponse;
    } catch (error) {
        if (failureStreak % 25 === 0) {
            console.log(`Errore richiesta: ${(error.message).slice(0, 5)}`)
        }
        failureCount++;
        failureStreak++;
        if (failureStreak >= 100) {
            console.log(`100 richieste di fila fallite...
            Ultimo errore richiesta: ${error.message} 
            pausa autoclicker di 5 minuti...`)
            await sleep(300000);
        }
        return null;
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function logStatistics() {
    const elapsedTime = getElapsedTimeInSeconds();
    const elapsedTimeMin = elapsedTime/60;
    let ratioWL = 'inf';

    if (failureCount !== 0) {
        ratioWL = (successCount/failureCount).toFixed(4);
    }
    const active_clickers = 20;
    const gained = (successCount * negEV) + (elapsedTimeMin.toFixed(0) * 200);
    const volume = (bet_amount * successCount * (winChanceMilestone/100).toFixed(2));
    console.log(`Tempo dall'avvio: ${Math.floor(elapsedTime/3600)} ore ${((elapsedTime/60) % 60).toFixed(0)} minuti ${(elapsedTime % 60).toFixed(0)} secondi`);
    console.log(`-> Richieste elaborate: ${successCount} --- Richieste fallite: ${failureCount} --- Richieste totali/min: ${((successCount + failureCount)/elapsedTimeMin).toFixed(2)} (target: ${60000/REQ_INTERVAL_DELAY})`);
    console.log(`-> Successi/Fallimenti: ${ratioWL} --- Successi/min: ${(successCount/elapsedTimeMin).toFixed(2)} --- Fallimenti/min: ${(failureCount/elapsedTimeMin).toFixed(2)}`);
    console.log(`-> Saldo dall'avvio (con missioni attive): ${gained.toFixed(0)} GOATS --- Saldo dall'avvio (missioni + clickers): ${(gained + (65*active_clickers*elapsedTimeMin)).toFixed(0)} GOATS`);
    console.log(`-> Volume generato: ${volume.toFixed(0)} GOATS\`);`);
}

async function performRequestCycle(bearerToken) {
    const consoleLogStep = 100;
    let cycles = 0;
    setInterval(async () => {
        await makeRequest(bearerToken);
        if (cycles % consoleLogStep === 0) {
            logStatistics();
        }
        cycles++;
    }, REQ_INTERVAL_DELAY)
}


function start() {
    bearerTokens.forEach(async (bearerToken) => {
        console.log(`Inizio cicli di richieste per Bearer Token: ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)}
        Configurato per eseguire max ${(1000/REQ_INTERVAL_DELAY).toFixed(2)} richieste/s --- Timeout minimo tra una richiesta ed un altra: ${(INTRA_REQ_DELAY/1000).toFixed(3)} s`);
        await performRequestCycle(bearerToken);
    });
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Service is running on port ${port}`);
});
start();

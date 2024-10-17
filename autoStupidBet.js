const cloudscraper = require('cloudscraper');
const express = require('express');

const app = express();
const startTime = Date.now();
const REQ_INTERVAL_DELAY = 30000; // ms
const INTRA_REQ_DELAY = 5000;
const bearer = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcwNzIxOTkwMTRmNDcwZTVhMDUxNjcxIiwiaWF0IjoxNzI4OTQ2MDU5LCJleHAiOjE3MjkwMzI0NTksInR5cGUiOiJhY2Nlc3MifQ.2mT7GFcGNNbD1bdD2g774SZkWGmSjBcQnWJTCq8ggjU';
const bearerTokens = [
    bearer
];

const winChanceMilestone = 100;
const bet_amount = 999949; // G
const target_volume = 20000000; // G
let successCount = 0;
let failureCount = 0;
let volume;

function getElapsedTimeInSeconds() {
    return ((Date.now() - startTime) / 1000).toFixed(2);
}

async function makeRequest(bearerToken) {
    const data = {
        "point_milestone": winChanceMilestone,
        "is_upper": false,
        "bet_amount": bet_amount
    };

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
        return jsonResponse;
    } catch (error) {
        console.log(`Errore richiesta bet: ${(error.message).slice(0, 5)}`)
        failureCount++;
        return null;
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function logStatistics() {
    const elapsedTime = getElapsedTimeInSeconds();
    const elapsedTimeMin = elapsedTime/60;

    volume = (bet_amount-(Math.floor(bet_amount*0.01)))*successCount;
    const gained = (-0.01*bet_amount*successCount);
    let ratioWL = 'inf';
    if (failureCount !== 0) {
        ratioWL = (successCount/failureCount).toFixed(4);
    }
    console.log(`Tempo dall'avvio: ${Math.floor(elapsedTime/3600)} ore ${((elapsedTime/60) % 60).toFixed(0)} minuti ${(elapsedTime % 60).toFixed(0)} secondi`);
    console.log(`-> Richieste elaborate: ${successCount} --- Richieste fallite: ${failureCount} --- Richieste ancora necessarie: ${Math.ceil((target_volume-volume)/(volume/successCount))}`);
    console.log(`-> Successi/Fallimenti: ${ratioWL} --- Richieste totali/min: ${((successCount + failureCount)/(elapsedTimeMin)).toFixed(2)} (target: ${((60000)/REQ_INTERVAL_DELAY).toFixed(1)}/min)`);
    console.log(`-> Perdite totali (stupid bet): ${Math.round(gained)} GOATS --- Volume generato per bet: ${volume/successCount} GOATS )`);
    console.log(`-> Volume totale: ${volume} GOATS (${((volume/target_volume)*100).toFixed(1)}% del volume target) --- Tempo stimato al target: ${((REQ_INTERVAL_DELAY/1000)*Math.ceil((target_volume-volume)/(volume/successCount))).toFixed(1)} secondi`);
}

async function performRequestCycle(bearerToken) {
    await makeRequest(bearerToken);
    logStatistics();
    let consoleSteps = [3, 5, 7];
    let cycles;
    const intervalId = setInterval(async () => {
        await makeRequest(bearerToken);
        if (cycles % consoleSteps[Math.floor(Math.random() * consoleSteps.length)] === 0) {
            logStatistics();
        }
        if (volume >= target_volume) {
            console.log(`Bet stupide eseguite :) -> CAPRE MUNTE: ${volume} GOATS`);
            await sleep(3000);
            clearInterval(intervalId);
            process.exit(0);
        }
    }, REQ_INTERVAL_DELAY)
    process.exit(0);
}

function start() {
    bearerTokens.forEach(async (bearerToken) => {
        console.log(`Inizio cicli di richieste per Bearer Token: ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)}
        Configurato per eseguire max ${((60000*60)/REQ_INTERVAL_DELAY).toFixed(2)} richieste/min --- Timeout minimo tra una richiesta ed un altra: ${((60000)/REQ_INTERVAL_DELAY/1000).toFixed(3)} min`);
        await performRequestCycle(bearerToken);
    });
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Service is running on port ${port}`);
});
start();

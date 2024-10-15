const cloudscraper = require('cloudscraper');
const express = require('express');

const app = express();
const startTime = Date.now();
const REQ_INTERVAL_DELAY = 3000000; // ms
const INTRA_REQ_DELAY = 1000;
const bearer = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcwNzIxOTkwMTRmNDcwZTVhMDUxNjcxIiwiaWF0IjoxNzI4OTQ2MDU5LCJleHAiOjE3MjkwMzI0NTksInR5cGUiOiJhY2Nlc3MifQ.2mT7GFcGNNbD1bdD2g774SZkWGmSjBcQnWJTCq8ggjU';
const bearerTokens = [
    bearer
];

const winChanceMilestone = 100;
const bet_amount = 999949;
let successCount = 0;
let failureCount = 0;

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
        console.log(`Errore richiesta: ${(error.message).slice(0, 5)} - Ritento tra un minuto`)
        failureCount++;
        await sleep(66000);
        return makeRequest(bearerToken);
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function logStatistics() {
    const elapsedTime = getElapsedTimeInSeconds();
    const elapsedTimeMin = elapsedTime/60;
    const volume = bet_amount*successCount*(winChanceMilestone/100);
    const gained = (-0.01*bet_amount*successCount);
    let ratioWL = 'inf';
    if (failureCount !== 0) {
        ratioWL = (successCount/failureCount).toFixed(4);
    }
    console.log(`Tempo dall'avvio: ${Math.floor(elapsedTime/3600)} ore ${((elapsedTime/60) % 60).toFixed(0)} minuti ${(elapsedTime % 60).toFixed(0)} secondi`);
    console.log(`-> Richieste elaborate: ${successCount} --- Richieste fallite: ${failureCount} `);
    console.log(`-> Successi/Fallimenti: ${ratioWL} --- Richieste totali/ora: ${((successCount + failureCount)/(elapsedTimeMin*60)).toFixed(2)} (target: ${((60000*60)/REQ_INTERVAL_DELAY).toFixed(1)}/h)`);
    console.log(`-> Guadagno (stupid bet): ${Math.round(gained)} GOATS --- Volume: ${Math.round(volume)} GOATS`);
}

async function performRequestCycle(bearerToken) {
    setInterval(async () => {
        await makeRequest(bearerToken);
        logStatistics();
    }, REQ_INTERVAL_DELAY)
}

function start() {
    bearerTokens.forEach(async (bearerToken) => {
        console.log(`Inizio cicli di richieste per Bearer Token: ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)}
        Configurato per eseguire max ${((60000*60)/REQ_INTERVAL_DELAY).toFixed(2)} richieste/orarie --- Timeout minimo tra una richiesta ed un altra: ${((60000*60)/REQ_INTERVAL_DELAY/1000).toFixed(3)} ora`);
        await performRequestCycle(bearerToken);
    });
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Service is running on port ${port}`);
});
start();

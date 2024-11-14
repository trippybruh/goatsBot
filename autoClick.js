const cloudscraper = require('cloudscraper');
const express = require('express');

const app = express();
const startTime = Date.now();
const REQ_INTERVAL_DELAY = 625; // ms
const INTRA_REQ_DELAY = 450;
const bearer = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmMDI2NGZhNzVkYjBjZjYzYmY4YjAwIiwiaWF0IjoxNzMxNTQyMDM5LCJleHAiOjE3MzE2Mjg0MzksInR5cGUiOiJhY2Nlc3MifQ.a5t6iszjazdqeNk7z7I8LYviPNvwPtudfzm89GFvaY4';
const bearerTokens = [
    bearer
];

const winChanceMilestone = 90;
const bet_amount = 5;
const data = {
    "point_milestone": winChanceMilestone,
    "is_upper": false,
    "bet_amount": bet_amount
};
let successCount = 0;
let failureCount = 0;
let failureStreak = 1;

function getElapsedTimeInSeconds() {
    return ((Date.now() - startTime) / 1000).toFixed(2);
}

async function makeRequest(bearerToken) {
    const options = {
        method: 'POST',
        url: 'https://api-dice.goatsbot.xyz/dice/action',
        headers: {
            'Authorization': `Bearer ${bearerToken}`,
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
            console.log(`Errore richiesta: ${(error.message).slice(0, 4)}`)
        }
        failureCount++;
        failureStreak++;
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
    const gained = successCount * 0.4;
    const volume = bet_amount*successCount*(winChanceMilestone/100);
    console.log(`Tempo dall'avvio: ${Math.floor(elapsedTime/3600)} ore ${((elapsedTime/60) % 60).toFixed(0)} minuti ${(elapsedTime % 60).toFixed(0)} secondi`);
    console.log(`-> Richieste elaborate: ${successCount} --- Richieste fallite: ${failureCount} --- Richieste totali/min: ${((successCount + failureCount)/elapsedTimeMin).toFixed(2)} (target: ${(60000/REQ_INTERVAL_DELAY).toFixed(1)})`);
    console.log(`-> Successi/Fallimenti: ${ratioWL} --- Successi/min: ${(successCount/elapsedTimeMin).toFixed(2)} --- Fallimenti/min: ${(failureCount/elapsedTimeMin).toFixed(2)}`);
    console.log(`-> Guadagno (solo clicker): ${Math.round(gained)} GOATS --- Volume: ${Math.round(volume)} GOATS`);
}

async function performRequestCycle(bearerToken) {
    const consoleLogStep = 500;
    let cycles = 0;
    const intervalId = setInterval(async () => {
        const response = await makeRequest(bearerToken);
        if (!response) {
            if (failureStreak >= 200) {
                console.log(`200 richieste di fila fallite... Spegnimento autoclicker...`);
                await sleep(1000);
                clearInterval(intervalId);
                process.exit(1);
            }
        }
        if (cycles % consoleLogStep === 0) {
            logStatistics();
        }
        cycles++;
    }, REQ_INTERVAL_DELAY);
}

function start() {
    bearerTokens.forEach(async (bearerToken) => {
        console.log(`Inizio cicli di richieste per Bearer Token: ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)}
        Configurato per eseguire max ${(1000/REQ_INTERVAL_DELAY).toFixed(2)} richieste/s --- Timeout minimo tra una richiesta ed un altra: ${(INTRA_REQ_DELAY/1000).toFixed(3)} s`);
        await performRequestCycle(bearerToken);
    });
}

const port = Math.floor(Math.random() * (9000 - 2000 + 1)) + 2000;
app.listen(port, () => {
    console.log(`Service is running on port ${port}`);
});
start();

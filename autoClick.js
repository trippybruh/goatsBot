const cloudscraper = require('cloudscraper');
const express = require('express');

const app = express();
const startTime = Date.now();
const REQ_INTERVAL_DELAY = 600; // ms
const INTRA_REQ_DELAY = 450;
const bearerTokens = [
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmMDI2NGZhNzVkYjBjZjYzYmY4YjAwIiwiaWF0IjoxNzMxNTQyMDM5LCJleHAiOjE3MzE2Mjg0MzksInR5cGUiOiJhY2Nlc3MifQ.a5t6iszjazdqeNk7z7I8LYviPNvwPtudfzm89GFvaY4',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcxMjYyMzFmMDNmYTFmNjhhYjcyZjhmIiwiaWF0IjoxNzMxNTQzMTAwLCJleHAiOjE3MzE2Mjk1MDAsInR5cGUiOiJhY2Nlc3MifQ.MOFxMH4MTVLXOta8Ny-9RaM53MNcFjHhk4Ktpb5yTgA',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcxM2FiNDgzNmVmODEzMWM1MjAyNmE2IiwiaWF0IjoxNzMxNTQzMDU4LCJleHAiOjE3MzE2Mjk0NTgsInR5cGUiOiJhY2Nlc3MifQ.LhDn1WG8fNnM4DwpSn8Tb6DaFvquz20npj5rD5uOYu4',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcxNmEzOGMxOTM3ZDJlZWU3MWI2YTM4IiwiaWF0IjoxNzMxNTQzMDA1LCJleHAiOjE3MzE2Mjk0MDUsInR5cGUiOiJhY2Nlc3MifQ.s5ALBkAmIrNN1ZbIgVxdgK_lRKnCOoCN5ijNumh_m6s'
]

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
            console.log(`Errore richiesta: ${(error.message).slice(0, 4)} --- Token: ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)}`)
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
    console.log(`IN ESECUZIONE DA: ${Math.floor(elapsedTime/3600)} ore ${((elapsedTime/60) % 60).toFixed(0)} minuti ${(elapsedTime % 60).toFixed(0)} secondi`);
    console.log(`-> Richieste elaborate: ${successCount} --- Richieste fallite: ${failureCount} --- Richieste totali/min: ${((successCount + failureCount)/elapsedTimeMin).toFixed(2)} (target: ${(60000/REQ_INTERVAL_DELAY).toFixed(1)})`);
    console.log(`-> Successi/Fallimenti: ${ratioWL} --- Successi/min: ${(successCount/elapsedTimeMin).toFixed(2)} --- Fallimenti/min: ${(failureCount/elapsedTimeMin).toFixed(2)}`);
    console.log(`-> Clicker in esecuzione su ${bearerTokens.length} bearers --- Volume: ${Math.round(volume)} GOATS`);
    console.log(`-> Guadagno totale: ${Math.round(gained)} GOATS ---`);
}

async function performRequestCycle(bearerToken) {
    const consoleLogStep = 250;
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
        if (bearerTokens.indexOf(bearerToken) === 0 && cycles % consoleLogStep === 0) {
            logStatistics();
        }
        cycles++;
    }, REQ_INTERVAL_DELAY);
}

function start() {
    console.log(`Configurato per eseguire max ${(1000/REQ_INTERVAL_DELAY).toFixed(2) * bearerTokens.length} richieste/s --- Timeout minimo tra una richiesta ed un altra: ${(INTRA_REQ_DELAY/1000).toFixed(3)} s`);
    bearerTokens.forEach(async (bearerToken) => {
        await sleep(bearerTokens.indexOf(bearerToken) * (REQ_INTERVAL_DELAY/bearerTokens.length));
        console.log(`Inizio cicli di richieste per Bearer Token: ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)}`);
        await performRequestCycle(bearerToken);
    });
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Service is running on port ${port}`);
});
start();

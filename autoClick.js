const cloudscraper = require('cloudscraper');
const express = require('express');

const app = express();
const startTime = Date.now();
const REQ_INTERVAL_DELAY = 330; // ms
const INTRA_REQ_DELAY = 300;
const bearer = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmMDI2NGZhNzVkYjBjZjYzYmY4YjAwIiwiaWF0IjoxNzI4MTcyMTY0LCJleHAiOjE3MjgyNTg1NjQsInR5cGUiOiJhY2Nlc3MifQ.nJldYI-BRjNfNXRzZZdFdKGLOqScY7nMA_qTpcy0RTA';
const bearerTokens = [
    bearer
];

const winChanceMilestone = 90;
const bet_amount = 5;
let successCount = 0;
let failureCount = 0;
let failureStreak = 0;

function getElapsedTimeInSeconds() {
    return ((Date.now() - startTime) / 1000).toFixed(2);
}

async function makeRequest(data, bearerToken) {
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
        failureStreak = 0;
        return jsonResponse;
    } catch (error) {
        console.log(`Errore richiesta: ${error.message}`)
        failureCount++;
        failureStreak++;
        if (failureStreak >= 100) {
            console.log(`100 richieste di fila fallite... chiusura autoclicker...`)
            await sleep(1000);
            process.exit(1);
        } else {
            return null;
        }
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function logStatistics(response) {
    const elapsedTime = getElapsedTimeInSeconds();
    const elapsedTimeMin = elapsedTime/60;
    let ratioWL = 'inf';

    if (failureCount !== 0) {
        ratioWL = (successCount/failureCount).toFixed(4);
    }

    if (response) {
        const gained = successCount * 0.4;
        console.log(`Tempo dall'avvio: ${elapsedTime} secondi (${(elapsedTimeMin).toFixed(0)} minuti)
        Richieste elaborate: ${successCount} --- Richieste fallite: ${failureCount} --- Guadagno: ${gained.toFixed(0)} GOATS 
        Successi/Fallimenti: ${ratioWL} --- Successi/min: ${(successCount/elapsedTimeMin).toFixed(2)} --- Fallimenti/min: ${(failureCount/elapsedTimeMin).toFixed(2)}
        Richieste totali: ${successCount + failureCount} --- Richieste totali/min: ${((successCount + failureCount)/elapsedTimeMin).toFixed(2)} (target: ${60000/REQ_INTERVAL_DELAY})`);
    }
}

async function performRequestCycle(bearerToken) {
    const consoleLogStep = 500;
    let cycles = 0;
    const data = {
        "point_milestone": winChanceMilestone,
        "is_upper": false,
        "bet_amount": bet_amount
    };

    setInterval(async () => {
        const response = await makeRequest(data, bearerToken);
        if (cycles % consoleLogStep === 0) {
            logStatistics(bearerToken, response);
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

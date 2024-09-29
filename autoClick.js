const cloudscraper = require('cloudscraper');
const axios = require('axios');

const startTime = Date.now();
const DELAY = 310; // ms
const bearer = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmMDI2NGZhNzVkYjBjZjYzYmY4YjAwIiwiaWF0IjoxNzI3NjI3MzY0LCJleHAiOjE3Mjc3MTM3NjQsInR5cGUiOiJhY2Nlc3MifQ.kJ__EfYByp9jxeWngzc3jZpfAZ5UHkqMIy2aYu4OEQc';
const bearerTokens = [
    //bearerPrefix.concat('E8YZmA0aBznfiOF92H3OJxZqCIWqX_fW_dxwTvSSoh0')
    bearer
];

let successCount = 0;
let failureCount = 0;

function getElapsedTimeInSeconds() {
    const currentTime = Date.now();
    return ((currentTime - startTime) / 1000).toFixed(2);
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
        await sleep(300);
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
    const elapsedTime = getElapsedTimeInSeconds();
    const elapsedTimeMin = elapsedTime/60;
    let ratioWL = 'inf';

    if (failureCount != 0) {
        ratioWL = (successCount/failureCount).toFixed(4);
    } 

    if (response) {
        const gained = successCount * 0.66;
        const percentGain = ((((gained + response?.user?.balance)/response?.user?.balance)-1)*100).toFixed(2);

        console.log(`Tempo dall'avvio: ${elapsedTime} secondi (${(elapsedTimeMin).toFixed(0)} minuti)
        Richieste elaborate: ${successCount} --- Richieste fallite: ${failureCount} --- Guadagno: ${gained.toFixed(0)} GOATS (${percentGain} % sul totale)
        Successi/Fallimenti: ${ratioWL} --- Successi/min: ${(successCount/elapsedTimeMin).toFixed(2)} --- Fallimenti/min: ${(failureCount/elapsedTimeMin).toFixed(2)}
        Richieste totali: ${successCount + failureCount} --- Richieste totali/min: ${((successCount + failureCount)/elapsedTimeMin).toFixed(2)} (target: ${60000/DELAY})`);
    } else {
        console.log("Teruuuun!!!")
    }
}

async function performRequestCycle(bearerToken) {
    const consoleLogStep = 100;
    var cycles = 0;
    const data = {
        "point_milestone": 66,
        "is_upper": false,
        "bet_amount": 1
    };

    setInterval(async () => {
        const response = await makeRequest(data, bearerToken);
        cycles++;
        if (response && (cycles % consoleLogStep == 0)) {
            logStatistics(bearerToken, response);
        }
    }, DELAY)
}

function start() {
    bearerTokens.forEach(async (bearerToken) => {
        console.log(`Inizio cicli di richieste per Bearer Token: ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)} --- Configurato per eseguire ${(1000/DELAY).toFixed(2)} richieste/s`);
        await performRequestCycle(bearerToken);
    });
}


start(); // Avvia il ciclo con proxy

const cloudscraper = require('cloudscraper');
const express = require('express');
const app = express();
const startTime = Date.now();
const myBearer = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmMDI2NGZhNzVkYjBjZjYzYmY4YjAwIiwiaWF0IjoxNzI4NTIwOTU4LCJleHAiOjE3Mjg2MDczNTgsInR5cGUiOiJhY2Nlc3MifQ.eVHabhaDoblI5-8WkU5O_2ul35eNh8lSuWl7gEqI6wo';
const bearerTokens = [
    myBearer,
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcwNDBhNjYzOGE4ZTVkMjY0YTk2Mjg2IiwiaWF0IjoxNzI4NTIwNjYyLCJleHAiOjE3Mjg2MDcwNjIsInR5cGUiOiJhY2Nlc3MifQ.Xki2pd6TwuOwR_YXJu7uqwDbJfEaqLL9B46u0SvGbBY',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcwNDc5YTMwMTRmNDcwZTVhYjViZDdlIiwiaWF0IjoxNzI4NTIwNDg3LCJleHAiOjE3Mjg2MDY4ODcsInR5cGUiOiJhY2Nlc3MifQ.RuYR7x3-8gMmIqLMkyqPDD0qXlStQWakHsPmUN-RiRA',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcwNzIxOTkwMTRmNDcwZTVhMDUxNjcxIiwiaWF0IjoxNzI4NTIwODY2LCJleHAiOjE3Mjg2MDcyNjYsInR5cGUiOiJhY2Nlc3MifQ._7Qx8EzcMODA-TvuawuaWSwrnA0raf6pMyXr1HRny7c'
];

let bigMissSuccess = 0;
let successCount = 0;
let failureCount = 0;

function getElapsedTimeInSeconds() {
    const currentTime = Date.now();
    return ((currentTime - startTime) / 1000).toFixed(2);
}

async function makeRequest(bearerToken) {
    const options = {
        method: 'POST',
        url: 'https://dev-api.goatsbot.xyz/missions/action/66db47e2ff88e4527783327e',
        headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await cloudscraper(options);
        const jsonResponse = JSON.parse(response);
        successCount++;
        return jsonResponse;
    } catch (error) {
        console.log(`Errore richiesta: ${(error.message).slice(0, 5)}`)
        failureCount++;
        return null;
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function logStatistics(token, response) {
    if (response && token === myBearer) {
        const elapsedTime = getElapsedTimeInSeconds();
        const gained = (successCount * 200) + (bigMissSuccess * 1000);
        console.log(`Tempo dall'avvio: ${elapsedTime} secondi (${(elapsedTime/60).toFixed(0)}) minuti 
        Richieste elaborate: ${successCount} --- Richieste fallite: ${failureCount} --- Richieste misisoni speciali elaborate: ${bigMissSuccess}
        Guadagno: ${gained.toFixed(0)} GOATS --- Missioni in esecuzione su ${bearerTokens.length} bearers:`)
        for (const bearerToken of bearerTokens) {
            console.log(`-${bearerTokens.indexOf(bearerToken)}) ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)}`)
        }
    } 
}

async function performRequestCycle(bearerToken) {
    const intervalId = setInterval(async () => {
        const response = await makeRequest(bearerToken)
        if (response) {
            logStatistics(bearerToken, response);
        }
    }, 60500);
}

function start() {
    bearerTokens.forEach(async (bearerToken) => {
        await performRequestCycle(bearerToken); 
    });
}

async function getMissions(bearerToken) {
    const options = {
        method: 'GET',
        url: 'https://api-mission.goatsbot.xyz/missions/user',
        headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json'
        },
    };

    try {
        const response = await cloudscraper(options);
        return JSON.parse(response);
    } catch (error) {
        console.error(`Errore nel recuperare le missioni per Bearer Token: ${bearerToken}`, error.message);
        return null;
    }
}

async function executeMission(bearerToken, missionId) {
    const options = {
        method: 'POST',
        url: `https://dev-api.goatsbot.xyz/missions/action/${missionId}`,
        headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await cloudscraper(options);
        console.log(`Missione ${missionId} completata con successo.`);

        return JSON.parse(response);
    } catch (error) {
        console.error(`Errore nell'eseguire la missione ${missionId} per Bearer Token: ${bearerToken}`, error.message);
    }
}

async function processMissionsForBearer(bearerToken) {
    const missionsData = await getMissions(bearerToken);
    if (!missionsData) return;
    for (const [missionGroup, missions] of Object.entries(missionsData)) {
        for (const mission of missions) {
            if (mission.status === false) {
                await executeMission(bearerToken, mission._id);
                bigMissSuccess++;
            } else {
                console.log(`Missione ${mission._id} risulta già eseguita`)
            }
        }
    }
}

async function processAllBearers() {
    for (const bearerToken of bearerTokens) {
        console.log(`Controllo missioni da eseguire per Bearer Token: ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)}`);
        await processMissionsForBearer(bearerToken);
    }
}

function startHourlyProcess() {
    processAllBearers();
    setInterval(processAllBearers, 60 * 60 * 1000); // Ripeti ogni ora
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Service is running on port ${port}`);
});

startHourlyProcess();
start();


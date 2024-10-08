const cloudscraper = require('cloudscraper');
const express = require('express');
const app = express();
const startTime = Date.now();
const myBearer = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmMDI2NGZhNzVkYjBjZjYzYmY4YjAwIiwiaWF0IjoxNzI4MzQ2NzE0LCJleHAiOjE3Mjg0MzMxMTQsInR5cGUiOiJhY2Nlc3MifQ.ffrpLDegsogtLnJBpiuYB2RATmNet2S1AZPvntXe2jg';
const bearerTokens = [
    myBearer,
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcwNDBhNjYzOGE4ZTVkMjY0YTk2Mjg2IiwiaWF0IjoxNzI4MzE4MTM1LCJleHAiOjE3Mjg0MDQ1MzUsInR5cGUiOiJhY2Nlc3MifQ.VPwhyFiENkDGVFvTQvZEFRRiRq7cu4ZIzbdjJUKNLAk',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcwNDc5YTMwMTRmNDcwZTVhYjViZDdlIiwiaWF0IjoxNzI4MzQ2NTg0LCJleHAiOjE3Mjg0MzI5ODQsInR5cGUiOiJhY2Nlc3MifQ.mu09P4JzMX_w1r1WX5n2_Ii1wV3YJXora8b3nspB1Dw'
];

let bigMissSuccess = 0;
let successCount = 0;
let failureCount = 0;
let failureStreak = 0;

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
        failureStreak = 0;
        return jsonResponse;
    } catch (error) {
        console.log(`Errore richiesta: ${(error.message).slice(0, 5)}`)
        failureCount++;
        failureStreak++;
        if (failureStreak >= 100) {
            console.log(`100 richieste di fila fallite...
            Ultimo errore richiesta: ${error.message} 
            Rimozione bearer da mission checker...`)
            bearerTokens.splice(bearerTokens.indexOf(bearerToken), 1);
        } else {
            return null;
        }
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
        if (!bearerTokens.includes(bearerToken)) {
            clearInterval(intervalId);
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


const cloudscraper = require('cloudscraper');
const express = require('express');
const app = express();
const startTime = Date.now();
const myBearer = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmMDI2NGZhNzVkYjBjZjYzYmY4YjAwIiwiaWF0IjoxNzI5MzQ0MjIwLCJleHAiOjE3Mjk0MzA2MjAsInR5cGUiOiJhY2Nlc3MifQ.vNUpQcj_6FxuBQ6PIQkyJof8U5DZKW7_RipnoDMulsA';
const bearerTokens = [
    myBearer,
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcwNDBhNjYzOGE4ZTVkMjY0YTk2Mjg2IiwiaWF0IjoxNzI5MzQ0MTQyLCJleHAiOjE3Mjk0MzA1NDIsInR5cGUiOiJhY2Nlc3MifQ.tZgUfxho7pR5EDCBbIkH_RZ9b2gZHTNWpLMs1-4j21E',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcwNDc5YTMwMTRmNDcwZTVhYjViZDdlIiwiaWF0IjoxNzI5MzQ0MDU1LCJleHAiOjE3Mjk0MzA0NTUsInR5cGUiOiJhY2Nlc3MifQ.dAh3Fin8FmWJWsuYIZzLwiL9rL-QidjkmOlximtvuXQ',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcwNzIxOTkwMTRmNDcwZTVhMDUxNjcxIiwiaWF0IjoxNzI5MzQzOTc4LCJleHAiOjE3Mjk0MzAzNzgsInR5cGUiOiJhY2Nlc3MifQ.TJCOa1APJG0ZPEVU7ys2FbfEFtyL9uxNcJKbSQQcjCI',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcwNzI1NWM3NDU0ZmY1MGRmYjhjZjM0IiwiaWF0IjoxNzI5MzQzOTA1LCJleHAiOjE3Mjk0MzAzMDUsInR5cGUiOiJhY2Nlc3MifQ.HdaQWaHhDvt6HMaB190p058gUyY7eyqkw_D45ZSzY1E',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcxMjYyMzFmMDNmYTFmNjhhYjcyZjhmIiwiaWF0IjoxNzI5MzQzODE3LCJleHAiOjE3Mjk0MzAyMTcsInR5cGUiOiJhY2Nlc3MifQ.yqNRW750zwwAPjXtoiPneCu74e9SwIe60hp0uDaMO64',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcxM2FiNDgzNmVmODEzMWM1MjAyNmE2IiwiaWF0IjoxNzI5MzQzNzI3LCJleHAiOjE3Mjk0MzAxMjcsInR5cGUiOiJhY2Nlc3MifQ.lBi0thBzRbWCdYfpRQvfSoY6bJ6zFWztvmBVLcLZlS8'
];

const data = {
    "point_milestone": 97,
    "is_upper": false,
    "bet_amount": 25
};
let bigMissSuccess = 0;
let successCount = 0;
let failureCount = 0;
let betFailures = {};
let tokenBalances = {};

function getElapsedTimeInSeconds() {
    const currentTime = Date.now();
    return ((currentTime - startTime) / 1000).toFixed(2);
}

async function makeBetRequest(bearerToken) {
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
        return JSON.parse(response);
    } catch (error) {
        betFailures[bearerToken]++;
        if (betFailures[bearerToken] % 25 === 0) {
            console.log(`Errore bet: ${(error.message).slice(0, 4)} (totale errori: ${betFailures[bearerToken]}) --- Token: ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)}`);
        }
        return null;
    }
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
        console.log(`Errore richiesta: ${(error.message).slice(0, 4)} --- Token: ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)}`);
        failureCount++;
        return null;
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function logStatistics() {
    const elapsedTime = getElapsedTimeInSeconds();
    const missedGain = failureCount * 200;
    const gained = (successCount * 200) + (bigMissSuccess * 1000);
    const cumulativeBalance = Object.values(tokenBalances).reduce((sum, value) => sum + value, 0);
    console.log(`Tempo dall'avvio: ${Math.floor(elapsedTime/3600)} ore ${((elapsedTime/60) % 60).toFixed(0)} minuti ${(elapsedTime % 60).toFixed(0)} secondi`);
    console.log(`-> Richieste elaborate: ${successCount} --- Richieste fallite: ${failureCount} --- Richieste misisoni speciali elaborate: ${bigMissSuccess}`);
    console.log(`-> Guadagno sessione: ${gained.toFixed(0)} GOATS --- Guadagno mancato: ${missedGain} GOATS ---  Missioni in esecuzione su ${bearerTokens.length} bearers:`);
    for (const bearerToken of bearerTokens) {
        console.log(`(${bearerTokens.indexOf(bearerToken)}): ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)} -> balance: ${tokenBalances[bearerToken]} GOATS`)
    }
    console.log(`-> Balance totale: ${cumulativeBalance} GOATS`);
}

async function performRequestCycle(bearerToken) {
    setInterval(async () => {
        await makeRequest(bearerToken);
        await sleep(7500);
        const betResponse = await makeBetRequest(bearerToken);
        if (betResponse) {
            tokenBalances[bearerToken] = +betResponse?.user?.balance;
        }
        if (bearerTokens.indexOf(bearerToken) === bearerTokens.length - 1) {
            logStatistics();
        }
    }, 60500);
}

function start() {
    bearerTokens.forEach(async (bearerToken) => {
        betFailures[bearerToken] = 0;
        tokenBalances[bearerToken] = 0;
        if (bearerTokens.indexOf(bearerToken) !== 0) {
            await sleep(4000 * bearerTokens.indexOf(bearerToken));
        }
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
        console.error(`Errore (${(error.message).slice(0, 4)}) nel recuperare le missioni per Token: ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)}`);
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
        console.error(`Errore (${(error.message).slice(0, 4)}) nell'eseguire la missione ${missionId} per Token: ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)}`);
    }
}

async function processMissionsForBearer(bearerToken) {
    const missionsData = await getMissions(bearerToken);
    if (!missionsData) return;
    for (const [missionGroup, missions] of Object.entries(missionsData)) {
        for (const mission of missions) {
            if (mission.status === false) {
                await sleep(250);
                await executeMission(bearerToken, mission._id);
                bigMissSuccess++;
            } else {
                console.log(`Missione ${mission._id} risulta già eseguita`)
            }
        }
    }
}

async function startHourlyProcess() {
    for (const bearerToken of bearerTokens) {
        if (bearerTokens.indexOf(bearerToken) !== 0) {
            await sleep(2500 * bearerTokens.indexOf(bearerToken));
        }
        console.log(`Controllo missioni da eseguire per Bearer Token: ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)}`);
        await processMissionsForBearer(bearerToken);
    }
    setInterval(async () => {
        for (const bearerToken of bearerTokens) {
            if (bearerTokens.indexOf(bearerToken) !== 0) {
                await sleep(5000 * bearerTokens.indexOf(bearerToken));
            }
            console.log(`Controllo missioni da eseguire per Bearer Token: ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)}`);
            await processMissionsForBearer(bearerToken);
        }
    }, 60 * 60 * 1000 * 8); // Ripeti ogni 8 ore
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Service is running on port ${port}`);
});
startHourlyProcess();
start();


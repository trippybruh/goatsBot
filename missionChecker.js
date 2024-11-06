const cloudscraper = require('cloudscraper');
const express = require('express');
const app = express();
const startTime = Date.now();

const myBearer = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmMDI2NGZhNzVkYjBjZjYzYmY4YjAwIiwiaWF0IjoxNzMwOTMyMjAwLCJleHAiOjE3MzEwMTg2MDAsInR5cGUiOiJhY2Nlc3MifQ.ori1iYMpbCsYdbjbLfpz9J9jjBeMljHLcd3bTGlqlsk';
const bearerTokens = [
    myBearer,
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcxMjYyMzFmMDNmYTFmNjhhYjcyZjhmIiwiaWF0IjoxNzMwOTMyMzY4LCJleHAiOjE3MzEwMTg3NjgsInR5cGUiOiJhY2Nlc3MifQ.8i4TvFPlhy-fCxkO6rkxNoYGIls-n-CaOKXYP82PEAI',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcxM2FiNDgzNmVmODEzMWM1MjAyNmE2IiwiaWF0IjoxNzMwOTMyNDI3LCJleHAiOjE3MzEwMTg4MjcsInR5cGUiOiJhY2Nlc3MifQ.NSv8ub-bNPd9t4Qnjr7XMWD-McGA0lAFzJ0eLtEZaFI',
]

const betData = {
    "point_milestone": 90,
    "is_upper": false,
    "bet_amount": 5
};

const headersApi = {
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
}

const get_mission_api_url = 'https://api-mission.goatsbot.xyz/missions/user';
const get_checkin_api_url = 'https://api-checkin.goatsbot.xyz/checkin/user';
const get_refresh_api_url = 'https://dev-api.goatsbot.xyz/auth/refresh-tokens'
const execute_mission_api_url = 'https://dev-api.goatsbot.xyz/missions/action/'
const execute_checkin_api_url = 'https://api-checkin.goatsbot.xyz/checkin/action/'
const execute_cinema_api_url = 'https://dev-api.goatsbot.xyz/goat-cinema/watch'
const execute_bet_balance_api_url = 'https://api-dice.goatsbot.xyz/dice/action'

let bigMissSuccess = 0;
let successCount = 0;
let failureCount = 0;
let betSuccess = 0;
let betFailures = {};
let tokenBalances = {};

// EXEC LOOP
// loop().then()

function getElapsedTimeInSeconds() {
    const currentTime = Date.now();
    return ((currentTime - startTime) / 1000).toFixed(2);
}

async function loop() {
    console.log('🚀 Start')
    while (true) {
        await startLoopCycle();
        // log shit
    }
}

async function startLoopCycle() {
    for (const token of userTokens) {
        const {bearer, refresh} = token
        await missions(bearer, refresh) // Ads compresa
        await checkin(bearer, refresh)
        await cinema(bearer, refresh)
        await sumBalance(bearer, refresh) // senza bet disonesta
        console.log(`📊 Token: ${bearer.slice(-5)} | Success: ${successCount} | Error: ${errorCount}`)
        await pauseExecution(500)
    }
}

async function makeBetRequest(bearerToken) {
    const options = {
        method: 'POST',
        url: execute_bet_balance_api_url,
        headers: {
            ...headersApi,
            'Authorization': `Bearer ${bearerToken}`,
        },
        body: JSON.stringify(betData),
        timeout: 5000
    };
    try {
        const response = await cloudscraper(options);
        betSuccess++;
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
            ...headersApi,
            'Authorization': `Bearer ${bearerToken}`,
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
    console.log(`-> Richieste elaborate: ${successCount} --- Richieste fallite: ${failureCount} --- Richieste missioni speciali elaborate: ${bigMissSuccess}`);
    console.log(`-> Guadagno sessione: ${gained.toFixed(0)} GOATS --- Guadagno mancato: ${missedGain} GOATS --- Guadagno bets ${(betSuccess*0.22).toFixed(0)} GOATS`);
    console.log(`-> Missioni in esecuzione su ${bearerTokens.length} bearers:`);
    for (const bearerToken of bearerTokens) {
        console.log(`-> (${bearerTokens.indexOf(bearerToken) + 1}): ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)} -> balance: ${tokenBalances[bearerToken]} GOATS`)
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
        url: get_mission_api_url,
        headers: {
            ...headersApi,
            'Authorization': `Bearer ${bearerToken}`
        },
    };

    try {
        const response = await cloudscraper(options);
        return JSON.parse(response);
    } catch (error) {
        console.error(`Errore (${(error.message)}) nel recuperare le missioni per Token: ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)}`);
        return null;
    }
}

async function executeMission(bearerToken, missionId) {
    const options = {
        method: 'POST',
        url: `${execute_mission_api_url}${missionId}`,
        headers: {
            ...headersApi,
            'Authorization': `Bearer ${bearerToken}`,
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


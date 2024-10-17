const cloudscraper = require('cloudscraper');
const startTime = Date.now();
const myBearer = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmMDI2NGZhNzVkYjBjZjYzYmY4YjAwIiwiaWF0IjoxNzI5MTIxMjQ3LCJleHAiOjE3MjkyMDc2NDcsInR5cGUiOiJhY2Nlc3MifQ.jdmqoWMhFCV1oFTkeUGXfT39wFy4Mfd-9uqyW2aB0lY';
const bearerTokens = [
    myBearer,
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcwNDBhNjYzOGE4ZTVkMjY0YTk2Mjg2IiwiaWF0IjoxNzI5MTIxMDc2LCJleHAiOjE3MjkyMDc0NzYsInR5cGUiOiJhY2Nlc3MifQ.DZkeGRSETSzKUXVAN3qkudKbFyvyfvf9KA_DGuEL4DM',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcwNDc5YTMwMTRmNDcwZTVhYjViZDdlIiwiaWF0IjoxNzI5MTIwOTU5LCJleHAiOjE3MjkyMDczNTksInR5cGUiOiJhY2Nlc3MifQ.mgPkCxloRcnkGfh8Uxhki1MF6PSMHab_Ht-mNaZvlRY',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcwNzIxOTkwMTRmNDcwZTVhMDUxNjcxIiwiaWF0IjoxNzI5MTIwODY3LCJleHAiOjE3MjkyMDcyNjcsInR5cGUiOiJhY2Nlc3MifQ.TczAnB280jpDnAG9OVzHdCCCQlFy4iR4fQMbHUxjcos',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcwNzI1NWM3NDU0ZmY1MGRmYjhjZjM0IiwiaWF0IjoxNzI5MTIwNzk1LCJleHAiOjE3MjkyMDcxOTUsInR5cGUiOiJhY2Nlc3MifQ.75xh7YwyycGtnaFMqU5OGWKLtvcV19EM2dsYlLMwvNk'
];

const data = {
    "point_milestone": 90,
    "is_upper": false,
    "bet_amount": 5
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

function startHourlyProcess() {
    for (const bearerToken of bearerTokens) {
        if (bearerTokens.indexOf(bearerToken) !== 0) {
            if (bearerToken === myBearer) continue;
            sleep(2500 * bearerTokens.indexOf(bearerToken));
        }
        console.log(`Controllo missioni da eseguire per Bearer Token: ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)}`);
        processMissionsForBearer(bearerToken);
    }
    setInterval(async () => {
        for (const bearerToken of bearerTokens) {
            if (bearerTokens.indexOf(bearerToken) !== 0) {
                if (bearerToken === myBearer) continue;
                await sleep(25000 * bearerTokens.indexOf(bearerToken));
            }
            console.log(`Controllo missioni da eseguire per Bearer Token: ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)}`);
            await processMissionsForBearer(bearerToken);
        }
    }, 60 * 60 * 1000); // Ripeti ogni ora
}

//startHourlyProcess();
start();


const cloudscraper = require('cloudscraper');

const startTime = Date.now();
const myBearer = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmMDI2NGZhNzVkYjBjZjYzYmY4YjAwIiwiaWF0IjoxNzI4OTQ2NDAxLCJleHAiOjE3MjkwMzI4MDEsInR5cGUiOiJhY2Nlc3MifQ.fo1T4QdniTQR3xOo-8r_-KUsj2ku-rtLphinL3BtbBg';
const bearerTokens = [
    myBearer,
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcwNDBhNjYzOGE4ZTVkMjY0YTk2Mjg2IiwiaWF0IjoxNzI4OTQ2MjIxLCJleHAiOjE3MjkwMzI2MjEsInR5cGUiOiJhY2Nlc3MifQ.kgPCvuiE66b09EL4RFiQA04eHc0sammrIRa7GrxoaG8',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcwNDc5YTMwMTRmNDcwZTVhYjViZDdlIiwiaWF0IjoxNzI4OTQ2MTQ3LCJleHAiOjE3MjkwMzI1NDcsInR5cGUiOiJhY2Nlc3MifQ.NCOeA-L16FMGttAYHgPTs2v8rRlMDUMRM4rzKirCTuM',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcwNzIxOTkwMTRmNDcwZTVhMDUxNjcxIiwiaWF0IjoxNzI4OTQ2MDU5LCJleHAiOjE3MjkwMzI0NTksInR5cGUiOiJhY2Nlc3MifQ.2mT7GFcGNNbD1bdD2g774SZkWGmSjBcQnWJTCq8ggjU',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcwNzI1NWM3NDU0ZmY1MGRmYjhjZjM0IiwiaWF0IjoxNzI4OTQ2MzM1LCJleHAiOjE3MjkwMzI3MzUsInR5cGUiOiJhY2Nlc3MifQ.MEH7Flv51ccrnk7lE8K6fXQ-SfHcicDIJwTJS9tlwgg'
];

const data = {
    "point_milestone": 90,
    "is_upper": false,
    "bet_amount": 5
};
let bigMissSuccess = 0;
let successCount = 0;
let failureCount = 0;
let cumulativeBalance = 0;

function getElapsedTimeInSeconds() {
    const currentTime = Date.now();
    return ((currentTime - startTime) / 1000).toFixed(2);
}

async function makeBetRequest(bearerToken) {
    const options = {
        method: 'POST',
        url: 'https://dev-api.goatsbot.xyz/dice/action',
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
        console.log(`Errore richiesta bet di controllo: ${(error.message).slice(0, 4)}`);
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
        console.log(`Errore richiesta: ${(error.message).slice(0, 4)}`)
        failureCount++;
        return null;
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function logStatistics() {
    const elapsedTime = getElapsedTimeInSeconds();
    const gained = (successCount * 200) + (bigMissSuccess * 1000);
    console.log(`Tempo dall'avvio: ${Math.floor(elapsedTime/3600)} ore ${((elapsedTime/60) % 60).toFixed(0)} minuti ${(elapsedTime % 60).toFixed(0)} secondi 
    Richieste elaborate: ${successCount} --- Richieste fallite: ${failureCount} --- Richieste misisoni speciali elaborate: ${bigMissSuccess}
    Guadagn sessione: ${gained.toFixed(0)} GOATS --- Missioni in esecuzione su ${bearerTokens.length} bearers:`)
    for (const bearerToken of bearerTokens) {
        console.log(`-${bearerTokens.indexOf(bearerToken)}) ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)}`)
    }
    console.log(`Balance totale: ${cumulativeBalance} GOATS`);
}

async function performRequestCycle(bearerToken) {
    setInterval(async () => {
        await makeRequest(bearerToken);
        await sleep(1500);
        const betResponse = await makeBetRequest(bearerToken);
        if (betResponse) {
            cumulativeBalance += +betResponse?.user?.balance;
        }
        if (bearerTokens.indexOf(bearerToken) === bearerTokens.length - 1) {
            logStatistics();
            cumulativeBalance = 0;
        }
    }, 60500);
}

function start() {
    bearerTokens.forEach(async (bearerToken) => {
        if (bearerTokens.indexOf(bearerToken) !== 0) {
            await sleep(3000 * bearerTokens.indexOf(bearerToken));
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
            sleep(5000 * bearerTokens.indexOf(bearerToken));
        }
        console.log(`Controllo missioni da eseguire per Bearer Token: ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)}`);
        processMissionsForBearer(bearerToken);
    }
    setInterval(async () => {
        for (const bearerToken of bearerTokens) {
            if (bearerTokens.indexOf(bearerToken) !== 0) {
                await sleep(5000 * bearerTokens.indexOf(bearerToken));
            }
            console.log(`Controllo missioni da eseguire per Bearer Token: ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)}`);
            await processMissionsForBearer(bearerToken);
        }
    }, 60 * 60 * 1000); // Ripeti ogni ora
}

//startHourlyProcess();
start();


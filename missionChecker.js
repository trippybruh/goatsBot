const cloudscraper = require('cloudscraper');

const startTime = Date.now();
const myBearer = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmMDI2NGZhNzVkYjBjZjYzYmY4YjAwIiwiaWF0IjoxNzI4Njk5MTg1LCJleHAiOjE3Mjg3ODU1ODUsInR5cGUiOiJhY2Nlc3MifQ.Xz9PKpgRA90HwuvLK3hq8jVUqr000-85bwWmnQ5FIgA';
const bearerTokens = [
    myBearer,
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcwNDBhNjYzOGE4ZTVkMjY0YTk2Mjg2IiwiaWF0IjoxNzI4Njk5MTAxLCJleHAiOjE3Mjg3ODU1MDEsInR5cGUiOiJhY2Nlc3MifQ.YX0cYpmM_am71SKq4ayMsuZSr3IE0lJxhquPjbp3IVQ',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcwNDc5YTMwMTRmNDcwZTVhYjViZDdlIiwiaWF0IjoxNzI4Njk5MDMyLCJleHAiOjE3Mjg3ODU0MzIsInR5cGUiOiJhY2Nlc3MifQ.4WMMZLITyPHEvHZJvYE0AjPFQKjxBh80SHZiOkafKWg',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcwNzIxOTkwMTRmNDcwZTVhMDUxNjcxIiwiaWF0IjoxNzI4Njk4OTQ2LCJleHAiOjE3Mjg3ODUzNDYsInR5cGUiOiJhY2Nlc3MifQ.iwM_GFY7yA6MbJiK959xytx8IaUx0cpNJO9AoXmhEDI',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcwNzI1NWM3NDU0ZmY1MGRmYjhjZjM0IiwiaWF0IjoxNzI4Njk4ODYzLCJleHAiOjE3Mjg3ODUyNjMsInR5cGUiOiJhY2Nlc3MifQ.PKEiEwoiDvWvzoDG1-YGG63d6jqlsAbS4n_iLPY-Bts'
];

let bigMissSuccess = 0;
let successCount = 0;
let failureCount = 0;
let cumulativeBalance = 0;

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
    console.log(`Tempo dall'avvio: ${elapsedTime} secondi (${(elapsedTime/60).toFixed(0)}) minuti 
    Richieste elaborate: ${successCount} --- Richieste fallite: ${failureCount} --- Richieste misisoni speciali elaborate: ${bigMissSuccess}
    Totale cumulativo accounts: ${cumulativeBalance} GOATS --- Guadagno: ${gained.toFixed(0)} GOATS
    Missioni in esecuzione su ${bearerTokens.length} bearers:`)
    for (const bearerToken of bearerTokens) {
        console.log(`-${bearerTokens.indexOf(bearerToken)}) ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)}`)
    }
}

async function performRequestCycle(bearerToken) {
    const intervalId = setInterval(async () => {
        const response = await makeRequest(bearerToken);
        cumulativeBalance += response?.user?.balance;
        if (response && bearerTokens.indexOf(bearerToken) === bearerTokens.length - 1) {
            logStatistics();
            cumulativeBalance = 0;
        }
    }, 60500);
}

function start() {
    bearerTokens.forEach(async (bearerToken) => {
        if (bearerTokens.indexOf(bearerToken) !== 0) {
            await sleep(5000 * bearerTokens.indexOf(bearerToken));
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

startHourlyProcess();
start();


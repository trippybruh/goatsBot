const cloudscraper = require('cloudscraper');
const axios = require('axios');

const CALLS_PER_SECOND = 1; // ad account
const DELAY = 0

const bearerTokens = [
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmMDI2NGZhNzVkYjBjZjYzYmY4YjAwIiwiaWF0IjoxNzI3NTM0NzM2LCJleHAiOjE3Mjc2MjExMzYsInR5cGUiOiJhY2Nlc3MifQ.K3LRDJ8jgC_f330joe3RbZNZKNiFAUGcyLWUVo2N62s'
]

const proxies = [
    {host: '136.0.61.87', port: 20000, username: 'lorenzo1', password: 'lorenzo_goats1'},
];

const startTime = Date.now();
let successCount = 0;
let failureCount = 0;
const bearerBalances = {};
let requestCount = 0;
const pauseTime = 60000;

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

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

    if (proxies[0]) {
        options.proxy = `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
    }

    try {
        const response = await cloudscraper(options);
        const jsonResponse = JSON.parse(response);
        await sleep(300);
        successCount++;
        return jsonResponse;
    } catch (error) {
        logError(error.message, bearerToken, '');
        failureCount++;
        return null;
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


async function makeRequest2(bearerToken) {
    const options = {
        method: 'POST',
        url: 'https://dev-api.goatsbot.xyz/missions/action/66db47e2ff88e4527783327e',
        headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json'
        },

    };

    if (proxies[0]) {
        options.proxy = `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
    }

    try {
        const response = await cloudscraper(options);
        const jsonResponse = JSON.parse(response);
        successCount++;
        return jsonResponse;
    } catch (error) {
        logError(error.message, bearerToken, 'No Proxy');
        failureCount++;
        return null;
    }
}

function logStatistics(bearerToken, proxy = null, response) {
    const elapsedTime = getElapsedTimeInSeconds();
    const ratioWL = (failureCount === 0) ? successCount.toFixed(2) : (successCount / failureCount).toFixed(2);

    if (response) {
        const balance = response?.user?.balance || 0;
        const bearerId = bearerToken.slice(-5);

        if (!bearerBalances[bearerId]) {
            bearerBalances[bearerId] = {initial: balance, current: balance};
        } else {
            bearerBalances[bearerId].current = balance;
        }
    }

    const balanceDifference = Object.values(bearerBalances).reduce((acc, {
        initial,
        current
    }) => acc + (current - initial), 0);

    console.log(`📊 Successi: ${successCount} | Fallimenti: ${failureCount} | Tempo: ${elapsedTime}s | Successi/s: ${(successCount / elapsedTime).toFixed(1)} | Successi/Fallimenti: ${ratioWL} | Token: ...${bearerToken.slice(-5)} | Proxy: ${proxy ? proxy.host + ':' + proxy.port : 'No Proxy'} | Differenza Totale Balance: ${balanceDifference}`);
}

function logError(msg, bearerToken, proxy = null) {
    console.log(`📊 ${msg} | Token: ${bearerToken.slice(-5)} | Proxy: ${proxy ? proxy.host + ':' + proxy.port : 'No Proxy'}`);
}

async function performRequestCycle(bearerToken) {
    const data = {
        "point_milestone": 66,
        "is_upper": false,
        "bet_amount": 1
    };


    const response = await makeRequest(data, bearerToken);

    if (response) {
        logStatistics(bearerToken, '', response);
    }


}

// Funzione per fare chiamate senza proxy ogni 100ms
async function performRequestCycleNoProxy(bearerToken) {

    try {
        const response = await makeRequest2(bearerToken); // Nessun proxy

        if (response) {
            logStatistics(bearerToken, null, response);
        }
    } catch (e) {
        console.log(e.message)
    }
    requestCount++;

}

function start() {
    bearerTokens.forEach(async (bearerToken) => {
        await performRequestCycle(bearerToken); // Esegue la logica con proxy
    });
}

function pauseExecution(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function startNoProxy() {
    setInterval(async () => {
        // Esegui il ciclo solo una volta ogni 60 secondi
        await performBearerCycles();
    }, 62000); // 60 secondi
}

async function performBearerCycles() {
    for (const bearerToken of bearerTokens) {
        await performRequestCycleNoProxy(bearerToken); // Esegui la logica per ogni bearerToken
    }

    if (requestCount >= (bearerTokens.length - 1) * 45) {
        console.log(`🚨 Limite di richieste raggiunto. Pausa per 1 minuto.`);
        await pauseExecution(pauseTime);
        requestCount = 0;
    }
}

async function getMissions(bearerToken) {
    const options = {
        method: 'GET',
        url: 'https://api-mission.goatsbot.xyz/missions/user',
        headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await cloudscraper(options);
        return JSON.parse(response); // Restituisce i dati delle missioni
    } catch (error) {
        console.error(`Errore nel recuperare le missioni per Bearer Token: ${bearerToken}`, error.message);
        return null;
    }
}

// Funzione per eseguire una missione (chiamata POST)
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

// Funzione per gestire le missioni con cooldown asincrono
async function handleCooldownMission(bearerToken, mission) {
    const cooldownTime = mission.cooldown_time + 1; // Aggiungi 1 secondo di buffer
    console.log(`Missione ${mission._id} ha un cooldown di ${cooldownTime} secondi.`);

    setTimeout(async () => {
        await executeMission(bearerToken, mission._id);
        // Continua a rieseguire la missione dopo il cooldown
        handleCooldownMission(bearerToken, mission);
    }, cooldownTime * 1000);
}

// Funzione per processare le missioni di un Bearer Token
async function processMissionsForBearer(bearerToken) {
    const missionsData = await getMissions(bearerToken);
    if (!missionsData) return;

    // Processa tutte le missioni serialmente
    for (const [missionGroup, missions] of Object.entries(missionsData)) {
        for (const mission of missions) {
            if (mission.status === false && !mission.cooldown_time) {
                // Esegui immediatamente la missione
                await executeMission(bearerToken, mission._id);

                // Se la missione ha un cooldown_time, avvia la gestione asincrona del cooldown
                /*  if (mission.cooldown_time) {
                      handleCooldownMission(bearerToken, mission); // Asincrona
                  }*/
            }
        }
    }
}

// Funzione per processare tutti i Bearer Token in modo seriale
async function processAllBearers() {
    for (const bearerToken of bearerTokens) {
        console.log(`Inizio processo per Bearer Token: ${bearerToken}`);
        await processMissionsForBearer(bearerToken);
    }
}

// Funzione principale che esegue il processo ogni ora
function startHourlyProcess() {
    processAllBearers(); // Esegui la prima volta
    setInterval(processAllBearers, 60 * 60 * 1000 * 12); // Ripeti ogni ora
}

startHourlyProcess(); // Avvia il processo
//start(); // Avvia il ciclo con proxy
startNoProxy(); // Avvia il ciclo senza proxy con intervallo di 100ms
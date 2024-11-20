const cloudscraper = require('cloudscraper');
const axios = require('axios')
const express = require('express');
const zlib = require('zlib');
const app = express();
const startTime = Date.now();

const bearerTokens = [
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcxMjYyMzFmMDNmYTFmNjhhYjcyZjhmIiwiaWF0IjoxNzMyMDMxMzcxLCJleHAiOjE3MzIxMTc3NzEsInR5cGUiOiJhY2Nlc3MifQ.lX_ysfWVwwkYcyotnpQZp9Q29fnfqA3E3dZ3u1zZUy8',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcxM2FiNDgzNmVmODEzMWM1MjAyNmE2IiwiaWF0IjoxNzMyMDc0MTc0LCJleHAiOjE3MzIxNjA1NzQsInR5cGUiOiJhY2Nlc3MifQ.fqX2kebVa7L0VVEwG6l-zcmrp7fVptyFMSiEPu4WAlc',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcxNmEzOGMxOTM3ZDJlZWU3MWI2YTM4IiwiaWF0IjoxNzMyMDc0MjI3LCJleHAiOjE3MzIxNjA2MjcsInR5cGUiOiJhY2Nlc3MifQ.Ldl8UzA2y3I3_7Bg_SM52dndbKsUODmdKYiV3Eo7sWs'
]

const data = {
    "point_milestone": 90,
    "is_upper": false,
    "bet_amount": 5
};

const headerApi = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) ' +
        'Chrome/129.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
    'Origin': 'https://dev.goatsbot.xyz',
    'Referer': 'https://dev.goatsbot.xyz/',
    'Sec-CH-UA': '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
    'Sec-CH-UA-Mobile': '?0',
    'Sec-CH-UA-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
}

const get_mission_api_url = 'https://api-mission.goatsbot.xyz/missions/user';
const get_checkin_api_url = 'https://api-checkin.goatsbot.xyz/checkin/user';
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

function logStatistics() {
    const elapsedTime = getElapsedTimeInSeconds();
    const missedGain = failureCount * 50;
    const gained = (successCount * 50) + (bigMissSuccess * 100);
    const cumulativeBalance = Object.values(tokenBalances).reduce((sum, value) => sum + value, 0);
    console.log(`IN ESECUZIONNE DA: ${Math.floor(elapsedTime/3600)} ore ${((elapsedTime/60) % 60).toFixed(0)} minuti ${(elapsedTime % 60).toFixed(0)} secondi`);
    console.log(`-> Richieste elaborate: ${successCount} --- Richieste fallite: ${failureCount} --- Richieste missioni speciali elaborate: ${bigMissSuccess}`);
    console.log(`-> Guadagno sessione: ${gained.toFixed(0)} GOATS --- Guadagno mancato: ${missedGain} GOATS --- Guadagno bets ${(betSuccess*0.22).toFixed(0)} GOATS`);
    console.log(`-> Missioni in esecuzione su ${bearerTokens.length} bearers:`);
    for (const bearerToken of bearerTokens) {
        console.log(`-> (${bearerTokens.indexOf(bearerToken) + 1}): ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)} -> balance: ${tokenBalances[bearerToken]} GOATS`)
    }
    console.log(`---> Balance totale: ${cumulativeBalance} GOATS <---`);
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getElapsedTimeInSeconds() {
    const currentTime = Date.now();
    return ((currentTime - startTime) / 1000).toFixed(2);
}

async function makeBetRequest(bearerToken) {
    const options = {
        method: 'POST',
        url: execute_bet_balance_api_url,
        headers: {
            ...headerApi,
            Authorization: `Bearer ${bearerToken}`,
        },
        body: JSON.stringify(data),
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

async function makeMissionRequest(bearerToken) {
    let proceed = false;
    const missionsData = await getMissions(bearerToken);
    if (!missionsData) return;
    for (const [missionGroup, missions] of Object.entries(missionsData)) {
        for (const mission of missions) {
            if (mission._id === '66db47e2ff88e4527783327e' && mission.count < 50) {
                proceed = true;
                break;
            }
        }
    }
    if (proceed) {
        const options = {
            method: 'POST',
            url: `${execute_mission_api_url}66db47e2ff88e4527783327e`,
            headers: {
                ...headerApi,
                Authorization: `Bearer ${bearerToken}`,
            },
        };
        try {
            const response = await cloudscraper(options);
            const jsonResponse = JSON.parse(response);
            successCount++;
            return jsonResponse;
        } catch (error) {
            console.log(`Errore richiesta: ${(error.message)} --- Token: ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)}`);
            failureCount++;
            return null;
        }
    } else {
        console.log(`Missioni da 1 minuto esaurite --- Token: ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)}`);
        return null;
    }

}

async function performRequestCycle(bearerToken) {
    setInterval(async () => {
        await makeMissionRequest(bearerToken);
        await sleep(7500);
        // const betResponse = await makeBetRequest(bearerToken);
        //if (betResponse) {
            //tokenBalances[bearerToken] = +betResponse?.user?.balance;
        //}
        if (bearerTokens.indexOf(bearerToken) === bearerTokens.length - 1) {
            logStatistics();
        }
    }, 60500);
}

async function getMissions(bearerToken) {
    const options = {
        responseType: 'arraybuffer',
        headers: {
            ...headerApi,
            Authorization: `Bearer ${bearerToken}`,
        }
    };
    try {
        const response = await axios.get(get_mission_api_url, options)
        const encoding = response.headers['content-encoding'];
        let data;
        if (encoding === 'gzip') {
            data = zlib.gunzipSync(response.data).toString();
        } else if (encoding === 'deflate') {
            data = zlib.inflateSync(response.data).toString();
        } else if (encoding === 'br') {
            data = zlib.brotliDecompressSync(response.data).toString();
        } else {
            data = response.data.toString();
        }
        return JSON.parse(data);
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
            ...headerApi,
            Authorization: `Bearer ${bearerToken}`,
        },
    };
    try {
        const response = await cloudscraper(options);
        console.log(`---> Missione ...${missionId.slice(-5)} completata con successo`);
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
                console.log(`-> Missione ...${mission._id.slice(-5)} risulta già eseguita`)
            }
        }
    }
}

async function cinema(bearer) {
    for (let i = 0; i < 3; i++) {
        if (await executeCinema(bearer)) {
            console.log(`---> Cinema per ${bearer.slice(0, 5)}...${bearer.slice(-5)} (${i+1}/3)`);
        }
    }
}

async function executeCinema(bearer) {
    const options = {
        method: 'POST',
        url: execute_cinema_api_url,
        headers: {
            ...headerApi,
            Authorization: `Bearer ${bearer}`,
        }
    }
    try {
        const response = await cloudscraper(options);
        return JSON.parse(response);
    } catch (error) {
        console.error(`Errore (${(error.message)}) nell'eseguire cinema per: ${bearer.slice(0, 5)}...${bearer.slice(-5)}`);
        return null;
    }
}

async function checkin(bearer) {
    const checkinData = await getCheckin(bearer)
    if (checkinData) {
        for (const checkin of checkinData.result) {
            if (checkin.status === false) {
                if (await executeCheckin(bearer, checkin._id)) {
                    console.log(`---> Check-in completato per ${bearer.slice(0, 5)}...${bearer.slice(-5)}`);
                }
                break;
            }
        }
    }
}

async function executeCheckin(bearer, checkinId) {
    const options = {
        method: 'POST',
        url: `${execute_checkin_api_url}${checkinId}`,
        headers: {
            ...headerApi,
            Authorization: `Bearer ${bearer}`,
        }
    }
    try {
        const response = await cloudscraper(options);
        return JSON.parse(response);
    } catch (error) {
        console.error(`Errore (${(error.message)}) nell'eseguire check-in per: ${bearer.slice(0, 5)}...${bearer.slice(-5)} e check in ID ${checkinId}`);
    }
}

async function getCheckin(bearer) {
    const options = {
        method: 'GET',
        url: get_checkin_api_url,
        headers: {
            ...headerApi,
            Authorization: `Bearer ${bearer}`
        }
    }
    try {
        const response = await cloudscraper(options);
        return JSON.parse(response);
    } catch (error) {
        console.error(`Errore (${(error.message)}) nel recuperare check-in per: ${bearer.slice(0, 5)}...${bearer.slice(-5)}`);
        return null;
    }
}

function loop() {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`---------->>> Service is running on port ${port} <<<----------`);
    });

    // one time per day
    bearerTokens.forEach(async (bearerToken) => {
        if (bearerTokens.indexOf(bearerToken) !== 0) {
            await sleep(10000 * bearerTokens.indexOf(bearerToken));
        }
        console.log(`-> Esecuzione missioni/cinema/check-in per Bearer Token: ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)}`);
        await processMissionsForBearer(bearerToken);
        await sleep(250);
        await cinema(bearerToken);
        await sleep(250);
        await checkin(bearerToken);
        await sleep(250);
    });
    // loop all day
    bearerTokens.forEach(async (bearerToken) => {
        betFailures[bearerToken] = 0;
        tokenBalances[bearerToken] = 0;
        if (bearerTokens.indexOf(bearerToken) !== 0) {
            await sleep(4000 * bearerTokens.indexOf(bearerToken));
        }
        console.log(`-> Avvio loop per Bearer Token: ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)}`)
        await performRequestCycle(bearerToken);
    });
}

// main
loop();




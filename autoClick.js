const cloudscraper = require('cloudscraper');
const express = require('express');

const app = express();
const startTime = Date.now();
const REQ_INTERVAL_DELAY = 5000; // ms
const INTRA_REQ_DELAY = 3500;
const bearer = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcxNmEzOGMxOTM3ZDJlZWU3MWI2YTM4IiwiaWF0IjoxNzMyMDc0MjI3LCJleHAiOjE3MzIxNjA2MjcsInR5cGUiOiJhY2Nlc3MifQ.Ldl8UzA2y3I3_7Bg_SM52dndbKsUODmdKYiV3Eo7sWs';
const bearerTokens = [
    bearer
];
const wheelMult = {
    0 : 0.35,
    1.1 : 0.28,
    1.6 : 0.28,
    1.9 : 0.09
}
const bet_amount = 10;
let successCount = 0;
let failureCount = 0;
let failureStreak = 1;
let balanceChange = 0;
let wheelGames = {
    0 : 0,
    1.1: 0,
    1.6 : 0,
    1.8 : 0,
}

function getElapsedTimeInSeconds() {
    return ((Date.now() - startTime) / 1000).toFixed(2);
}

async function makeRequest(bearerToken, data) {
    const options = {
        method: 'POST',
        url: 'https://api-wheel.goatsbot.xyz/wheel/action',
        headers: {
            'Authorization': `Bearer ${bearerToken}`,
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
        },
        body: JSON.stringify(data),
        timeout: 5000
    };

    try {
        const response = await cloudscraper(options);
        const jsonResponse = JSON.parse(response);
        await sleep(INTRA_REQ_DELAY);
        successCount++;
        failureStreak = 1;
        return jsonResponse;
    } catch (error) {
        console.log(`Errore richiesta: ${(error.message)}`)
        failureCount++;
        failureStreak++;
        return null;
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function logStatistics() {
    const elapsedTime = getElapsedTimeInSeconds();
    const elapsedTimeMin = elapsedTime/60;
    let ratioWL = 'inf';
    let winRate = 'inf';
    let winCount = wheelGames["1.1"] + wheelGames["1.6"] + wheelGames["1.8"];
    let lossCount = wheelGames["0"];
    if (failureCount !== 0) {
        ratioWL = (successCount/failureCount).toFixed(4);
    }
    if (wheelGames["0"] !== 0) {
        winRate = (winCount/lossCount).toFixed(4) * 100;
    }


    const volume = bet_amount*successCount*(winChanceMilestone/100);
    console.log(`Tempo dall'avvio: ${Math.floor(elapsedTime/3600)} ore ${((elapsedTime/60) % 60).toFixed(0)} minuti ${(elapsedTime % 60).toFixed(0)} secondi`);
    console.log(`-> Richieste elaborate: ${successCount} --- Richieste fallite: ${failureCount} --- Richieste totali/min: ${((successCount + failureCount)/elapsedTimeMin).toFixed(2)} (target: ${(60000/REQ_INTERVAL_DELAY).toFixed(1)})`);
    console.log(`-> Successi/Fallimenti: ${ratioWL} --- Successi/min: ${(successCount/elapsedTimeMin).toFixed(2)} --- Fallimenti/min: ${(failureCount/elapsedTimeMin).toFixed(2)}`);
    console.log(`-> Vittorie: ${winCount} --- Sconfitte: ${lossCount} --- Wr%: ${winRate} --- Bet base: ${bet_amount} GOATS`);
    console.log(`-> Performance: ${Math.round(gained)} GOATS --- Volume: ${Math.round(volume)} GOATS`);
}

async function performRequestCycle(bearerToken) {
    const consoleLogStep = 1;
    let cycles = 0;
    const intervalId = setInterval(async () => {
        let data = {
            "bet_amount": bet_amount,
            "wheel_seg": 'Low'
        };
        const response = await makeRequest(bearerToken, data);
        if (!response) {
            if (failureStreak >= 200) {
                console.log(`200 richieste di fila fallite... Spegnimento autoclicker...`);
                await sleep(1000);
                clearInterval(intervalId);
                process.exit(1);
            }
        } else {

        }
        if (cycles % consoleLogStep === 0) {
            logStatistics();
        }
        cycles++;
    }, REQ_INTERVAL_DELAY);
}

function start() {
    bearerTokens.forEach(async (bearerToken) => {
        console.log(`Inizio cicli di richieste per Bearer Token: ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)}
        Configurato per eseguire max ${(1000/REQ_INTERVAL_DELAY).toFixed(2)} richieste/s --- Timeout minimo tra una richiesta ed un altra: ${(INTRA_REQ_DELAY/1000).toFixed(3)} s`);
        await sleep(3000);
        await performRequestCycle(bearerToken);
    });
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Service is running on port ${port}`);
});
start();

const cloudscraper = require('cloudscraper');
const express = require('express');

const app = express();
const startTime = Date.now();
const REQ_INTERVAL_DELAY = 7500; // ms
const INTRA_REQ_DELAY = 5500;
const bearer = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcxNmEzOGMxOTM3ZDJlZWU3MWI2YTM4IiwiaWF0IjoxNzMyMDc0MjI3LCJleHAiOjE3MzIxNjA2MjcsInR5cGUiOiJhY2Nlc3MifQ.Ldl8UzA2y3I3_7Bg_SM52dndbKsUODmdKYiV3Eo7sWs';
const bearerTokens = [
    bearer
];

const baseBet = 5;
let successCount = 0;
let failureCount = 0;
let failureStreak = 1;
let wheelGames = {
    'losses' : 0,
    'wins': 0
}
let wheelBalanceGain = {
    'lossTotal' : 0,
    'winTotal': 0
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

function logStatistics(startingBalance, nextBetAmount, lossStreak, maxLossStreak) {
    const elapsedTime = getElapsedTimeInSeconds();
    const elapsedTimeMin = elapsedTime/60;
    const winCount = wheelGames.wins;
    const lossCount = wheelGames.losses;
    let ratioWL = 'inf';
    let winRate = 'inf';
    let totalGain = wheelBalanceGain.winTotal;
    let totalLoss = wheelBalanceGain.lossTotal;
    let performance = totalGain - totalLoss;
    if (failureCount !== 0) {
        ratioWL = (successCount/failureCount).toFixed(4);
    }
    if (wheelGames["0"] !== 0) {
        winRate = (winCount/lossCount).toFixed(4) * 100;
    }

    console.log(`Tempo dall'avvio: ${Math.floor(elapsedTime/3600)} ore ${((elapsedTime/60) % 60).toFixed(0)} minuti ${(elapsedTime % 60).toFixed(0)} secondi`);
    console.log(`-> Richieste elaborate: ${successCount} --- Richieste fallite: ${failureCount} --- Richieste totali/min: ${((successCount + failureCount)/elapsedTimeMin).toFixed(2)} (target: ${(60000/REQ_INTERVAL_DELAY).toFixed(1)})`);
    console.log(`-> Successi/Fallimenti: ${ratioWL} --- Successi/min: ${(successCount/elapsedTimeMin).toFixed(2)} --- Fallimenti/min: ${(failureCount/elapsedTimeMin).toFixed(2)}`);
    console.log(`-> Vittorie: ${winCount} --- Sconfitte: ${lossCount} --- Wr%: ${winRate} --- Bet base: ${baseBet} GOATS`);
    console.log(`-> Performance: ${performance} GOATS --- Balance iniziale: ${startingBalance} GOATS --- Balance attuale: ${startingBalance - performance} GOATS`);
    console.log(`-> Streak sconfitte: ${lossStreak} (Max streak: ${maxLossStreak}) --- Prossima bet: ${nextBetAmount} GOATS`);
}

async function performRequestCycle(bearerToken) {
    const consoleLogStep = 1;
    let cycles = 0;
    let startingBalance = 0
    let data = {
        "bet_amount": baseBet,
        "wheel_seg": 'Low'
    };
    let lossStreak = 0;
    let maxLossStreak = 0;

    const intervalId = setInterval(async () => {
        const response = await makeRequest(bearerToken, data);
        let newBet = 0;
        if (cycles === 0 || startingBalance === 0) {
            startingBalance += +response?.user?.balance;
        }
        if (!response) {
            if (failureStreak >= 200) {
                console.log(`200 richieste di fila fallite... Spegnimento autoclicker...`);
                await sleep(1000);
                clearInterval(intervalId);
                process.exit(1);
            }
        } else {
            let lastBetAmount = +response?.wheel?.bet_amount;
            if (!response?.wheel?.is_win) {
                lossStreak += 1
                wheelGames.losses += 1;
                wheelBalanceGain.lossTotal += lastBetAmount;
                if (lossStreak === 1) {
                    newBet = lastBetAmount * 2;
                } else if (lossStreak === 2) {
                    newBet = lastBetAmount * 4;
                } else if (lossStreak === 3) {
                    newBet = lastBetAmount * 6;
                } else if (lossStreak === 4) {
                    newBet = lastBetAmount * 10;
                } else {
                    newBet = lastBetAmount;
                }
                if (lossStreak > maxLossStreak) {
                    maxLossStreak = lossStreak;
                }
            } else {
                lossStreak = 0;
                wheelGames.wins += 1;
                wheelBalanceGain.winTotal += (+response?.wheel?.reward - lastBetAmount);
                newBet = baseBet;
            }
            data = {
                "bet_amount": newBet,
                "wheel_seg": 'Low'
            }
        }
        if (cycles % consoleLogStep === 0) {
            logStatistics(startingBalance, newBet, lossStreak, maxLossStreak);
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

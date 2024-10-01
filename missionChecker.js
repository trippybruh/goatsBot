const cloudscraper = require('cloudscraper');
const axios = require('axios');
const express = require('express');

const app = express();
const startTime = Date.now();
const bearer = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmMDI2NGZhNzVkYjBjZjYzYmY4YjAwIiwiaWF0IjoxNzI3ODAyODcxLCJleHAiOjE3Mjc4ODkyNzEsInR5cGUiOiJhY2Nlc3MifQ.Rq00pzsPDfHyiz-B6LiU-O2su0DV_i6XTpJ4OoIF8eQ';
const bearerTokens = [
    //bearerPrefix.concat('E8YZmA0aBznfiOF92H3OJxZqCIWqX_fW_dxwTvSSoh0')
    bearer
];
const proxies = [
    {host:'109.236.83.153', port: '8888', username:'', password:''},
    {host:'111.59.4.88', port: '9002', username:'', password:''},
    {host:'135.181.154.225', port: '80', username:'', password:''},
    {host:'113.108.242.106', port: '8181', username:'', password:''},
    {host:'106.227.95.142', port: '3129', username:'', password:''},
    {host:'152.26.229.34', port: '9443', username:'', password:''},
    {host:'134.209.29.120', port: '3128', username:'', password:''}
]

let bigMissSuccess = 0;
let successCount = 0;
let failureCount = 0;

function getElapsedTimeInSeconds() {
    const currentTime = Date.now();
    return ((currentTime - startTime) / 1000).toFixed(2);
}

function getRandomProxy() {
    return proxies[Math.floor(Math.random() * proxies.length)];
}

async function makeRequest(bearerToken) {
    //let randomProxy = getRandomProxy();
    const options = {
        method: 'POST',
        url: 'https://dev-api.goatsbot.xyz/missions/action/66db47e2ff88e4527783327e',
        headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json'
        }
        //proxy: `http://${randomProxy.host}:${randomProxy.port}`
    };

    try {
        const response = await cloudscraper(options);
        const jsonResponse = JSON.parse(response);
        successCount++;
        return jsonResponse;
    } catch (error) {
        logError(error.message, bearerToken);
        failureCount++;
        return null;
    }
}

function logStatistics(response) {
    const elapsedTime = getElapsedTimeInSeconds();
    const elapsedTimeMin = elapsedTime/60;

    if (response) {
        const gained = (successCount * 200) + (bigMissSuccess * 1000);
        console.log(`Tempo dall'avvio: ${elapsedTime} secondi (${(elapsedTimeMin).toFixed(0)}) minuti
        Richieste elaborate: ${successCount} --- Richieste fallite: ${failureCount}
        Guadagno: ${gained.toFixed(0)} GOATS --- Richieste misisoni speciali elaborate: ${bigMissSuccess}`)
    } 
}

function logError(msg, bearerToken) {
    const elapsedTime = getElapsedTimeInSeconds();
    const elapsedTimeMin = elapsedTime/60;
    console.log(`Tempo dall'avvio: ${elapsedTime} secondi (${(elapsedTimeMin).toFixed(0)}) minuti
    ${msg} --- Token:  ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)}`);// | proxy(host: ${proxy.host} - port: ${proxy.port})`);
}

async function performRequestCycle(bearerToken) {
    setInterval(async () => {
        const response = await makeRequest(bearerToken); 
        
        if (response) {
            logStatistics(bearerToken, response);
        }
    }, 65001); 
}

function start() {
    bearerTokens.forEach(async (bearerToken) => {
        await performRequestCycle(bearerToken); 
    });
}

async function getMissions(bearerToken) {
    //let randomProxy = getRandomProxy();
    const options = {
        method: 'GET',
        url: 'https://api-mission.goatsbot.xyz/missions/user',
        headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json'
        },
        //proxy: `http://${randomProxy.host}:${randomProxy.port}`
    };

    try {
        const response = await cloudscraper(options);
        return JSON.parse(response); // Restituisce i dati delle missioni
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
    processAllBearers(); // Esegui la prima volta
    setInterval(processAllBearers, 60 * 60 * 1000); // Ripeti ogni ora
}

const port = process.env.PORT || 3000;
// Aggiungi il listener della porta
app.listen(port, () => {
    console.log(`Service is running on port ${port}`);
});
startHourlyProcess() // controllo missioni generali
start() // esegue la missione da 200 ogni minuto


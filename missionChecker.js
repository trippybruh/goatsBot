const cloudscraper = require('cloudscraper');
const axios = require('axios');
const express = require('express');

const app = express();
const startTime = Date.now();
const bearerTokens =
    [
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZlZDQwNDNmZjM0YmE2YzMyNWMzNjlhIiwiaWF0IjoxNzI3NzEzMDc2LCJleHAiOjE3Mjc3OTk0NzYsInR5cGUiOiJhY2Nlc3MifQ.sJ92bDwMSOrLDjFOTwsNnoa4bGQgwHKHRy8QJ3mM36Y',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZlZDM5ZDBmZjM0YmE2YzMyNGVmYjY0IiwiaWF0IjoxNzI3NzEzMTMzLCJleHAiOjE3Mjc3OTk1MzMsInR5cGUiOiJhY2Nlc3MifQ.qp5ADHgqQJYJ_d0qghroKb9xGwZhnHVJ6jMlauMeTfM',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZlY2FkNTE2M2Y3Mzg1MGY4NTQ5ZTE0IiwiaWF0IjoxNzI3NzEzMTc3LCJleHAiOjE3Mjc3OTk1NzcsInR5cGUiOiJhY2Nlc3MifQ.oONYiZde2GacNzDzhDQ7OMLpUQmWI0l8033_5VqKZQQ',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZlZDM1MDhmZjM0YmE2YzMyNDUwNzY2IiwiaWF0IjoxNzI3NzEzMjI1LCJleHAiOjE3Mjc3OTk2MjUsInR5cGUiOiJhY2Nlc3MifQ.5K0pxB6CwbuhrtbubG-mA8YqU8FBUw9v0WNyfKQQFIc',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZjNDViMWEzYTMwZDI5ZTM2OWU4MWQ2IiwiaWF0IjoxNzI3NzI3MzU1LCJleHAiOjE3Mjc4MTM3NTUsInR5cGUiOiJhY2Nlc3MifQ.x-5HYzxuZUwmkSoFn_eTvwPvX0df76uSW_iAeFFZDmI',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmYjFjOWJlNTQ3MzUyYTI0ZWJiZGMwIiwiaWF0IjoxNzI3NzMzMDc4LCJleHAiOjE3Mjc4MTk0NzgsInR5cGUiOiJhY2Nlc3MifQ.hvX7w6CEF_vnU4U4oHRpEg3RgiLpN8LkvWaObILJXxQ',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmYjI3N2M4ZmY0ZWI3YmI3N2IyMGYzIiwiaWF0IjoxNzI3NzM1Njc2LCJleHAiOjE3Mjc4MjIwNzYsInR5cGUiOiJhY2Nlc3MifQ.Y-ft-9K_fS0yLqbbl15-MEzIFdQbV1vfzZjQ2ogfr5k',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmYjJjNmY4ZmY0ZWI3YmI3N2Y3ZjQ4IiwiaWF0IjoxNzI3NzM2OTQzLCJleHAiOjE3Mjc4MjMzNDMsInR5cGUiOiJhY2Nlc3MifQ._oRRZyMGoEPPnwQ_B9eaVed42_Uq_rnCv2zinCu-iTc',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmYjJjMTQxZDJhYTdiMDg2ZjVhMTkyIiwiaWF0IjoxNzI3NzM3MDAyLCJleHAiOjE3Mjc4MjM0MDIsInR5cGUiOiJhY2Nlc3MifQ.kSLuuU5HMA2I29QHVflVhPcgCq5g6f7t37IDm8YqaUA',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmYmRmODRiZTFkZTYxYzcwMTk1M2VmIiwiaWF0IjoxNzI3NzgyNzg5LCJleHAiOjE3Mjc4NjkxODksInR5cGUiOiJhY2Nlc3MifQ.IuS2E87KFIipNcNxUuD3uuT6oHRKdh4hHZ3lsDzH1cM',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmYjJkYTk4ZmY0ZWI3YmI3ODA4ODVmIiwiaWF0IjoxNzI3NzM3MjU5LCJleHAiOjE3Mjc4MjM2NTksInR5cGUiOiJhY2Nlc3MifQ.XtbmKjEbKhSBZjMsLTMcm6qSsqJJoMYnQgG3jyl85JQ',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmYmVjODE4ZmY0ZWI3YmI3YzFmZGE5IiwiaWF0IjoxNzI3Nzg2MjQ3LCJleHAiOjE3Mjc4NzI2NDcsInR5cGUiOiJhY2Nlc3MifQ.lJANX1_EEApEs36Y3j7Bn04hg0FPyW98fVELZc_76-c',

        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZjNWUwNTIwMWJlODNmNThmYTQxZWIyIiwiaWF0IjoxNzI3NzEyOTQzLCJleHAiOjE3Mjc3OTkzNDMsInR5cGUiOiJhY2Nlc3MifQ.ihQWDxtnQPb45u62LEHFNtsLjDO_-C-TMigF5A7Gm4o',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmNDE1YTk3Y2JkMGY0OTY2ZGUxOWQ2IiwiaWF0IjoxNzI3NzEzMDIzLCJleHAiOjE3Mjc3OTk0MjMsInR5cGUiOiJhY2Nlc3MifQ.MlHCWJRuGkHpnY6k8HZMLXveSmN4Btv3HzLk84-t8tM',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmNDE1ZDZkNjVmZjdiMWQ5M2Q2M2NiIiwiaWF0IjoxNzI3NzEzMDY2LCJleHAiOjE3Mjc3OTk0NjYsInR5cGUiOiJhY2Nlc3MifQ.pnkaRFL2mmZ9gxwQRjiHus5oXdep2LQ6hHF0t59CdCE',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmNDE2MjE1Mjk1NDFhMjRhYjhmZThjIiwiaWF0IjoxNzI3NzEzMTIwLCJleHAiOjE3Mjc3OTk1MjAsInR5cGUiOiJhY2Nlc3MifQ.Qc6wAHtoTHH_1aympIM0FO7_8rMts9VlIqteyHAKphQ',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmNDE2OGI3Y2JkMGY0OTY2ZTAxODY5IiwiaWF0IjoxNzI3NzEzMTY2LCJleHAiOjE3Mjc3OTk1NjYsInR5cGUiOiJhY2Nlc3MifQ.BUeTO3cH3VUL2RoV1UtNPBzO89U0lvobgdRMOUrJnfg',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmNDE1NzY1Mjk1NDFhMjRhYjc3NzBkIiwiaWF0IjoxNzI3NzEzMjE4LCJleHAiOjE3Mjc3OTk2MTgsInR5cGUiOiJhY2Nlc3MifQ.Jyu2XNyKX6zoT9v0ckpaJ_lt2mGyfZViz2qLsRpLnf4',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmNTk5ODQ4ZmY0ZWI3YmI3YTk2MDM5IiwiaWF0IjoxNzI3NzEzMjk1LCJleHAiOjE3Mjc3OTk2OTUsInR5cGUiOiJhY2Nlc3MifQ.hUW9GFzDNwMCYT5jQC5KPPPUnfFa_5k-UAoUPJZQuWo',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmNTlkOTViZTFkZTYxYzcwMjM2NGRmIiwiaWF0IjoxNzI3NzEzMzM4LCJleHAiOjE3Mjc3OTk3MzgsInR5cGUiOiJhY2Nlc3MifQ.BWmns3-80DpMogOD0sYp_V8hNFEC4iqWcN8HtEEo9c8',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmNDI3ZTQ1Mjk1NDFhMjRhZGUyNzc1IiwiaWF0IjoxNzI3NzEzMzk1LCJleHAiOjE3Mjc3OTk3OTUsInR5cGUiOiJhY2Nlc3MifQ.7vwoMIlxvBxAlVGDXgVdtXVXIlVR1EFK0PqUuLKCbJY',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmNDM0MmE3YjEwMDYyNmM2YmNkZDEwIiwiaWF0IjoxNzI3NzEzNDQ5LCJleHAiOjE3Mjc3OTk4NDksInR5cGUiOiJhY2Nlc3MifQ.4XGBgCIggDWwG9Sa4qu0wEShk9wZN7ca2ydTyLhDtYY',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmNDMyMDRkMjcxY2FhYmQ1ODlhODQ1IiwiaWF0IjoxNzI3NzEzNDkzLCJleHAiOjE3Mjc3OTk4OTMsInR5cGUiOiJhY2Nlc3MifQ.mO19iUeBv6t76v-R445kV5s73evO1xYpEd1_bX3HkFk',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmNDhiNTMxZDJhYTdiMDg2YjlkN2U2IiwiaWF0IjoxNzI3NzEzNTQ1LCJleHAiOjE3Mjc3OTk5NDUsInR5cGUiOiJhY2Nlc3MifQ.9BaPC0zFBi-YmgWrBMBYp6e3eMVjKEU9jmL_C4tYxjE',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmNTI2MWE4ZmY0ZWI3YmI3Njk0YTc4IiwiaWF0IjoxNzI3NzEzNjA3LCJleHAiOjE3Mjc4MDAwMDcsInR5cGUiOiJhY2Nlc3MifQ.7ER7oM-PKOZxYCkPuZjpSh71EQ43aWT6ZNDbdr9xx-o'
    ]

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


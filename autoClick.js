const cloudscraper = require('cloudscraper');
const axios = require('axios');
const express = require('express');

const app = express();
const startTime = Date.now();
const REQ_INTERVAL_DELAY = 330; // ms
const INTRA_REQ_DELAY = 300;
const bearerTokens = [
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
];

let successCount = 0;
let failureCount = 0;

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

    try {
        const response = await cloudscraper(options);
        const jsonResponse = JSON.parse(response);
        await sleep(INTRA_REQ_DELAY);
        successCount++;
        return jsonResponse;
    } catch (error) {
        failureCount++;
        return null;
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function logStatistics(response) {
    const elapsedTime = getElapsedTimeInSeconds();
    const elapsedTimeMin = elapsedTime/60;
    let ratioWL = 'inf';

    if (failureCount != 0) {
        ratioWL = (successCount/failureCount).toFixed(4);
    } 

    if (response) {
        const gained = successCount * 0.32;
        // const percentGain = ((((gained + response?.user?.balance)/response?.user?.balance)-1)*100).toFixed(2);

        console.log(`Tempo dall'avvio: ${elapsedTime} secondi (${(elapsedTimeMin).toFixed(0)} minuti)
        Richieste elaborate: ${successCount} --- Richieste fallite: ${failureCount} --- Guadagno: ${gained.toFixed(0)} GOATS 
        Successi/Fallimenti: ${ratioWL} --- Successi/min: ${(successCount/elapsedTimeMin).toFixed(2)} --- Fallimenti/min: ${(failureCount/elapsedTimeMin).toFixed(2)}
        Richieste totali: ${successCount + failureCount} --- Richieste totali/min: ${((successCount + failureCount)/elapsedTimeMin).toFixed(2)} (target: ${60000/REQ_INTERVAL_DELAY})`);
    } else {
        console.log("Teruuuun!!!")
    }
}

async function performRequestCycle(bearerToken) {
    const consoleLogStep = 500;
    var cycles = 0;
    const data = {
        "point_milestone": 66,
        "is_upper": false,
        "bet_amount": 1
    };

    setInterval(async () => {
        const response = await makeRequest(data, bearerToken);
        if (response && (cycles % consoleLogStep == 0)) {
            logStatistics(bearerToken, response);
        }
        cycles++;
    }, REQ_INTERVAL_DELAY)
}

function start() {
    bearerTokens.forEach(async (bearerToken) => {
        console.log(`Inizio cicli di richieste per Bearer Token: ${bearerToken.slice(0, 5)}...${bearerToken.slice(-5)}
        Configurato per eseguire max ${(1000/REQ_INTERVAL_DELAY).toFixed(2)} richieste/s --- Timeout minimo tra una richiesta ed un altra: ${(INTRA_REQ_DELAY/1000).toFixed(3)} s`);
        await performRequestCycle(bearerToken);
    });
}



// Imposta la porta su quella assegnata da Heroku o utilizza una porta predefinita per lo sviluppo locale
const port = process.env.PORT || 3000;
// Aggiungi il listener della porta
app.listen(port, () => {
    console.log(`Service is running on port ${port}`);
});
start(); // Avvia il ciclo con proxy

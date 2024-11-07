const cloudscraper = require('cloudscraper');

const get_mission_api_url = 'https://api-mission.goatsbot.xyz/missions/user';
const get_checkin_api_url = 'https://api-checkin.goatsbot.xyz/checkin/user';
const get_refresh_api_url = 'https://dev-api.goatsbot.xyz/auth/refresh-tokens'
const execute_mission_api_url = 'https://dev-api.goatsbot.xyz/missions/action/'
const execute_checkin_api_url = 'https://api-checkin.goatsbot.xyz/checkin/action/'
const execute_cinema_api_url = 'https://dev-api.goatsbot.xyz/goat-cinema/watch'
const execute_bet_balance_api_url = 'https://api-dice.goatsbot.xyz/dice/action'

const headerApi = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) ' +
        'Chrome/129.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
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

const userTokens = [
    {
        bearer: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmMDI2NGZhNzVkYjBjZjYzYmY4YjAwIiwiaWF0IjoxNzMwOTk2MDQzLCJleHAiOjE3MzEwODI0NDMsInR5cGUiOiJhY2Nlc3MifQ.q5TWceLeRCUHf7nA2INzQBqxzi5lR0K-FwejqVVzTzQ',
        refresh: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmMDI2NGZhNzVkYjBjZjYzYmY4YjAwIiwiaWF0IjoxNzMwOTk2MDQzLCJleHAiOjE3MzM1ODgwNDMsInR5cGUiOiJyZWZyZXNoIn0.94CvLuJ-IMb6dw0pcOaJ3UTv2eGXWJiFZQH0jMIM55U'
    },
    {
        bearer: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcxMjYyMzFmMDNmYTFmNjhhYjcyZjhmIiwiaWF0IjoxNzMxMDA0MjA4LCJleHAiOjE3MzEwOTA2MDgsInR5cGUiOiJhY2Nlc3MifQ.lqhmZ5hpVD5zF9dHw_fuzQNSthED6vYzFFvcHp08zf4',
        refresh: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcxMjYyMzFmMDNmYTFmNjhhYjcyZjhmIiwiaWF0IjoxNzMxMDA0MjA4LCJleHAiOjE3MzM1OTYyMDgsInR5cGUiOiJyZWZyZXNoIn0.lKlwom-PvaCnFwNoZJEl3bPIU4QZVXqt-ZfGDijJzNA'
    },
    {
        bearer: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcxM2FiNDgzNmVmODEzMWM1MjAyNmE2IiwiaWF0IjoxNzMxMDA0NzcwLCJleHAiOjE3MzEwOTExNzAsInR5cGUiOiJhY2Nlc3MifQ.BvBBY9iH2rkWADOBnHVa8TVejC6HsB4OhztAsLxFKU4',
        refresh: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjcxM2FiNDgzNmVmODEzMWM1MjAyNmE2IiwiaWF0IjoxNzMxMDA0NzcwLCJleHAiOjE3MzM1OTY3NzAsInR5cGUiOiJyZWZyZXNoIn0.Q8_6XB-ftYJdmFVOEGJRrGJIrgipGAvCfBJcGr3WXeA'
    }
]

const adsMissionId = '66db47e2ff88e4527783327e'

let successCount = 0
let errorCount = 0
let totalBalance = 0;

//START

loop().then()

async function loop() {
    while (true) {
        await start()
        console.log(`📊 Balance: ${totalBalance} | Avg Balance: ${totalBalance / userTokens.length} | Total Users: ${userTokens.length}`)
        totalBalance = 0
        await pauseExecution(1000)
    }
}

async function start() {
    console.log('🚀 Start')
    for (const token of userTokens) {
        const {bearer, refresh} = token
        await missions(bearer, refresh) // Ads compresa
        await checkin(bearer, refresh)
        await cinema(bearer, refresh)
        await sumBalance(bearer, refresh) // senza bet disonesta
        console.log(`📊 Token: ${bearer.slice(-5)} | Success: ${successCount} | Error: ${errorCount}`)
        await pauseExecution(500)
    }
}

//USER

async function sumBalance(bearer, refresh) {
    const balance = await getBalance(bearer, refresh)
    totalBalance += balance
}

async function getBalance(bearer, refresh) {
    const data = {
        point_milestone: 90,
        is_upper: false,
        bet_amount: 5
    }

    const options = {
        method: 'POST',
        url: execute_bet_balance_api_url,
        headers: {
            ...headerApi,
            Authorization: `Bearer ${bearer}`,
        },
        body: JSON.stringify(data),
        timeout: 5000
    }

    try{
        const response = await cloudscraper(options)
        const jsonResponse = JSON.parse(response)

        return jsonResponse?.user?.balance || 0
    } catch (error) {
        if (error.statusCode === 401) {
            const {refreshToken, bearerToken} = await getRefreshToken(refresh, bearer)
            if (refreshToken) {
                return await getBalance(bearerToken, refreshToken)
            }
        } else {
            logError(error.message, bearer);
        }
    }
}

async function getRefreshToken(refresh, bearer) {
    const data = {refreshToken: refresh}
    const options = {
        method: 'POST',
        url: get_refresh_api_url,
        headers: {
            ...headerApi
        },
        body: JSON.stringify(data),

    };

    try {
        const response = await cloudscraper(options);
        const jsonResponse = JSON.parse(response);

        const refreshToken = jsonResponse.tokens.refresh.token
        const bearerToken = jsonResponse.tokens.access.token

        const index = userTokens.findIndex((element) => element.bearer === bearer)
        userTokens[index].bearer = bearerToken
        userTokens[index].refresh = refreshToken

        return {refreshToken, bearerToken}
    } catch (error) {
        logError(error.message, bearer);
        return null;
    }
}

//MISSIONS

async function missions(bearer, refresh) {
    const missionsData = await getMissions(bearer, refresh)

    if (missionsData) {
        for (const [missionGroup, missions] of Object.entries(missionsData)) {
            for (const mission of missions) {
                if (mission.status === false) {
                    await executeMission(bearer, refresh, mission._id);
                }
            }
        }
        console.log(`📊 Completed Missions`);
    }
}

async function executeMission(bearer, refresh, missionId) {
    const options = {
        method: 'POST',
        url: `${execute_mission_api_url}${missionId}`,
        headers: {
            ...headerApi,
            Authorization: `Bearer ${bearer}`,
        },
    };

    try {
        const response = await cloudscraper(options);
        if (missionId === adsMissionId)
            successCount++
        console.log(`📊 Completed Mission: ${missionId}`);
        return JSON.parse(response);
    } catch (error) {
        if (error.statusCode === 401) {
            const {refreshToken, bearerToken} = await getRefreshToken(refresh, bearer)
            if (refreshToken) {
                return await executeMission(bearerToken, refreshToken, missionId)
            }
        } else {
            logError(error.message, bearer);
        }
    }
}

async function getMissions(bearer, refresh) {
    const options = {
        method: 'GET',
        url: get_mission_api_url,
        headers: {
            ...headerApi,
            Authorization: `Bearer ${bearer}`
        }
    }

    try {
        const response = await cloudscraper(options);
        return JSON.parse(response);
    } catch (error) {
        if (error.statusCode === 401) {
            const {refreshToken, bearerToken} = await getRefreshToken(refresh, bearer)
            if (refreshToken) {
                return await getMissions(bearerToken, refreshToken)
            }
        } else {
            logError(error.message, bearer);
        }
        return null;
    }
}

//CHECKIN

async function checkin(bearer, refresh) {
    const checkinData = await getCheckin(bearer, refresh)

    if (checkinData) {
        for (const checkin of checkinData.result) {
            if (checkin.status === false) {
                await executeCheckin(bearer, refresh, checkin._id);
                break
            }
        }
        console.log(`📊 Completed Checkin`);
    }

}

async function executeCheckin(bearer, refresh, checkinId) {
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
        console.log(`📊 Completed Checkin: ${checkinId}`);
        return JSON.parse(response);
    } catch (error) {
        if (error.statusCode === 401) {
            const {refreshToken, bearerToken} = await getRefreshToken(refresh, bearer)
            if (refreshToken) {
                return await executeCheckin(bearerToken, refreshToken, checkinId)
            }
        } else {
            logError(error.message, bearer);
        }
    }


}

async function getCheckin(bearer, refresh) {
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
        if (error.statusCode === 401) {
            const {refreshToken, bearerToken} = await getRefreshToken(refresh, bearer)
            if (refreshToken) {
                return await getCheckin(bearerToken, refreshToken)
            }
        } else {
            logError(error.message, bearer);
        }
        return null;
    }
}

//CINEMA

async function cinema(bearer, refresh) {
    for (let i = 0; i < 3; i++) {
        await executeCinema(bearer, refresh)
    }
    console.log(`📊 Completed Cinema`);
}

async function executeCinema(bearer, refresh) {
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
        if (error.statusCode === 401) {
            const {refreshToken, bearerToken} = await getRefreshToken(refresh, bearer)
            if (refreshToken) {
                return await executeCinema(bearerToken, refreshToken)
            }
        } else {
            logError(error.message, bearer);
        }
    }
}

//UTILS

function pauseExecution(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function logError(msg, bearerToken) {
    errorCount++
    console.log(`📊 ${msg} | Token: ${bearerToken.slice(-5)} `);
    return null;
}
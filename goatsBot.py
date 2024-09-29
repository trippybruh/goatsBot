import aiohttp, asyncio, time, random, datetime, yarl
import json

# Configurazioni
CALLS_PER_SECOND = 1
DELAY = 0
start_time = time.time()


bearer = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjZmMDI2NGZhNzVkYjBjZjYzYmY4YjAwIiwiaWF0IjoxNzI3NDQ2NTgzLCJleHAiOjE3Mjc1MzI5ODMsInR5cGUiOiJhY2Nlc3MifQ.E8YZmA0aBznfiOF92H3OJxZqCIWqX_fW_dxwTvSSoh0'
bearer_tokens = [bearer]
#bearer_prefix + 'E8YZmA0aBznfiOF92H3OJxZqCIWqX_fW_dxwTvSSoh0']
# (Proxy se necessario, ma disattivato per ora)
proxies = [
    {'host': '136.0.61.87', 'port': 20000, 'username': 'lorenzo1', 'password': 'lorenzo_goats1'},
]

success_count = 0 
failure_count = 0
bearer_balances = {}


# Utility: Mescola una lista
def shuffle_array(array):
    return random.sample(array, len(array))


# Utility: Ritorna il tempo trascorso in secondi
def get_elapsed_time_in_seconds():
    return round(time.time() - start_time, 2)


async def make_request(data, bearer_token):
    url = 'https://api-dice.goatsbot.xyz/dice/action'
    headers = {
        'Authorization': f"Bearer {bearer_token}",
        'Content-Type': 'application/json'
    }

    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(url=url, json=data, headers=headers, timeout=5) as response:
                if response.status == 200:
                    json_response = await response.json()
                    global success_count
                    success_count += 1
                    await asyncio.sleep(0.3)
                    return json_response
                else:
                    log_error(f"Errore HTTP {response.status} su ../dice/action", bearer_token)
                    global failure_count
                    failure_count += 1
                    return None
        except Exception as e:
            log_error(str(e), bearer_token)
            failure_count += 1
            return None


async def make_request2(bearer_token):
    url = 'https://dev-api.goatsbot.xyz/missions/action/66db47e2ff88e4527783327e'
    headers = {
        'Authorization': f"Bearer {bearer_token}",
        'Content-Type': 'application/json'
    }

    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(url=url, headers=headers, timeout=5) as response:
                if response.status == 200:
                    json_response = await response.json()
                    global success_count
                    success_count += 1
                    return json_response
                else:
                    log_error(f"Errore HTTP {response.status} su missione ogni minuto", bearer_token, 'No Proxy')
                    global failure_count
                    failure_count += 1
                    return None
        except Exception as e:
            log_error(str(e), bearer_token, 'No Proxy')
            failure_count += 1
            return None


# Funzione per loggare le statistiche
def log_statistics(bearer_token, response=None):
    elapsed_time = get_elapsed_time_in_seconds()
    elapsed_min = round(elapsed_time/60, 2)
    ratio_wl = 'inf' if failure_count == 0 else round(success_count / failure_count, 4)

    if response:
        starting_balance = response['user']['balance'] if elapsed_time < 100 else 0
        balance = response['user']['balance']
        gained = balance - starting_balance
        percent_gain = round(((balance / starting_balance) - 1) * 100, 2) if starting_balance != 0 else 0

        print(f"""
        Tempo dall'avvio: {elapsed_time} secondi ({round(elapsed_min, 0)} minuti)
        Successi: {success_count} --- Fallimenti: {failure_count} --- Successi/Fallimenti: {ratio_wl}
        Successi/min: {round(success_count / elapsed_min, 2)} --- Fallimenti/min: {round(failure_count / elapsed_min, 2)}
        Incremento assoluto: {gained} GOATS --- % Guadagno %: {percent_gain} %
        """)
    else:
        print("Errore nel log delle statistiche.")


# Funzione per loggare errori
def log_error(msg, bearer_token, proxy=None):
    print(f"Errore: {msg} | Token: {bearer_token[:8]}...{bearer_token[-8:]} | Proxy: {proxy if proxy else 'No Proxy'}")


# Funzione per gestire un ciclo di richieste senza proxy
async def perform_request_cycle_no_proxy(bearer_token):
    data = {
        "point_milestone": 66,
        "is_upper": False,
        "bet_amount": 1
    }
    while True:
        #responseMission = await make_request2(bearer_token)  
        #if responseMission:
            #log_statistics(bearer_token, responseMission)
        responseDicing = await make_request(data, bearer_token)
        if responseDicing:
            log_statistics(bearer_token, responseDicing)
        await asyncio.sleep(5)  # 6 secondi di intervallo


# Avvio del processo di richieste senza proxy
async def start_no_proxy():
    tasks = [perform_request_cycle_no_proxy(bearer_token) for bearer_token in bearer_tokens]
    await asyncio.gather(*tasks)


# Funzione per recuperare le missioni di un utente
async def get_missions(bearer_token):
    url = 'https://api-mission.goatsbot.xyz/missions/user'
    headers = {
        'Authorization': f'Bearer {bearer_token}',
        'Content-Type': 'application/json'
    }

    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(url, headers=headers) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    print(f"Errore nel recuperare le missioni per Bearer Token: {bearer_token[-5:]}")
                    return None
        except Exception as e:
            print(f"Errore nel recuperare le missioni per Bearer Token: {bearer_token[-5:]}. Errore: {e}")
            return None


# Funzione per processare le missioni per un utente
async def process_missions_for_bearer(bearer_token):
    missions_data = await get_missions(bearer_token)
    if not missions_data:
        return

    # Processa tutte le missioni serialmente
    for mission_group, missions in missions_data.items():
        for mission in missions:
            if mission['status'] == False:
                await execute_mission(bearer_token, mission['_id'])


# Funzione per eseguire una missione specifica
async def execute_mission(bearer_token, mission_id):
    url = f'https://dev-api.goatsbot.xyz/missions/action/{mission_id}'
    headers = {
        'Authorization': f'Bearer {bearer_token}',
        'Content-Type': 'application/json'
    }

    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(url, headers=headers) as response:
                if response.status == 200:
                    print(f"Missione {mission_id} completata con successo.")
                else:
                    print(f"Errore nell'eseguire la missione {mission_id} per Bearer Token: {bearer_token[-5:]}")
        except Exception as e:
            print(f"Errore nell'eseguire la missione {mission_id}. Errore: {e}")


# Funzione per avviare il ciclo delle missioni ogni ora
async def process_all_bearers():
    while True:
        for bearer_token in bearer_tokens:
            print(f"({datetime.datetime.now()}) -> Inizio processo per Bearer Token: {bearer_token[-5:]}")
            #await process_missions_for_bearer(bearer_token)
            await start_no_proxy()
        await asyncio.sleep(3600)  # Ripeti ogni ora


# Avvio delle richieste senza proxy e del processo di missioni
async def main():
    await asyncio.gather(start_no_proxy(), process_all_bearers())

# Avvio del loop di asyncio
if __name__ == "__main__":
    asyncio.run(main())

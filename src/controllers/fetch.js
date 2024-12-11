import 'dotenv/config';

export async function fetchPlayersActiveMatch (puuid) {
    const url = `https://euw1.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}?api_key=${process.env.RIOT_TOKEN}`
    try {
        const resp = await fetch(url);
        const data = await resp.json();
        console.log(resp.status)
        if (resp.status === 404) {
            console.log('No hay ninguna partida activa')
            return false
        }
        if (resp.status === 200) {
            return true
        }
        // console.log(data.gameId)
        return false
    } catch (error) {
        console.log("Error de servidor")
        return false
    }
};


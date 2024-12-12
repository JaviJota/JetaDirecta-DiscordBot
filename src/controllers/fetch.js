import 'dotenv/config';
import { CHAMPIONS } from '../config/constants.js';

export async function fetchPlayersActiveMatch (puuid) {
    const url = `https://euw1.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}?api_key=${process.env.RIOT_TOKEN}`
    try {
        const resp = await fetch(url);
        const data = await resp.json();
        if (resp.status === 404) {
            console.log('No hay ninguna partida activa')
            return false
        }
        if (resp.status === 200) {
            console.log("Partida activa")
            return {success: true, participants: data.participants}
        }
        // console.log(data.gameId)
        return false
    } catch (error) {
        console.log("Error de servidor")
        return false
    }
};

export function getChampionById(id) {
    const matchedChampion = CHAMPIONS.find(c => c.key === id.toString());
    if (matchedChampion) {
        return matchedChampion.name;
    }

    return false;
};
import 'dotenv/config';
import { CHAMPIONS } from '../config/constants.js';

export async function fetchPlayersActiveMatch ({player}) {
    const url = `https://euw1.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${player.puuid}?api_key=${process.env.RIOT_TOKEN}`
    try {
        const resp = await fetch(url);
        const data = await resp.json();
        if (!resp.ok) {
            console.log(`${player.name} no está jugando`)
            return false
        }
        if (resp.status === 200) {
            console.log(`>>${player.name} está en partida.`)
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
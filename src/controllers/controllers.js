import 'dotenv/config';
import { CHAMPIONS } from '../config/constants.js';

export async function fetchPlayersActiveMatch ({player}) {
    const url = `https://${player.region}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${player.puuid}`
    try {
        const resp = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-Riot-Token": process.env.RIOT_TOKEN,
            },
        });
        const data = await resp.json();
        console.log(resp.status)
        if (resp.status === 429) {
            console.log("Límite de solicitudes excedido")
            return false
        }
        if (!resp.ok) {
            console.log(`${player.name} no está jugando`)
            return false
        }
        if (resp.status === 200 && data.gameMode === "CLASSIC") {
            console.log(`>>${player.name} está en partida.`)
            return {success: true, participants: data.participants}
        }
        if (resp.status === 200 && data.gameMode !== "CLASSIC") {
            console.log(`>>${player.name} está jugando ${data.gameMode.toLowerCase()}.`)
            return false
        }
        // console.log(data.gameId)
        return false
    } catch (error) {
        console.log("Error de servidor")
        return false
    }
};

export async function handlePostDiscordMessage(player, championName, gameParticipants, playerRank) {
    try {
        const url = `https://discord.com/api/v10/channels/${process.env.CHANNEL_ID}/messages`
        const resp = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bot ${process.env.DISCORD_TOKEN}`
            },
            body: JSON.stringify({
              embeds: [
                {
                  title: `${player.name} está jugando! :loudspeaker:`,
                  description: `**Champion:** ${championName}\n**Account:** ${player.gameName}\n**Rank:** ${playerRank.rank} (${playerRank.lp} LP)\n**Players:** ${gameParticipants.length ? gameParticipants.join(" | ") : 'Ningún jugador de LEC en la partida.'}`,
                  url: `${player.opgg}`,
                  color: 0xFFFF00,
                },
              ],
            }),
        });

        if (!resp.ok) {
            throw new Error("Error al enviar el mensaje");
        }

          console.log("Mensaje enviado");
    } catch (error) {
        console.error("Error al enviar mensaje:", error);
    }
}

export function getChampionById(id) {
    const matchedChampion = CHAMPIONS.find(c => c.key === id.toString());
    if (matchedChampion) {
        return matchedChampion.name;
    }

    return false;
};

export function removeFromActive(activePlayers, puuid) {
    const activePlayersIndex = activePlayers.indexOf(puuid);

    if (activePlayersIndex !== -1) {
        activePlayers.splice(activePlayersIndex, 1);
    }
}

export async function getPlayerRank(id, region) {
    try {
        const url = `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${id}`
        const resp = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "applicatiom/json",
                "X-Riot-Token": process.env.RIOT_TOKEN,
            },
        });

        if (!resp.ok) {
            throw new Error("Error al obtener la información del summoner");
        }

        const data = await resp.json();

        if (!data || data.length === 0) {
            return { success: false, rank: 'Unranked' };
        }
        
        const formatRank = (tier) => tier.toLowerCase().charAt(0).toUpperCase() + tier.toLowerCase().slice(1);
        
        const soloQueue = data.find(queue => queue.queueType === 'RANKED_SOLO_5x5');

        if (soloQueue) {
            return { success: true, rank: formatRank(soloQueue.tier), lp: soloQueue.leaguePoints };
        }

        return { success: false, rank: 'Unranked' };
        
    } catch (error) {
        console.error("Error al obtener el rango")
    }
}
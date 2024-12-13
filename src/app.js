import "dotenv/config";
import express from "express";
import {
  InteractionResponseType,
  InteractionType,
  verifyKeyMiddleware,
} from "discord-interactions";
import { PLAYERS, TRACKED_PLAYERS } from "./config/constants.js";
import { fetchPlayersActiveMatch, getChampionById } from "./controllers/fetch.js";

const app = express();

const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

app.use(express.json());

app.post(
  "/interactions",
  verifyKeyMiddleware(process.env.PUBLIC_KEY),
  async function (req, res) {
    const { type, data } = req.body;

    if (type === InteractionType.APPLICATION_COMMAND) {
      const { name } = data;

      if (name === "greet") {
        console.log("greetings");

        return res.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "Hola!",
          },
        });
      }
    }
    console.error("Tipo de interacción desconocido", type);
    return res.sendStatus(400);
  }
);

let activePlayers = [];

async function handleCheckPlayersActive(players) {
  for (let player of players) {
    let gameParticipants = [];
    let championName = '';
    try {
      const fetchPlayerActivity = await fetchPlayersActiveMatch({player});

      if (!fetchPlayerActivity) {
        const activePlayersIndex = activePlayers.indexOf(player.puuid);
        if (activePlayersIndex !== -1) {
          activePlayers.splice(activePlayersIndex, 1);
        }
      } if (fetchPlayerActivity.success && activePlayers.includes(player.puuid)) {
        continue;

      } if (fetchPlayerActivity.success && !activePlayers.includes(player.puuid)) {

        activePlayers.push(player.puuid);

        const playerGameInfo = fetchPlayerActivity.participants.find(p => p.puuid === player.puuid);
        if (playerGameInfo) {
            championName = getChampionById(playerGameInfo.championId)
        }

        for (let participant of fetchPlayerActivity.participants) {
          const matchedPlayer = PLAYERS.find(p => p.puuid === participant.puuid);
          if (matchedPlayer) {
            gameParticipants.push(matchedPlayer.name);
          }
        }

        try {
          // const resp = await fetch(`https://discord.com/api/v10/channels/${process.env.CHANNEL_ID}/messages`, {
          //   method: "POST",
          //   headers: {
          //     "Content-Type": "application/json",
          //     Authorization: `Bot ${process.env.DISCORD_TOKEN}`
          //   },
          //   body: JSON.stringify({
          //     content: `**${player.name} está jugando!** :loudspeaker:\n**Champion:** ${championName}\n**Account:** ${player.gameName}\n**Players:** ${gameParticipants.length ? gameParticipants.join(" | ") : 'Ningún jugador de LEC en la partida.'}\n**[OPGG :arrow_down:]**(${player.opgg})`,
          //   }),
          // });
          const resp = await fetch(`https://discord.com/api/v10/channels/${process.env.CHANNEL_ID}/messages`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bot ${process.env.DISCORD_TOKEN}`
            },
            body: JSON.stringify({
              embeds: [
                {
                  title: `${player.name} está jugando! :loudspeaker:`,
                  description: `**Champion:** ${championName}\n**Account:** ${player.gameName}\n**Players:** ${gameParticipants.length ? gameParticipants.join(" | ") : 'Ningún jugador de LEC en la partida.'}`,
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
    } catch (error) {
      console.error("Error al buscar jugador", error);
    }
  }
};

setInterval(() => handleCheckPlayersActive(TRACKED_PLAYERS), 300000);

app.listen(PORT, () => {
  console.log("Listening on port", PORT);
});

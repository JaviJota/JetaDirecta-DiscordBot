import "dotenv/config";
import express from "express";
import {
  InteractionResponseType,
  InteractionType,
  verifyKeyMiddleware,
} from "discord-interactions";
import { PLAYERS, TRACKED_PLAYERS } from "./config/constants.js";
import { fetchPlayersActiveMatch, getChampionById, getPlayerRank, getPlayersInGame, getPlayerTeam, handlePostDiscordMessage, removeFromActive } from "./controllers/controllers.js";

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
  // Loop tracked players
  for (let player of players) {

    let championName = '';

    try {
      // Fetch if player is in game by puuid
      const fetchPlayerActivity = await fetchPlayersActiveMatch({player});

      // Remove player from activePlayers list
      if (!fetchPlayerActivity) {
        removeFromActive(activePlayers, player.puuid)
      } 
      
      // Check if player is active && added to activePlayers to not send message
      if (fetchPlayerActivity.success && activePlayers.includes(player.puuid)) {
          continue;
      } 
      
      // Check if player is active && NOT added to activePlayers to send message
      if (fetchPlayerActivity.success && !activePlayers.includes(player.puuid)) {

        // Add player to activePlayers list
          activePlayers.push(player.puuid);

          // Get champion key and check champion name
          const playerGameInfo = fetchPlayerActivity.participants.find(p => p.puuid === player.puuid);
          if (playerGameInfo) {
              championName = getChampionById(playerGameInfo.championId)
          }

          // Get other pro-players in game
          const playersInGame = getPlayersInGame(fetchPlayerActivity.participants);

          // Get the team of each player
          const teamPlayers = getPlayerTeam(fetchPlayerActivity.participants, playersInGame);

          const playerRank = await getPlayerRank(player.id, player.region);

          // Post message on Discord
          try {
            handlePostDiscordMessage(player, championName, playersInGame, playerRank, teamPlayers)

          } catch (error) {
            console.error("Error al enviar mensaje:", error);
          }
      }
      
    } catch (error) {
      console.error("Error al buscar jugador", error);
    }
  }
};

// Check players activity every 5min
setInterval(() => handleCheckPlayersActive(TRACKED_PLAYERS), 300000);

app.listen(PORT, () => {
  console.log("Listening on port", PORT);
});

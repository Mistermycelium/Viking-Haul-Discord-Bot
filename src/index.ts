// Require necessary classes
import * as fs from 'fs';
import path from 'path';
import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import { token } from '../config/config.json';
import { handleReadyEvent, handleInteractionCreate } from './bot/eventHandlers';
import glob from 'glob';

class BotClient extends Client {
  commands!: Collection<string, any>;
}

// initialize client
const client = new BotClient({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, handleReadyEvent);
client.on(Events.InteractionCreate, handleInteractionCreate);

// dynamic acquisition of slash commands
loadCommands(foldersPath, client);

// Log in to Discord with your client's token
client.login(token);

function loadCommands(folderPath: string, botClient: BotClient) {
  const commandFolders = fs.readdirSync(folderPath);
  for (const folder of commandFolders) {
    // Grab all the command files from the commands directory you created earlier
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = glob.sync('**/*.js', { cwd: commandsPath });

    // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const command = require(filePath);
      if ('data' in command && 'execute' in command) {
        botClient.commands.set(command.data.name, command);
      } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
      }
    }
  }
  // for (const folder of commandFolders) {
  //   const commandsPath = path.join(folderPath, folder);
  //   const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  //   for (const file of commandFiles) {
  //     const filePath = path.join(commandsPath, file);
  //     // eslint-disable-next-line @typescript-eslint/no-var-requires
  //     const command = require(filePath);
  //     if ('data' in command && 'execute' in command) {
  //       botClient.commands.set(command.data.name, command);
  //     } else {
  //       console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  //     }
  //   }
  // }
}

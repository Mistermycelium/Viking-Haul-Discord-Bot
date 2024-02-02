import { SlashCommandBuilder } from 'discord.js';
import UserService from '../../services/UserService';
import { UserRepository } from '../../data/repositories/UserRepository';
import { User } from '../../data/models/User';

const userRepository = new UserRepository();
const userService = new UserService(userRepository);
module.exports = {
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('Sign up to join one of our servers!')
    .addSubcommand(subcommand =>
      subcommand
        .setName('xbox')
        .setDescription('For Xbox players')
        .addStringOption(option =>
          option.setName('xboxid')
            .setDescription('Your Xbox ID')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('steam')
        .setDescription('For Steam players')
        .addStringOption(option =>
          option.setName('steam64id')
            .setDescription('Your 17 digit Steam64ID')
            .setRequired(true))),
  /**
 * This function executes the registration process for the bot.
 * It handles registration for both Xbox and Steam users.
 *
 * @param interaction - The interaction object from the Discord API.
 */
  async execute(interaction: { options: { getSubcommand: () => string; getString: (arg0: string) => any; }; user: { id: any; username: any; }; reply: (arg0: { content: string; ephemeral: boolean; }) => any; }) {
  // for xbox users
    if (interaction.options.getSubcommand() === 'xbox') {
      const xboxID = interaction.options.getString('xboxid');
      const xboxRegExp = /^Xbox_\d{16}$/;
      if (xboxID && xboxRegExp.test(xboxID)) {
        checkIfUserIsRegistered(interaction);
        registerUser(interaction, xboxID);
      } else {
        // xboxID is missing or invalid. For now, we treat both the same.
        await interaction.reply({ content: `\`\`${xboxID}\`\` is not a valid Xbox ID, Xbox IDs should look like \`\`Xbox_25xxxxxxxxxxxxxx\`\``, ephemeral: true });
      }
      // for steam users
    }
        //TODO Refactor!
    if (interaction.options.getSubcommand() === 'steam') {
      const steam64ID = interaction.options.getString('steam64id');
      const steamRegExp = /^765\d{14}$/;
      if (steam64ID && steamRegExp.test(steam64ID)) {
        if (await userService.findBy(interaction.user.id)) {
          await interaction.reply({ content: `It looks like you're already registered ${interaction.user.username}`, ephemeral: true });
        } else {
          const user = { DiscordId: interaction.user.id, Username: interaction.user.username, SteamId: steam64ID } as User;
          await userService.create(user);
          await interaction.reply({ content: `Thank you for registering with the Steam ID ${steam64ID}`, ephemeral: true });
        }
      } else {
        // invalid or missing steam id
        await interaction.reply({ content: `${steam64ID} is not a valid Steam ID, steam IDs should look like 765xxxxxxxxxxxxxx`, ephemeral: true });
      }
    }
  },
};

async function checkIfUserIsRegistered(interaction: { user: { id: any; username: any; }; reply: (arg0: { content: string; ephemeral: boolean; }) => any; }) {
  // Use Case: User is already registered
  try {
    if (await userService.findBy(interaction.user.id)) {
      await interaction.reply({ content: `It looks like you're already registered ${interaction.user.username}`, ephemeral: true });
    }
  } catch (err) {
    console.log(err);
  }
}

async function registerUser(interaction: { options: { getSubcommand: () => string; getString: (arg0: string) => any; }; user: { id: any; username: any; }; reply: (arg0: { content: string; ephemeral: boolean; }) => any; },
  xboxID: string) {
  // Use Case: User is not registered
  try {
    const user = { DiscordId: interaction.user.id, Username: interaction.user.username, XboxId: xboxID } as User;
    await userService.create(user);
    // call function to manage record, check for existing record. if (record.exists)
    await interaction.reply({ content: `Thank you for registering with the XboxID ${xboxID}.`, ephemeral: true });
  } catch (err) {
    console.log(err);
  }
}


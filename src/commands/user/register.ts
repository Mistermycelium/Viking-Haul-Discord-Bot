import { SlashCommandBuilder } from 'discord.js';
import UserService from '../../services/UserService';
import { UserRepository } from '../../data/repositories/UserRepository';
import { UserInterface } from '../../data/models/User';
import { Interaction } from '../../interfaces/discord/Interaction';
import { Replies } from '../../enums/discord/Replies';
import { SubCommands } from '../../enums/discord/SubCommands';


const userRepository = new UserRepository();
const userService = new UserService(userRepository);

const xboxRegExp = /^Xbox_\d{16}$/;
const steamRegExp = /^765\d{14}$/;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('Sign up to join one of our servers!')
    .addSubcommand(subcommand =>
      subcommand
        .setName(SubCommands.XBOX)
        .setDescription('For Xbox players')
        .addStringOption(option =>
          option.setName('xboxid')
            .setDescription('Your Xbox ID')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName(SubCommands.STEAM)
        .setDescription('For Steam players')
        .addStringOption(option =>
          option.setName('steam64id')
            .setDescription('Your 17 digit Steam64 ID')
            .setRequired(true))),
  /**
 * This function executes the registration process for the bot.
 * It handles registration for both Xbox and Steam users.
 *
 * @param interaction - The interaction object from the Discord API.
 */
  async execute(interaction: Interaction) {
    // for xbox users
    const subCommand = interaction.options.getSubcommand();
    const xboxId = this.getInteractionOptionFrom('xboxid', interaction);
    const steam64Id = this.getInteractionOptionFrom('steam64id', interaction);

    if (subCommand === SubCommands.XBOX) {
      console.log('XBOX');
      if (xboxId && xboxRegExp.test(xboxId)) {
        await this.checkIfUserIsRegistered(interaction, xboxId);
        await this.registerXboxUser(interaction, xboxId);
      } else {
        await this.reply(interaction, `${xboxId} ${Replies.XBOX_ID_INVALID_OR_MISSING}`);
      }
    }

    if (subCommand === SubCommands.STEAM) {
      console.log('STEAM');
      if (steam64Id && steamRegExp.test(steam64Id)) {
        await this.checkIfUserIsRegistered(interaction, steam64Id);
        await this.registerSteamUser(interaction, steam64Id);
      } else {
        this.reply(interaction, `${steam64Id} ${Replies.STEAM_ID_INVALID_OR_MISSING}`);
      }
    }
  },
  getInteractionOptionFrom(key: string, interaction: Interaction): string {
    return interaction.options.getString(key);
  },
  async reply(interaction: Interaction, message: string): Promise<void> {
    await interaction.reply({ content: message, ephemeral: true });
  },
  // TODO add a return Promise<boolean> to this function so that we avoid executing line 62
  async checkIfUserIsRegistered(interaction: Interaction, id: string) {
    try {
      const discordId = interaction.user.id;
      const discordUsername = interaction.user.username;
      const isRegistered = await userService.findBy(discordId);
      if (isRegistered) {
        console.log(`Hi ${discordUsername}! discordId: ${discordId}. ${Replies.ALREADY_REGISTERED} with ${id}.`);
      }
    } catch (err) {
      console.log(err);
    }
  },
  async registerXboxUser(interaction: Interaction, xboxId: string): Promise<void> {
    try {
      const user = { DiscordId: interaction.user.id, Username: interaction.user.username, XboxId: xboxId } as UserInterface;
      await userService.create(user);
      await this.reply(interaction, `${Replies.XBOX_REGISTERED} ${xboxId}.`);
    } catch (err) {
      console.log(err);
    }
  },
  async registerSteamUser(interaction: Interaction, steam64ID: string): Promise<void> {
    try {
      const user = { DiscordId: interaction.user.id, Username: interaction.user.username, SteamId: steam64ID } as UserInterface;
      await userService.create(user);
      await this.reply(interaction, `${Replies.STEAM_REGISTERED} ${steam64ID}`);
    } catch (err) {
      console.log(err);
    }
  },
};

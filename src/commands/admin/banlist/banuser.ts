import { SlashCommandBuilder } from 'discord.js';
import RegExValidator from '../../../modules/utility/Validator';
import UserListService from '../../../services/lists/UserListService';
import { UserRepository } from '../../../data/repositories/UserRepository';
import { ServerRepository } from '../../../data/repositories/ServerRepository';
import { UserServerStatusRepository } from '../../../data/repositories/UserServerStatusRepository';
import { FileUploadService } from '../../../services/uploads/FileUploadService';
import { FileSystemServiceConfig } from '../../../models/IUploadConfig';
import uploadConfig from '../../../../config/uploadConfig.json';
import UserService from '../../../services/UserService';
import IListEntry from '../../../models/IListEntry';
import UserListBuilder from '../../../services/lists/UserListBuilder';
import { UserListType } from '../../../models/UserListType';
import { Interaction } from '../../../interfaces/discord/Interaction';

const fileSystemConfig: FileSystemServiceConfig = uploadConfig.vanillaBanListFileSystem;
const userRepository = new UserRepository();
const serverRepository = new ServerRepository();
const userStatusRepository = new UserServerStatusRepository();
const banlistService = new UserListService(userRepository, serverRepository, userStatusRepository, new FileUploadService(fileSystemConfig),
  new UserListBuilder(userRepository), UserListType.BANLIST);
const userService = new UserService(userRepository);

module.exports = {
  data:
    new SlashCommandBuilder()
      .setName('banuser')
      .setDefaultMemberPermissions(0)
      .setDescription('Adds a user to the banlist')
      .addMentionableOption(option =>
        option.setName('user')
          .setRequired(true)
          .setDescription('The User to add to the banlist'))
      .addStringOption(option =>
        option.setName('steam')
          .setRequired(false)
          .setDescription('The users Steam ID'))
      .addStringOption(option =>
        option.setName('xbox')
          .setRequired(false)
          .setDescription('The users Xbox ID')),
  async execute(interaction: Interaction) {
    const mentionable = interaction.options.getMentionable('user');
    const user: IListEntry = await userService.findBy(mentionable.user.id)
      .then((usr) => {
        return usr as IListEntry;
      });

    if (await banlistService.exists(user)) {
      await interaction.reply({ content: `${mentionable} is already banned, try update instead.`, ephemeral: true });
    } else {
      if (interaction.options.getString('xbox')) {
        const xboxID = interaction.options.getString('xbox');
        RegExValidator.validateId(xboxID, /^Xbox_\d{16}$/, `${xboxID} is not a valid Xbox ID`);
        user.XboxId = xboxID;
      }

      if (interaction.options.getString('steam')) {
        const steam64ID = interaction.options.getString('steam');
        try {
          RegExValidator.validateId(steam64ID, /^765\d{14}$/, `${steam64ID} is not a valid Steam ID`);
        } catch (error) {
          if (error instanceof Error) {
            await interaction.reply({ content: `Error: ${error.message}`, ephemeral: true });
          }
        }
        user.SteamId = steam64ID;
      }
      banlistService.add(user);
      await interaction.reply({ content: `${mentionable} added.`, ephemeral: true });
    }
  },
};


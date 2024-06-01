import { SlashCommandBuilder } from 'discord.js';
import imports from '../../../config/users.json';
import UserListService from '../../services/lists/UserListService';
import { UserRepository } from '../../data/repositories/UserRepository';
import { FileUploadService } from '../../services/uploads/FileUploadService';
import { FileSystemServiceConfig } from '../../models/IUploadConfig';
import uploadConfig from '../../../config/uploadConfig.json';
import UserListBuilder from '../../services/lists/UserListBuilder';
import UserListType from '../../models/UserListType';
import { Interaction } from '../../interfaces/discord/Interaction';
import { ServerRepository } from '../../data/repositories/ServerRepository';
import { UserServerStatusRepository } from '../../data/repositories/UserServerStatusRepository';

const fileSystemConfig: FileSystemServiceConfig = uploadConfig.vanillaWhiteListFileSystem;
const userRepository = new UserRepository();
const serverRepository = new ServerRepository();
const userStatusRepository = new UserServerStatusRepository();
const whitelistService = new UserListService(userRepository, serverRepository, userStatusRepository, new FileUploadService(fileSystemConfig),
  new UserListBuilder(userRepository), UserListType.WHITELIST);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('importfromconfig')
    .setDescription('Test import from config file'),
  async execute(interaction: Interaction) {
    await Promise.all(imports.map(async (user: any) => {
      try {
        await whitelistService.add(user);
      } catch (error) {
        if (error instanceof Error) {
          console.log(`Failed to add user ${user.username}: ${error.message}`);
        } else {
          console.log(`Failed to add user ${user.username}: With unknown error type...`);
        }
      }
    }));
    const msg = 'Ooga Booga, data imported...';
    console.log(`${msg}`);
    await interaction.reply({ content: `${msg}`, ephemeral: true });
  },
};

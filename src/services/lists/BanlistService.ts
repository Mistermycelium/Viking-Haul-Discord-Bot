import IListEntry from '../../interfaces/models/IListEntry';
import UserListCreator from '../../listCreators/UserListCreator';
import { UserListType } from '../../listCreators/UserListType';

export class BanlistService extends UserListCreator {
  constructor() {
    super(UserListType.BANLIST);
  }

  load(): IListEntry[] {
    throw new Error('Method not implemented.');
  }

  exists(discordId: string): boolean {
    throw new Error('Method not implemented.');
  }

  add(discordId: string): void {
    throw new Error('Method not implemented.');
  }

  remove(discordId: string): void {
    throw new Error('Method not implemented.');
  }

  build() {
    console.log('Building banlist');
  }
}

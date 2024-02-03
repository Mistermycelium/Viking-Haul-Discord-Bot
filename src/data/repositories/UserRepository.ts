import { User, UserInterface, UserServerStatus } from '../Database';
import { UniqueConstraintError, ForeignKeyConstraintError, WhereOptions } from 'sequelize';
import IRepository from './IRepository';
import { Mutex } from 'async-mutex';

class UserRepository implements IRepository<UserInterface> {
  mutex: any;

  constructor() {
    this.mutex = new Mutex();
  }

  private releaseMutex() {
    this.mutex.release();
  }

  async findBy(query: WhereOptions): Promise<UserInterface[]> {
    return User.findAll({
      where: query,
      include: [{
        model: UserServerStatus,
        as: 'UserServerStatus',
        where: query,
        required: true,
      }],
    })
      .then(users => users.map(user => user.dataValues as UserInterface))
      .catch(err => {
        throw new Error(`Error executing query: ${query}, error: ${err}`);
      });
  }

  async findById(id: string): Promise<UserInterface> {
    return await User.findOne({ where: { DiscordId: id } })
      .then((user) => {
        if (user) {
          return user.dataValues as UserInterface;
        } else {
          throw new Error(`User ${id} not found`);
        }
      }, (err) => {
        throw err;
      });
  }

  async getAll(): Promise<UserInterface[]> {
    const result = await User.findAll();
    return result.map(item => item.dataValues as UserInterface);
  }

  async create(user: UserInterface): Promise<UserInterface> {
    return this.mutex.acquire().then(async () => {
      const existingUser = await User.findOne({
        where: {
          DiscordId: user.DiscordId,
        },
      });
      if (existingUser) {
        this.releaseMutex();
        return existingUser.update(user);
      } else {
        await User.create(user)
          .then((created) => {
            this.releaseMutex();
            return created;
          }, (err) => {
            throw new Error(`Error creating ${user.Username}:, DiscorId: ${user.DiscordId}, error: ${err}`);
          });
      }
    }, (err: Error) => {
      throw new Error(`Error creating ${user.Username}:, DiscorId: ${user.DiscordId}, error: ${err}`);
    });
  }

  async delete(user: User): Promise<void> {
    this.mutex.acquire().then(async () => {
      await User.destroy({
        where: {
          DiscordId: user.DiscordId,
        },
      }).then((rowsDeleted) => {
        if (rowsDeleted === 1) {
          console.log('Deleted successfully');
        }
        this.releaseMutex();
      }).catch((err) => {
        if (err instanceof ForeignKeyConstraintError) {
          throw new Error(`${JSON.stringify(user, null, 2)} is referenced by other entities.`);
        }
        throw err;
      });
    });
  }

  async update(user: User): Promise<UserInterface> {
    return this.mutex.acquire().then(async () => {
      await User.update(user, {
        where: {
          DiscordId: user.DiscordId,
        },
      }).then((updated) => {
        if (updated !== undefined) {
          console.log('Updated successfully');
          this.releaseMutex();
          return user;
        }
      }).catch((err) => {
        if (err instanceof UniqueConstraintError) {
          throw new Error(`${JSON.stringify(user, null, 2)} already exists`);
        }
      });
    });
  }
}

export { UserRepository };

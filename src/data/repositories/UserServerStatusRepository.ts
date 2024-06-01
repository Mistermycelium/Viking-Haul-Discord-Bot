import IRepository from './IRepository';
import { UserServerStatus, UserServerStatusInterface } from '../models/UserServerStatus';
import { Mutex } from 'async-mutex';
import { WhereOptions, ForeignKeyConstraintError, UniqueConstraintError } from 'sequelize';

class UserServerStatusRepository implements IRepository<UserServerStatus> {
  mutex: any;

  constructor() {
    this.mutex = new Mutex();
  }

  private releaseMutex() {
    this.mutex.release();
  }

  async findBy(query: WhereOptions): Promise<UserServerStatus[]> {
    return UserServerStatus.findAll({
      where: query,
      include: [{
        model: UserServerStatus,
        as: 'UserServerStatus',
        where: query,
        required: true,
      }],
    })
      .then(UserServerStatuss => UserServerStatuss.map(userServerStatus => userServerStatus.dataValues as UserServerStatus))
      .catch(err => {
        throw new Error(`Error executing query: ${JSON.stringify(query)}, error: ${err}`);
      });
  }

  async findById(id: string): Promise<UserServerStatus> {
    return await UserServerStatus.findOne({ where: { Id: id } })
      .then((userServerStatus) => {
        if (userServerStatus) {
          return userServerStatus.dataValues as UserServerStatus;
        } else {
          throw new Error(`UserServerStatus ${id} not found`);
        }
      }, (err) => {
        throw err;
      });
  }

  async getAll(): Promise<UserServerStatus[]> {
    return await UserServerStatus.findAll();
  }

  async create(userServerStatus: UserServerStatusInterface): Promise<UserServerStatus> {
    return this.mutex.acquire().then(async () => {
      const existingUserServerStatus = await UserServerStatus.findOne({
        where: {
          Id: userServerStatus.Id,
        },
      });
      if (existingUserServerStatus) {
        this.releaseMutex();
        return existingUserServerStatus.update(userServerStatus);
      } else {
        await UserServerStatus.create(userServerStatus)
          .then((created) => {
            this.releaseMutex();
            return created;
          }, (err) => {
            throw new Error(`Error creating ${userServerStatus.StatusType}:, On server: ${userServerStatus.Id}, error: ${err}`);
          });
      }
    }, (err: Error) => {
      throw new Error(`Error creating ${userServerStatus.StatusType}:, On server: ${userServerStatus.Id}, error: ${err}`);
    });
  }

  async delete(query: WhereOptions): Promise<void> {
    this.mutex.acquire().then(async () => {
      await UserServerStatus.destroy({
        where: query,
      }).then((rowsDeleted) => {
        if (rowsDeleted === 1) {
          console.log('Deleted successfully');
        }
        this.releaseMutex();
      }).catch((err) => {
        if (err instanceof ForeignKeyConstraintError) {
          throw new Error(`The query: ${JSON.stringify(query, null, 2)} failed with Cause: ${err.message}.`);
        }
        throw err;
      });
    });
  }

  async update(userServerStatus: UserServerStatusInterface): Promise<UserServerStatus> {
    return this.mutex.acquire().then(async () => {
      await UserServerStatus.update(userServerStatus, {
        where: {
          Id: userServerStatus.Id,
        },
      }).then((updated) => {
        if (updated !== undefined) {
          console.log('Updated successfully');
          this.releaseMutex();
          return UserServerStatus;
        }
      }).catch((err) => {
        if (err instanceof UniqueConstraintError) {
          throw new Error(`${JSON.stringify(UserServerStatus, null, 2)} already exists`);
        }
      });
    });
  }
}

export { UserServerStatusRepository };

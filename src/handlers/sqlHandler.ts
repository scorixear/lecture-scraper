import { Logger, WARNINGLEVEL } from 'discord.ts-architecture';
import mysql from 'mysql';
import { Lecture } from '../model/Lecture';
import { Module } from '../model/Module';

export default class SqlHandler {
  private pool: mysql.Pool;
  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT ?? '3306', 10),
      database: process.env.DB_DATABASE,
      multipleStatements: true,
      connectionLimit: 5
    });
  }

  /**
   * Initializes the DataBas
   */
  public async initDB() {
    let conn: mysql.PoolConnection | undefined;
    try {
      conn = await new Promise<mysql.PoolConnection>((resolve, reject) => {
        this.pool.getConnection((err, conn) => {
          if (err) reject(err);
          else resolve(conn);
        });
      });
      await this.sqlQuery(
        conn,
        'CREATE TABLE IF NOT EXISTS `module` (`id` INT AUTO_INCREMENT, `semester` VARCHAR(255) NOT NULL, `date` BIGINT NOT NULL, `uni_id` VARCHAR(255) NOT NULL, `name` VARCHAR(255), `professor` VARCHAR(255), PRIMARY KEY(`id`), CONSTRAINT UC_Module UNIQUE (`semester`, `uni_id`))'
      );
      await this.sqlQuery(
        conn,
        'CREATE TABLE IF NOT EXISTS `lecturer`(`module_id` INT NOT NULL, `name` VARCHAR(255) NOT NULL, PRIMARY KEY (`module_id`, `name`))'
      );
      await this.sqlQuery(
        conn,
        'CREATE TABLE IF NOT EXISTS `lecture` (`id` INT AUTO_INCREMENT, `module_id` INT NOT NULL, `type` VARCHAR(255), `time` VARCHAR(255), `day` VARCHAR(255), `place` VARCHAR(255), `group` VARCHAR(255), PRIMARY KEY(`id`))'
      );
      await this.sqlQuery(
        conn,
        'CREATE TABLE IF NOT EXISTS `channel` (`channel_id` VARCHAR(255) NOT NULL, `module_id` VARCHAR(255) NOT NULL, PRIMARY KEY (`channel_id`))'
      );
    } catch (err) {
      Logger.exception('Error creating tables', err, WARNINGLEVEL.ERROR);
      throw err;
    } finally {
      if (conn) conn.release();
    }
    Logger.info('Initialized Database');
  }

  public async setModules(modules: Module[]) {
    return await this.sqlHandle(
      async (conn) => {
        modules.forEach(async (module) => {
          // check if module exist
          let mod = await this.sqlQuery(
            conn,
            'SELECT `id` FROM `module` WHERE `semester` = ? AND `uni_id` = ?',
            module.semester,
            module.id
          );
          // if module exists
          if (mod && mod[0]) {
            await this.sqlQuery(
              conn,
              'UPDATE `module` SET `name` = ?, `professor` = ?, `date` = ? WHERE `id` = ?',
              module.displayName,
              module.professor,
              module.date.getTime(),
              mod[0].id
            );
            await this.sqlQuery(conn, 'DELETE FROM `lecturer` WHERE `module_id` = ?', mod[0].id);
            await this.sqlQuery(conn, 'DELETE FROM `lecture` WHERE `module_id` = ?', mod[0].id);
          } else {
            await this.sqlQuery(
              conn,
              'INSERT INTO `module` (`semester`, `date`, `uni_id`, `name`, `professor`) VALUES (?, ?, ?, ?, ?)',
              module.semester,
              module.date.getTime(),
              module.id,
              module.displayName,
              module.professor
            );
            mod = await this.sqlQuery(
              conn,
              'SELECT `id` FROM `module` WHERE `semester` = ? AND `uni_id` = ?',
              module.semester,
              module.id
            );
          }
          const sqlLecturers = module.lecturers.map((lecturer) => [mod[0].id, lecturer]);
          await this.sqlQuery(conn, 'INSERT INTO `lecturer` (`module_id`, `name`) VALUES ?', sqlLecturers);
          const sqlLectures = module.lectures.map((lecture) => [
            mod[0].id,
            lecture.type,
            lecture.time ?? null,
            lecture.day,
            lecture.place,
            lecture.group ?? null
          ]);
          await this.sqlQuery(
            conn,
            'INSERT INTO `lecture` (`module_id`, `type`, `time`, `day`, `place`, `group`) VALUES ?',
            sqlLectures
          );
        });
        return true;
      },
      (error) => {
        Logger.exception('Error setting module', error, WARNINGLEVEL.ERROR);
      },
      false
    );
  }
  public async getSemesterDate(semester: string): Promise<number | undefined> {
    return await this.sqlHandle(
      async (conn) => {
        const date = await this.sqlQuery(conn, 'SELECT `date` FROM `module` WHERE `semester` = ?', semester);
        if (date && date[0]) {
          return date[0].date;
        }
        return undefined;
      },
      (error) => {
        Logger.exception('Error retrieving semester date', error, WARNINGLEVEL.ERROR);
      },
      undefined
    );
  }
  public async getLectures(semester: string, uni_id: string): Promise<Lecture[]> {
    return await this.sqlHandle(
      async (conn) => {
        const mod = await this.sqlQuery(
          conn,
          'SELECT `id` FROM `module` WHERE `semester` = ? AND `uni_id` = ?',
          semester,
          uni_id
        );
        if (!mod || !mod[0]) {
          throw Error('Unknown module');
        }
        const lectures = await this.sqlQuery(conn, 'SELECT * FROM `lecture` WHERE `module_id` = ?', mod[0].id);
        if (!lectures) throw Error('No lectures found');
        const returnLectures: Lecture[] = [];
        lectures.forEach((lecture: any) => {
          returnLectures.push(new Lecture(lecture.type, lecture.day, lecture.place, lecture.time, lecture.group));
        });
        return returnLectures;
      },
      (error) => {
        Logger.exception('Error retrieving lectures', error, WARNINGLEVEL.ERROR);
      },
      new Array<Lecture>()
    );
  }
  public async getLecturers(semester: string, uni_id: string): Promise<string[]> {
    return await this.sqlHandle(
      async (conn) => {
        const mod = await this.sqlQuery(
          conn,
          'SELECT `id` FROM `module` WHERE `semester` = ? AND `uni_id` = ?',
          semester,
          uni_id
        );
        if (!mod || !mod[0]) {
          throw Error('Unknown module');
        }
        const lecturers = await this.sqlQuery(conn, 'SELECT `name` FROM `lecturers` WHERE `module_id` = ?', mod[0].id);
        if (!lecturers) throw Error('No lecturers found');
        return lecturers.map((l: any) => l.name);
      },
      (error) => {
        Logger.exception('Error retrieving lecturers', error, WARNINGLEVEL.ERROR);
      },
      new Array<string>()
    );
  }
  public async getModule(semester: string, uni_id: string): Promise<Module | undefined> {
    return await this.sqlHandle<Module | undefined>(
      async (conn) => {
        const sqlModule = await this.sqlQuery(
          conn,
          'SELECT * FROM `module` WHERE `semester` = ? AND `uni_id` = ?',
          semester,
          uni_id
        );
        if (!sqlModule || !sqlModule[0]) throw Error('Module not found');
        const sqlLecturers = await this.sqlQuery(
          conn,
          'SELECT `name` FROM `lecturer` WHERE `module_id` = ?',
          sqlModule[0].id
        );
        const sqlLectures = await this.sqlQuery(conn, 'SELECT * FROM `lecture` WHERE `module_id` = ?', sqlModule[0].id);
        if (!sqlLectures) throw Error('Lectures not found');
        const lectures: Lecture[] = sqlLectures.map(
          (sqlLecture: any) =>
            new Lecture(sqlLecture.type, sqlLecture.day, sqlLecture.place, sqlLecture.time, sqlLecture.group)
        );
        return new Module(
          uni_id,
          sqlModule[0].name,
          sqlModule[0].semester,
          new Date(sqlModule[0].date),
          sqlModule[0].professor,
          lectures,
          sqlLecturers.map((l: any) => l.name)
        );
      },
      (error) => {
        Logger.exception('Error retrieving Module', error, WARNINGLEVEL.ERROR);
      },
      undefined
    );
  }

  public async getModuleFromId(module_id: number): Promise<Module | undefined> {
    return await this.sqlHandle<Module | undefined>(
      async (conn) => {
        const sqlModule = await this.sqlQuery(conn, 'SELECT * FROM `module` WHERE `id` = ?', module_id);
        if (!sqlModule || !sqlModule[0]) throw Error('Unknown module');
        const sqlLecturers = await this.sqlQuery(
          conn,
          'SELECT `name` FROM `lecturer` WHERE `module_id` = ?',
          sqlModule[0].id
        );
        const sqlLectures = await this.sqlQuery(conn, 'SELECT * FROM `lecture` WHERE `module_id` = ?', sqlModule[0].id);
        if (!sqlLectures) throw Error('Lectures not found');
        const lectures: Lecture[] = sqlLectures.map(
          (sqlLecture: any) =>
            new Lecture(sqlLecture.type, sqlLecture.day, sqlLecture.place, sqlLecture.time, sqlLecture.group)
        );
        return new Module(
          sqlModule[0].uni_id,
          sqlModule[0].name,
          sqlModule[0].semester,
          new Date(sqlModule[0].date),
          sqlModule[0].professor,
          lectures,
          sqlLecturers.map((l: any) => l.name)
        );
      },
      (error) => {
        Logger.exception('Error retrieving module', error, WARNINGLEVEL.ERROR, module_id);
      },
      undefined
    );
  }

  public async getModuleIdFromChannel(channel: string): Promise<number | undefined> {
    return await this.sqlHandle(
      async (conn) => {
        const module_id = await this.sqlQuery(
          conn,
          'SELECT `module_id` FROM `channel` WHERE `channel_id` = ?',
          channel
        );
        if (!module_id || !module_id[0]) throw Error('Channel not found');
        return module_id[0].module_id;
      },
      () => {
        // Logger.exception('Error retrieving channel', error, WARNINGLEVEL.ERROR);
      },
      undefined
    );
  }

  public async setChannel(channel: string, uni_id: string, semester: string) {
    return await this.sqlHandle(
      async (conn) => {
        const module_id = await this.sqlQuery(
          conn,
          'SELECT `id` FROM `module` WHERE `semester` = ? AND `uni_id` = ?',
          semester,
          uni_id
        );
        if (!module_id || !module_id[0]) throw new Error('Unknown module');
        const channelId = await this.sqlQuery(
          conn,
          'SELECT `channel_id` FROM `channel` WHERE `channel_id` = ?',
          channel
        );
        if (!channelId || !channelId[0]) {
          await this.sqlQuery(
            conn,
            'INSERT INTO `channel` (`channel_id`, `module_id`) VALUES (?, ?)',
            channel,
            module_id[0].id
          );
        } else {
          await this.sqlQuery(
            conn,
            'UPDATE `channel` SET `module_id` = ? WHERE `channel_id` = ?',
            module_id[0].id,
            channel
          );
        }
        return true;
      },
      (error) => {
        Logger.exception('Error setting channel', error, WARNINGLEVEL.ERROR, channel, uni_id, semester, error);
      },
      false
    );
  }

  public async getModuleNameAndUniId(): Promise<{ name: string; uni_id: string }[]> {
    return await this.sqlHandle(
      async (conn) => {
        const sqlResult = await this.sqlQuery(conn, 'SELECT DISTINCT name, uni_id FROM module');
        const result: { name: string; uni_id: string }[] = [];
        sqlResult.forEach((module: any) => {
          result.push({ name: module.name, uni_id: module.uni_id });
        });
        return result;
      },
      (error) => {
        Logger.exception('Error retrieving modules', error, WARNINGLEVEL.ERROR);
      },
      []
    );
  }
  public async getSemesters(): Promise<string[]> {
    return await this.sqlHandle(
      async (conn) => {
        const sqlResult = await this.sqlQuery(conn, 'SELECT DISTINCT semester FROM module');
        const result: string[] = [];
        sqlResult.forEach((semester: any) => {
          result.push(semester.semester);
        });
        return result;
      },
      (error) => {
        Logger.exception('Error retrieving semesters', error, WARNINGLEVEL.ERROR);
      },
      []
    );
  }

  private async sqlHandle<T>(
    normal: (conn: mysql.PoolConnection) => Promise<T>,
    error: (err: unknown) => void,
    inital: T
  ) {
    let returnValue: T = inital;
    let conn;
    try {
      conn = await new Promise<mysql.PoolConnection>((resolve, reject) => {
        this.pool.getConnection((err, conn) => {
          if (err) reject(err);
          else resolve(conn);
        });
      });
      returnValue = await normal(conn);
    } catch (e) {
      error(e);
    } finally {
      if (conn) conn.release();
    }
    return returnValue;
  }

  private sqlQuery(conn: mysql.PoolConnection, query: string, ...values: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      conn.query(query, values, (err, res) => {
        if (err) {
          reject(err);
        }
        resolve(res);
      });
    });
  }
}

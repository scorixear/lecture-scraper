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

      await new Promise((resolve, reject) => {
        conn?.query(
          'CREATE TABLE IF NOT EXISTS `semester` (`name` VARCHAR(255) NOT NULL, `date` INT NOT NULL, PRIMARY KEY (`name`))',
          (err) => {
            if (err) reject(err);
          }
        );
        conn?.query(
          'CREATE TABLE IF NOT EXISTS `module` (`id` INT AUTO_INCREMENT, `semester` VARCHAR(255) NOT NULL, `uni_id` VARCHAR(255) NOT NULL, `name` VARCHAR(255), `professor` VARCHAR(255), PRIMARY KEY(`id`))',
          (err) => {
            if (err) reject(err);
          }
        );
        conn?.query(
          'CREATE TABLE IF NOT EXISTS `lecturer`(`module_id` INT NOT NULL, `name` VARCHAR(255) NOT NULL, PRIMARY KEY (`module_id`, `lecturer`))',
          (err) => {
            if (err) reject(err);
          }
        );
        conn?.query(
          'CREATE TABLE IF NOT EXISTS `lecture` (`id` INT AUTO_INCREMENT, `module_id` INT NOT NULL, `type` VARCHAR(255), `time` VARCHAR(255), `day` VARCHAR(255), `place` VARCHAR(255), `group` VARCHAR(255), PRIMARY KEY(`id`))',
          (err) => {
            if (err) reject(err);
          }
        );
        conn?.query(
          'CREATE TABLE IF NOT EXISTS `channel` (`channel_id` VARCHAR(255) NOT NULL, `module_id` VARCHAR(255) NOT NULL, PRIMARY_KEY(`channel_id`))',
          (err) => {
            if (err) reject(err);
          }
        );
      });
    } finally {
      if (conn) conn.end();
    }
    Logger.info('Initialized Database');
  }

  public async setModules(semester: string, modules: Module[]) {
    return await this.sqlHandle(
      async (conn) => {
        modules.forEach(async (module) => {
          // check if module exist
          let mod = await this.sqlQuery(
            conn,
            'SELECT id FROM module WHERE semester = ? AND uni_id = ?',
            semester,
            module.id
          );
          console.log(mod); // temp
          // if module exists
          if (mod && mod[0]) {
            await this.sqlQuery(
              conn,
              'UPDATE module SET name = ?, professor = ? WHERE id = ?',
              module.displayName,
              module.professor,
              mod[0]
            );
            await this.sqlQuery(conn, 'DELETE FROM lecturer WHERE module_id = ?', mod[0]);
            await this.sqlQuery(conn, 'DELETE FROM lecture WHERE module_id = ?', mod[0]);
            await this.sqlQuery(conn, 'UPDATE semester SET date = ? WHERE name = ?', new Date().getTime(), semester);
          } else {
            await this.sqlQuery(conn, 'INSERT INTO semester (name, date) VALUES ?', [semester, new Date().getTime()]);
            await this.sqlQuery(conn, 'INSERT INTO module (semester, uni_id, name, professor) VALUES ?', [
              semester,
              module.id,
              module.displayName,
              module.professor
            ]);
            mod = await this.sqlQuery(
              conn,
              'SELECT id FROM module WHERE semester = ? AND uni_id = ?',
              semester,
              module.id
            );
          }
          const sqlLecturers = module.lecturers.map((lecturer) => [mod[0], lecturer]);
          await this.sqlQuery(conn, 'INSERT INTO lecturer (module_id, name) VALUES ?', sqlLecturers);
          const sqlLectures = module.lectures.map((lecture) => [
            mod[0],
            lecture.type,
            lecture.time,
            lecture.day,
            lecture.place,
            lecture.group
          ]);
          await this.sqlQuery(
            conn,
            'INSERT INTO lecture (module_id, type, time, day, place, group) VALUES ?',
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
        const date = await this.sqlQuery(conn, 'SELECT date FROM semester WHERE name = ?', semester);
        if (date && date[0]) {
          return date[0];
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
          'SELECT id FROM module WHERE semester = ? AND uni_id = ?',
          semester,
          uni_id
        );
        if (!mod || !mod[0]) {
          throw Error('Unknown module');
        }
        const lectures = await this.sqlQuery(conn, 'SELECT * FROM lecture WHERE module_id = ?', mod[0]);
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
          'SELECT id FROM module WHERE semester = ? AND uni_id = ?',
          semester,
          uni_id
        );
        if (!mod || !mod[0]) {
          throw Error('Unknown module');
        }
        const lecturers = await this.sqlQuery(conn, 'SELECDT name FROM lecturers WHERE module_id = ?', mod[0]);
        if (!lecturers) throw Error('No lecturers found');
        return [...lecturers];
      },
      (error) => {
        Logger.exception('Error retrieving lecturers', error, WARNINGLEVEL.ERROR);
      },
      new Array<string>()
    );
  }
  public async getModule(semester: string, uni_id: string): Promise<[Module | undefined, number]> {
    return await this.sqlHandle<[Module | undefined, number]>(
      async (conn) => {
        const date = await this.sqlQuery(conn, 'SELECT date FROM semester WHERE name = ?', semester);
        if (!date || !date[0]) throw Error('Semester not found');
        const sqlModule = await this.sqlQuery(
          conn,
          'SELECT * FROM module WHERE semester = ? AND uni_id = ?',
          semester,
          uni_id
        );
        if (!sqlModule || !sqlModule[0]) throw Error('Module not found');
        const sqlLecturers = await this.sqlQuery(
          conn,
          'SELECT name FROM lecturer WHERE module_id = ?',
          sqlModule[0].id
        );
        const sqlLectures = await this.sqlQuery(conn, 'SELECT * FROM lecture WHERE module_id = ?', sqlModule[0].id);
        if (!sqlLectures) throw Error('Lectures not found');
        const lectures: Lecture[] = sqlLectures.map(
          (sqlLecture: any) =>
            new Lecture(sqlLecture.type, sqlLecture.day, sqlLecture.place, sqlLecture.time, sqlLecture.group)
        );
        return [new Module(uni_id, sqlModule[0].name, sqlModule[0].professor, lectures, [...sqlLecturers]), date[0]];
      },
      (error) => {
        Logger.exception('Error retrieving Module', error, WARNINGLEVEL.ERROR);
      },
      [undefined, 0]
    );
  }

  public async getUniIdFromChannel(channel: string): Promise<string | undefined> {
    return await this.sqlHandle(
      async (conn) => {
        const module_id = await this.sqlQuery(conn, 'SELECT module_id FROM channel WHERE channel_id = ?', channel);
        if (!module_id || !module_id[0]) throw Error('Channel not found');
        const uni_id = await this.sqlQuery(conn, 'SELECT uni_id FROM module WHERE module_id = ?', module_id[0]);
        if (!uni_id || !uni_id[0]) throw Error('Module not found');
        return uni_id[0];
      },
      (error) => {
        Logger.exception('Error retrieving channel', error, WARNINGLEVEL.ERROR);
      },
      undefined
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
      if (conn) conn.end();
    }
    return returnValue;
  }

  private sqlQuery(conn: mysql.PoolConnection, query: string, ...values: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      conn.query(query, values, (err, res) => {
        if (err) reject(err);
        resolve(res);
      });
    });
  }
}

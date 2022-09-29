import { Logger } from 'discord.ts-architecture';
import mariadb from 'mariadb';

export default class SqlHandler {
  private pool: mariadb.Pool;
  constructor() {
    this.pool = mariadb.createPool({
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
   * Initializes the DataBase
   */
  public async initDB() {
    let conn;
    try {
      conn = await this.pool.getConnection();
      await conn.query(
        'CREATE TABLE IF NOT EXISTS `linkedroles` (`archName` VARCHAR(255) NOT NULL, `roleid` VARCHAR(255) NOT NULL, `guildid` VARCHAR(255) NOT NULL, PRIMARY KEY (`archName`, `roleid`, `guildid`))'
      );
    }finally {
      if (conn) await conn.end();
    }
    Logger.info('Initialized Database');
  }
}
import dotenv from 'dotenv';
import { DiscordHandler, InteractionHandler, Logger, TwoWayMap, WARNINGLEVEL } from 'discord.ts-architecture';
import { GatewayIntentBits, Partials } from 'discord.js';
import { WebScraper } from './handlers/webScraper';
import config from './config';
import LanguageHandler from './handlers/languageHandler';
import SqlHandler from './handlers/sqlHandler';
// initialize configuration
dotenv.config();

declare global {
  /* eslint-disable-next-line */
  var discordHandler: DiscordHandler;
  /* eslint-disable-next-line */
  var interactionHandler: InteractionHandler;
  /* eslint-disable-next-line */
  var webScraper: WebScraper;
  // eslint-disable-next-line no-var
  var sqlHandler: SqlHandler;
}
// eslint-disable-next-line @typescript-eslint/no-empty-function
global.interactionHandler = new InteractionHandler(new TwoWayMap(new Map()), [], () => {});

global.sqlHandler = new SqlHandler();

global.discordHandler = new DiscordHandler(
  [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User],
  [GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds]
);

global.webScraper = new WebScraper();

discordHandler.on('interactionCreate', (interaction) => global.interactionHandler.handle(interaction));

process.on('uncaughtException', (err: Error) => {
  Logger.exception('Uncaught Exception', err, WARNINGLEVEL.ERROR);
});
process.on('unhandledRejection', (reason) => {
  Logger.exception('Unhandled Rejection', reason, WARNINGLEVEL.ERROR);
});

sqlHandler.initDB().then(async () => {
  await discordHandler.login(process.env.DISCORD_TOKEN ?? '');
  await interactionHandler.init(
    process.env.DISCORD_TOKEN ?? '',
    process.env.CLIENTID ?? '',
    discordHandler,
    undefined,
    undefined
  );
  await webScraper.init();
  Logger.info('Bot is ready');
});

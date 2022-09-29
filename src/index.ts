import dotenv from 'dotenv';
import { DiscordHandler, InteractionHandler, Logger, TwoWayMap, WARNINGLEVEL } from 'discord.ts-architecture';
import { GatewayIntentBits, Partials } from 'discord.js';
// initialize configuration
dotenv.config();

declare global {
  /* eslint-disable-next-line */
  var discordHandler: DiscordHandler;
  /* eslint-disable-next-line */
  var interactionHandler: InteractionHandler;
}
global.interactionHandler = new InteractionHandler(
  new TwoWayMap(new Map()),
  [
  ],
  () => {}
  );

global.discordHandler = new DiscordHandler(
  [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User],
  [
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.Guilds
  ]
);

discordHandler.on('interactionCreate', (interaction) => global.interactionHandler.handle(interaction));

process.on('uncaughtException', (err: Error) => {
  Logger.exception('Uncaught Exception', err, WARNINGLEVEL.ERROR);
});
process.on('unhandledRejection', (reason) => {
  Logger.exception('Unhandled Rejection', reason, WARNINGLEVEL.ERROR);
});

discordHandler.login(process.env.DISCORD_TOKEN ?? '').then(async () => {
  await interactionHandler.init(
    process.env.DISCORD_TOKEN ?? '',
    process.env.CLIENTID ?? '',
    discordHandler,
    undefined,
    undefined
  );
  Logger.info('Bot is ready');
});
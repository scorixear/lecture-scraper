import dotenv from 'dotenv';
import { DiscordHandler, InteractionHandler, Logger, TwoWayMap, WARNINGLEVEL } from 'discord.ts-architecture';
import { GatewayIntentBits, Partials } from 'discord.js';
import { WebScraper } from './handlers/webScraper';
import CaptureCommand from './commands/captureCommand';
import PrintCommand from './commands/printCommand';
import SetModuleCommand from './commands/setModuleCommand';
import ForceResetButton from './buttons/forceResetButton';
import RetryChannelButton from './buttons/retryChannelButton';
import SetModuleButton from './buttons/setModuleButton';
import ModuleSelectMenu from './selectMenus/moduleSelectMenu';
import CalenderCommand from './commands/calenderCommand';
import LinkRoleCommand from './commands/linkRoleCommand';
import { CalendarButton } from './buttons/calendarButton';
import SetConfigCommand from './commands/setConfigCommand';
// initialize configuration
dotenv.config();

declare global {
  /* eslint-disable-next-line */
  var discordHandler: DiscordHandler;
  /* eslint-disable-next-line */
  var interactionHandler: InteractionHandler;
  /* eslint-disable-next-line */
  var webScraper: WebScraper;
}
// eslint-disable-next-line @typescript-eslint/no-empty-function
global.interactionHandler = new InteractionHandler(
  [
    new CaptureCommand(),
    new PrintCommand(),
    new SetModuleCommand(),
    new CalenderCommand(),
    new LinkRoleCommand(),
    new SetConfigCommand()
  ],
  new TwoWayMap(
    new Map([
      ['force-reset', new ForceResetButton('force-reset')],
      ['retry-channel', new RetryChannelButton('retry-channel')],
      ['set-module', new SetModuleButton('set-module')],
      ['calendar', new CalendarButton('calendar')]
    ])
  ),
  new TwoWayMap(new Map([['module', new ModuleSelectMenu('module')]]))
);

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

discordHandler.login(process.env.DISCORD_TOKEN ?? '').then(async () => {
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

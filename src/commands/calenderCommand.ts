import { ChatInputCommandInteraction, CacheType, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { CommandInteractionModel, MessageHandler } from 'discord.ts-architecture';
import LanguageHandler from '../handlers/languageHandler';

export default class CalenderCommand extends CommandInteractionModel {
  constructor() {
    super('calendar', LanguageHandler.language.commands.calendar.description, 'calendar', 'Moderation', 'calendar', []);
  }

  override async handle(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    try {
      super.handle(interaction);
    } catch {
      return;
    }

    await MessageHandler.reply({
      interaction,
      title: LanguageHandler.language.commands.calendar.success.title,
      description: LanguageHandler.language.commands.calendar.success.description,
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('calendar')
            .setLabel(LanguageHandler.language.commands.calendar.buttons.calendar)
            .setStyle(ButtonStyle.Primary)
        )
      ]
    });
  }
}

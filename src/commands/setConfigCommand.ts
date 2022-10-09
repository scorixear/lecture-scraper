import { AutocompleteInteraction, CacheType, ChatInputCommandInteraction, SlashCommandStringOption } from 'discord.js';
import { AutocompleteInteractionModel, MessageHandler } from 'discord.ts-architecture';
import { sqlClient } from '../handlers/sqlHandler';
import LanguageHandler from '../handlers/languageHandler';

export default class SetConfigCommand extends AutocompleteInteractionModel {
  constructor() {
    super(
      'setconfig',
      LanguageHandler.language.commands.setconfig.description,
      'setconfig label:semester value:ws2022',
      'Moderation',
      'setconfig <label> <value>',
      [
        new SlashCommandStringOption()
          .setName('label')
          .setDescription(LanguageHandler.language.commands.setconfig.options.label)
          .setAutocomplete(true)
          .setRequired(true),
        new SlashCommandStringOption()
          .setName('value')
          .setDescription(LanguageHandler.language.commands.setconfig.options.value)
          .setRequired(true)
      ]
    );
  }

  override async handleAutocomplete(interaction: AutocompleteInteraction<CacheType>): Promise<void> {
    const focused = interaction.options.getFocused();
    interaction.respond(
      ['semester', 'startdate', 'enddate']
        .filter((l) => l.toLowerCase().startsWith(focused.toLowerCase()))
        .map((l) => ({
          name: l,
          value: l.toLowerCase()
        }))
    );
  }

  override async handle(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    try {
      super.handle(interaction);
    } catch {
      return;
    }

    const label = interaction.options.getString('label', true);
    const value = interaction.options.getString('value', true);

    await sqlClient.setConfig({ label, value });
    await MessageHandler.reply({
      interaction,
      title: LanguageHandler.language.commands.setconfig.success.title,
      description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.setconfig.success.description, [
        label,
        value
      ]),
      ephemeral: true
    });
  }
}

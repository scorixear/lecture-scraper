import {
  ActionRowBuilder,
  ApplicationCommandOptionChoiceData,
  AutocompleteInteraction,
  ButtonBuilder,
  ButtonStyle,
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandStringOption
} from 'discord.js';
import { AutocompleteInteractionModel, MessageHandler } from 'discord.ts-architecture';
import { sqlClient } from '../handlers/sqlHandler';
import LanguageHandler from '../handlers/languageHandler';

export default class SetModuleCommand extends AutocompleteInteractionModel {
  constructor() {
    const commandOptions = [
      new SlashCommandStringOption()
        .setName('modul-id')
        .setDescription(LanguageHandler.language.commands.setModule.options.uni_id)
        .setRequired(true)
        .setAutocomplete(true)
    ];
    super(
      'setmodule',
      LanguageHandler.language.commands.setModule.description,
      'setmodule 10-101-101',
      'Moderation',
      'setmodule <uni-id>',
      commandOptions
    );
  }

  override async handleAutocomplete(interaction: AutocompleteInteraction<CacheType>): Promise<void> {
    const focusedOption = interaction.options.getFocused(true);
    let selection: ApplicationCommandOptionChoiceData<string>[] = [];

    const modules = await sqlClient.getModuleNameAndUniIds();
    selection =
      modules
        ?.filter((m) => m.uni_id.toLowerCase().startsWith(focusedOption.value.toLowerCase()))
        ?.map((m) => ({ value: m.uni_id, name: m.name ?? '' })) ?? [];

    if (selection.length > 25) {
      interaction.respond(selection.splice(25));
    } else {
      interaction.respond(selection);
    }
  }

  override async handle(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    try {
      await super.handle(interaction);
    } catch (error) {
      return;
    }
    const uni_id = interaction.options.getString('modul-id', true);
    const info = await sqlClient.getMostRecentModule(uni_id);
    if (!info) {
      await MessageHandler.replyError({
        interaction,
        title: LanguageHandler.language.commands.setModule.error.title,
        description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.setModule.error.description, [
          uni_id
        ])
      });
      return;
    } else {
      const success = await sqlClient.setChannel(interaction.channelId, uni_id);
      if (!success) {
        await MessageHandler.replyError({
          interaction,
          title: LanguageHandler.language.commands.setModule.error.title,
          description: LanguageHandler.language.commands.setModule.error.internal,
          components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId('retry-channel_' + uni_id)
                .setLabel(LanguageHandler.language.commands.setModule.buttons.retry)
                .setStyle(ButtonStyle.Danger)
            )
          ]
        });
        return;
      }
      await MessageHandler.reply({
        interaction,
        title: LanguageHandler.language.commands.setModule.success.title,
        description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.setModule.success.description, [
          uni_id
        ]),
        ephemeral: true
      });
    }
  }
}

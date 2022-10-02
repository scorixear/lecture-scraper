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
import LanguageHandler from '../handlers/languageHandler';

export default class SetChannnel extends AutocompleteInteractionModel {
  constructor() {
    const commandOptions = [
      new SlashCommandStringOption()
        .setName('semester')
        .setDescription(LanguageHandler.language.commands.setChannel.options.semester)
        .setRequired(true)
        .setAutocomplete(true),
      new SlashCommandStringOption()
        .setName('modul-id')
        .setDescription(LanguageHandler.language.commands.setChannel.options.uni_id)
        .setRequired(true)
        .setAutocomplete(true)
    ];
    super(
      'setChannel',
      LanguageHandler.language.commands.setChannel.description,
      'setChannel ws2022 10-101-101',
      'Moderation',
      'setChannel <semester> <uni-id>',
      commandOptions
    );
  }

  override async handleAutocomplete(interaction: AutocompleteInteraction<CacheType>): Promise<void> {
    const focusedOption = interaction.options.getFocused(true);
    let selection: ApplicationCommandOptionChoiceData<string>[] = [];
    if (focusedOption.name === 'semester') {
      const semester: string[] = await sqlHandler.getSemesters();
      selection = semester
        .filter((s) => s.toLowerCase().startsWith(focusedOption.value.toLowerCase()))
        .map((s) => ({ value: s, name: s }));
    } else {
      const modules: { name: string; uni_id: string }[] = await sqlHandler.getModuleNameAndUniId();
      selection = modules
        .filter((m) => m.uni_id.toLowerCase().startsWith(focusedOption.value.toLowerCase()))
        .map((m) => ({ value: m.uni_id, name: m.name }));
    }
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

    const semester = interaction.options.getString('semester', true);
    const uni_id = interaction.options.getString('modul-id', true);
    const info = await sqlHandler.getModule(semester, uni_id);
    if (!info) {
      await MessageHandler.replyError({
        interaction,
        title: LanguageHandler.language.commands.setChannel.error.title,
        description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.setChannel.error.description, [
          semester,
          uni_id
        ]),
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId('show-modules')
              .setLabel(LanguageHandler.language.commands.setChannel.buttons.show_modules)
              .setStyle(ButtonStyle.Primary)
          )
        ]
      });
      return;
    } else {
      const success = await sqlHandler.setChannel(interaction.channelId, uni_id, semester);
      if (!success) {
        await MessageHandler.replyError({
          interaction,
          title: LanguageHandler.language.commands.setChannel.error.title,
          description: LanguageHandler.language.commands.setChannel.error.internal,
          components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId('rety-channel_' + semester + '_' + uni_id)
                .setLabel(LanguageHandler.language.commands.setChannel.buttons.retry)
                .setStyle(ButtonStyle.Danger)
            )
          ]
        });
        return;
      }
      await MessageHandler.reply({
        interaction,
        title: LanguageHandler.language.commands.setChannel.success.title,
        description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.setChannel.success.description, [
          semester,
          uni_id
        ]),
        ephemeral: true
      });
    }
  }
}

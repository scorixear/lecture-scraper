import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CacheType, ChatInputCommandInteraction } from 'discord.js';
import { CommandInteractionModel, MessageHandler } from 'discord.ts-architecture';
import { Module } from '../model/Module';
import LanguageHandler from '../handlers/languageHandler';

export default class Print extends CommandInteractionModel {
  constructor() {
    const commandOptions: any[] = [];
    super('print', LanguageHandler.language.commands.print.description, 'print', 'Moderation', 'print', commandOptions);
  }

  override async handle(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    try {
      await super.handle(interaction);
    } catch (error) {
      return;
    }
    const module_id = await sqlHandler.getModuleIdFromChannel(interaction.channelId);
    let info: [Module, number] | undefined = undefined;
    if (module_id) {
      info = await sqlHandler.getModuleFromId(module_id);
    }
    if (!info) {
      await MessageHandler.replyError({
        interaction,
        title: LanguageHandler.language.commands.print.error.title,
        description: LanguageHandler.language.commands.print.error.not_set,
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId('set-channel')
              .setLabel(LanguageHandler.language.commands.print.buttons.set_channel)
              .setStyle(ButtonStyle.Primary)
          )
        ]
      });
      return;
    }
    const [module, dateNumber] = info;
    const lectureCategories = module.lectures.map((lecture) => ({
      title: lecture.type + ',' + lecture.group,
      text: LanguageHandler.replaceArgs(LanguageHandler.language.commands.print.success.lecture, [
        lecture.time ?? '',
        lecture.day,
        lecture.place
      ]),
      inline: true
    }));
    await MessageHandler.reply({
      interaction,
      title: module.displayName,
      description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.print.success.date, [
        new Date(dateNumber).toDateString()
      ]),
      categories: [
        {
          title: LanguageHandler.language.commands.print.success.main_title,
          text: LanguageHandler.replaceArgs(LanguageHandler.language.commands.print.success.main, [
            module.id,
            module.professor ?? ''
          ]),
          inline: false
        },
        ...lectureCategories,
        {
          title: LanguageHandler.language.commands.print.success.lecturers,
          text: module.lecturers.join('\n'),
          inline: false
        }
      ]
    });
  }
}

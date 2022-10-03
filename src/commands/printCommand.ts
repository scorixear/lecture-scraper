import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CacheType, ChatInputCommandInteraction } from 'discord.js';
import { CommandInteractionModel, MessageHandler } from 'discord.ts-architecture';
import { Module } from '../model/Module';
import LanguageHandler from '../handlers/languageHandler';
import { LectureType } from '../model/LectureType';

export default class PrintCommand extends CommandInteractionModel {
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
    let module: Module | undefined = undefined;
    if (module_id) {
      module = await sqlHandler.getModuleFromId(module_id);
    }
    if (!module) {
      await MessageHandler.replyError({
        interaction,
        title: LanguageHandler.language.commands.print.error.title,
        description: LanguageHandler.language.commands.print.error.not_set,
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId('set-module')
              .setLabel(LanguageHandler.language.commands.print.buttons.set_channel)
              .setStyle(ButtonStyle.Primary)
          )
        ]
      });
      return;
    }
    const lectureCategories: { title: string; text: string; inline: boolean }[] = [];
    let lastCategory: LectureType | undefined = undefined;
    module.lectures.forEach((lecture) => {
      let inline = true;
      if (lastCategory !== lecture.type) {
        lastCategory = lecture.type;
        inline = false;
      }
      lectureCategories.push({
        title: lecture.type + (lecture.group ? ', ' + lecture.group : ''),
        text: LanguageHandler.replaceArgs(LanguageHandler.language.commands.print.success.lecture, [
          lecture.time ?? '',
          lecture.day,
          lecture.place
        ]),
        inline: inline
      });
    });

    await MessageHandler.reply({
      interaction,
      title: module.displayName,
      description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.print.success.date, [
        module.date.toDateString()
      ]),
      color: 0x2f3136,
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

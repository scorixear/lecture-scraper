import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  SlashCommandBooleanOption,
  SlashCommandStringOption
} from 'discord.js';
import { CommandInteractionModel, Logger, MessageHandler, WARNINGLEVEL } from 'discord.ts-architecture';
import { WebScraper } from '../handlers/webScraper';
import config from '../config';
import LanguageHandler from '../handlers/languageHandler';
import { sqlClient } from '../handlers/sqlHandler';
import { Lecture, Lecturer, Module } from '@prisma/client';

declare const webScraper: WebScraper;

export default class CaptureCommand extends CommandInteractionModel {
  constructor() {
    const commandOptions: any[] = [
      new SlashCommandStringOption()
        .setName('semester')
        .setDescription(LanguageHandler.language.commands.capture.options.semester)
        .addChoices({ name: 'ss2023', value: 'ss2023' })
        .setRequired(true),
      new SlashCommandBooleanOption()
        .setName('force')
        .setDescription(LanguageHandler.language.commands.capture.options.force)
        .setRequired(false)
    ];
    super(
      'capture',
      LanguageHandler.replaceArgs(LanguageHandler.language.commands.capture.description, [config.botPrefix]),
      'capture [force: true]',
      'Moderation',
      'capture',
      commandOptions
    );
  }

  override async handle(interaction: ChatInputCommandInteraction) {
    try {
      await super.handle(interaction);
    } catch (e) {
      return;
    }

    const semester = interaction.options.getString('semester', true);
    const force = interaction.options.getBoolean('force', false);
    const semesterDate = await sqlClient.getSemesterDate(semester);
    if (!force) {
      if (semesterDate) {
        await MessageHandler.replyError({
          interaction,
          title: LanguageHandler.language.commands.capture.error.title,
          description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.capture.error.already_existent, [
            semester,
            semesterDate.toDateString()
          ]),
          components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId('force-reset_' + semester)
                .setLabel(LanguageHandler.language.commands.capture.buttons.force_reset)
                .setStyle(ButtonStyle.Primary)
            )
          ]
        });
        return;
      }
    }
    await MessageHandler.reply({
      interaction,
      title: LanguageHandler.language.commands.capture.success.start_title,
      description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.capture.success.start_description, [
        semester
      ]),
      color: 0xffd500,
      ephemeral: true
    });
    let modules: (Module & { lectures: Lecture[]; lecturers: Lecturer[] })[] | undefined;
    try {
      modules = await webScraper.scrapeLectures(config.websiteUrl, semester);
      if (!modules) throw new Error('WebScraper returned undefined');
      modules = CaptureCommand.uniq_fast(modules);
      await sqlClient.setModules(modules);
    } catch (e) {
      Logger.exception('Webscraper failed', e, WARNINGLEVEL.ERROR, semester);
      await MessageHandler.followUp({
        interaction,
        title: LanguageHandler.language.commands.capture.error.title,
        description: LanguageHandler.language.commands.capture.error.failed,
        ephemeral: true
      });
      return;
    }
    await MessageHandler.followUp({
      interaction,
      title: LanguageHandler.language.commands.capture.success.title,
      description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.capture.success.description, [
        modules?.length.toString() ?? '0'
      ]),
      ephemeral: true
    });
  }

  public static uniq_fast<T extends { uni_id: string }>(a: T[]): T[] {
    const seen = new Map<string, number>();
    const out: T[] = [];
    const len = a.length;
    let j = 0;
    for (let i = 0; i < len; i++) {
      const item = a[i];
      if (seen.get(item.uni_id) !== 1) {
        seen.set(item.uni_id, 1);
        out[j++] = item;
      }
    }
    return out;
  }
}

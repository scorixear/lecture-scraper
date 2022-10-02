import { ButtonInteraction, CacheType } from 'discord.js';
import { ButtonInteractionModel, Logger, MessageHandler, WARNINGLEVEL } from 'discord.ts-architecture';
import { Module } from '../model/Module';
import config from '../config';
import LanguageHandler from '../handlers/languageHandler';
import { WebScraper } from '../handlers/webScraper';

declare const webScraper: WebScraper;

export default class ForceReset extends ButtonInteractionModel {
  constructor() {
    super('force-reset', undefined, true);
  }

  override async handle(interaction: ButtonInteraction<CacheType>): Promise<void> {
    try {
      await super.handle(interaction);
    } catch (error) {
      return;
    }
    const semester = interaction.customId.split('_')[1];
    let modules: Module[] | undefined;
    try {
      modules = await webScraper.scrapeLectures(LanguageHandler.replaceArgs(config.websiteUrl, [semester]));
      if (!modules) throw new Error('WebScraper returned undefined');
      await sqlHandler.setModules(semester, modules);
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
}

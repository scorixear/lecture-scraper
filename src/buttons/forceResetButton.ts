import { ButtonInteraction, CacheType } from 'discord.js';
import { ButtonInteractionModel, Logger, MessageHandler, WARNINGLEVEL } from 'discord.ts-architecture';
import { Module } from '../model/Module';
import config from '../config';
import LanguageHandler from '../handlers/languageHandler';
import { WebScraper } from '../handlers/webScraper';
import CaptureCommand from '../commands/captureCommand';

declare const webScraper: WebScraper;

export default class ForceResetButton extends ButtonInteractionModel {
  constructor(id: string) {
    super(id);
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
      modules = await webScraper.scrapeLectures(config.websiteUrl, semester);
      if (!modules) throw new Error('WebScraper returned undefined');
      modules = CaptureCommand.uniq_fast(modules);
      await sqlHandler.setModules(modules);
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

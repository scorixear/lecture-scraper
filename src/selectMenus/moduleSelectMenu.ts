import { SelectMenuInteraction, CacheType } from 'discord.js';
import { SelectMenuInteractionModel } from 'discord.ts-architecture/lib/model/SelectMenuInteractionModel';
import { sqlClient } from '../handlers/sqlHandler';
import { MessageHandler } from 'discord.ts-architecture';
import LanguageHandler from '../handlers/languageHandler';

export default class ModuleSelectMenu extends SelectMenuInteractionModel {
  constructor(id: string) {
    super(id);
  }

  override async handle(interaction: SelectMenuInteraction<CacheType>): Promise<void> {
    await interaction.deferUpdate();
    const module = interaction.values[0];
    const success = await sqlClient.setChannel(interaction.channelId, module);
    if (!success) {
      await MessageHandler.replyError({
        interaction,
        title: LanguageHandler.language.selectionMenu.setModule.error.title,
        description: LanguageHandler.language.commands.setModule.error.internal
      });
      return;
    }
    await MessageHandler.reply({
      interaction,
      title: LanguageHandler.language.selectionMenu.setModule.success.title,
      description: LanguageHandler.replaceArgs(LanguageHandler.language.selectionMenu.setModule.success.description, [
        module
      ]),
      ephemeral: true
    });
  }
}

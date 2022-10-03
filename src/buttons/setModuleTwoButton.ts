import { ButtonInteraction, CacheType } from 'discord.js';
import { ButtonInteractionModel, MessageHandler } from 'discord.ts-architecture';
import LanguageHandler from '../handlers/languageHandler';
import SetModuleButton from './setModuleButton';

export default class SetModuleTwoButton extends ButtonInteractionModel {
  constructor(id: string) {
    super(id);
  }

  override async handle(interaction: ButtonInteraction<CacheType>): Promise<void> {
    try {
      super.handle(interaction);
    } catch {
      return;
    }

    const selection = SetModuleButton.selections.get(interaction.message.channelId)?.get(interaction.message.id);
    if (!selection || !selection[0] || !selection[1]) {
      await interaction.reply({
        content: LanguageHandler.language.buttons.setModuleTwo.error.not_set,
        ephemeral: true
      });
      return;
    }
    const success = await sqlHandler.setChannel(interaction.channelId, selection[1], selection[0]);
    if (!success) {
      await MessageHandler.replyError({
        interaction,
        title: LanguageHandler.language.buttons.setModuleTwo.error.title,
        description: LanguageHandler.language.commands.setModule.error.internal
      });
      return;
    }
    await MessageHandler.reply({
      interaction,
      title: LanguageHandler.language.buttons.setModuleTwo.success.title,
      description: LanguageHandler.replaceArgs(LanguageHandler.language.buttons.setModuleTwo.success.description, [
        selection[0],
        selection[1]
      ]),
      ephemeral: true
    });
    SetModuleButton.selections.get(interaction.message.channelId)?.delete(interaction.message.id);
    if (SetModuleButton.selections.get(interaction.message.channelId)?.size ?? 0 == 0) {
      SetModuleButton.selections.delete(interaction.message.channelId);
    }
  }
}

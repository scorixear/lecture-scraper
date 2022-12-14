import { ButtonInteraction, CacheType } from 'discord.js';
import { ButtonInteractionModel, MessageHandler } from 'discord.ts-architecture';
import { sqlClient } from '../handlers/sqlHandler';
import LanguageHandler from '../handlers/languageHandler';

export default class RetryChannelButton extends ButtonInteractionModel {
  constructor(id: string) {
    super(id);
  }

  override async handle(interaction: ButtonInteraction<CacheType>): Promise<void> {
    try {
      super.handle(interaction);
    } catch {
      return;
    }

    const uni_id = interaction.customId.split('_')[1];

    const success = await sqlClient.setChannel(interaction.channelId, uni_id);
    if (!success) {
      await MessageHandler.replyError({
        interaction,
        title: LanguageHandler.language.commands.setModule.error.title,
        description: LanguageHandler.language.commands.setModule.error.internal
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

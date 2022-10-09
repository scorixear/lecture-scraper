import { ActionRowBuilder, ButtonInteraction, CacheType, SelectMenuBuilder, SelectMenuOptionBuilder } from 'discord.js';
import { ButtonInteractionModel, MessageHandler } from 'discord.ts-architecture';
import { sqlClient } from '../handlers/sqlHandler';
import LanguageHandler from '../handlers/languageHandler';

export default class SetModuleButton extends ButtonInteractionModel {
  constructor(id: string) {
    super(id);
  }

  override async handle(interaction: ButtonInteraction<CacheType>): Promise<void> {
    try {
      super.handle(interaction);
    } catch {
      return;
    }
    const modules = (await sqlClient.getModuleNameAndUniIds())?.map((m) => {
      return new SelectMenuOptionBuilder().setLabel(m.name ?? '').setValue(m.uni_id);
    });
    await MessageHandler.reply({
      interaction,
      title: LanguageHandler.language.buttons.setModule.title,
      description: LanguageHandler.language.buttons.setModule.description,
      components: [
        new ActionRowBuilder<SelectMenuBuilder>().addComponents(
          new SelectMenuBuilder()
            .setCustomId('module')
            .setPlaceholder(LanguageHandler.language.buttons.setModule.module_placeholder)
            .addOptions(modules ?? [])
        )
      ],
      ephemeral: true
    });
  }
}

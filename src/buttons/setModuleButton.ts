import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  CacheType,
  SelectMenuBuilder,
  SelectMenuOptionBuilder
} from 'discord.js';
import { ButtonInteractionModel, MessageHandler } from 'discord.ts-architecture';
import LanguageHandler from '../handlers/languageHandler';

export default class SetModuleButton extends ButtonInteractionModel {
  public static selections: Map<[string, string], [string | undefined, string | undefined]>;
  constructor(id: string) {
    super(id);
  }

  override async handle(interaction: ButtonInteraction<CacheType>): Promise<void> {
    try {
      super.handle(interaction);
    } catch {
      return;
    }
    const semester = (await sqlHandler.getSemesters()).map((s) => {
      return new SelectMenuOptionBuilder().setLabel(s).setValue(s);
    });
    const modules = (await sqlHandler.getModuleNameAndUniId()).map((m) => {
      return new SelectMenuOptionBuilder().setLabel(m.name).setValue(m.uni_id);
    });
    await MessageHandler.reply({
      interaction,
      title: LanguageHandler.language.buttons.setModule.title,
      description: LanguageHandler.language.buttons.setModule.description,
      components: [
        new ActionRowBuilder<SelectMenuBuilder>().addComponents(
          new SelectMenuBuilder()
            .setCustomId('semester')
            .setPlaceholder(LanguageHandler.language.buttons.setModule.semester_placeholder)
            .addOptions(semester)
        ),
        new ActionRowBuilder<SelectMenuBuilder>().addComponents(
          new SelectMenuBuilder()
            .setCustomId('module')
            .setPlaceholder(LanguageHandler.language.buttons.setModule.module_placeholder)
            .addOptions(modules)
        ),
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('set-module-two')
            .setLabel(LanguageHandler.language.buttons.setModule.set_module)
            .setStyle(ButtonStyle.Success)
        )
      ]
    });
  }
}

import {
  AutocompleteInteraction,
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandRoleOption,
  SlashCommandStringOption
} from 'discord.js';
import { AutocompleteInteractionModel, MessageHandler } from 'discord.ts-architecture';
import LanguageHandler from '../handlers/languageHandler';

export default class LinkRoleCommand extends AutocompleteInteractionModel {
  constructor() {
    super(
      'linkrole',
      LanguageHandler.language.commands.linkrole.description,
      'linkrole role:@Moderation module:10-101-101-11',
      'Moderation',
      'linkrole <role> <module>',
      [
        new SlashCommandRoleOption()
          .setName('role')
          .setDescription(LanguageHandler.language.commands.linkrole.options.role)
          .setRequired(true),
        new SlashCommandStringOption()
          .setName('module')
          .setDescription(LanguageHandler.language.commands.linkrole.options.module)
          .setAutocomplete(true)
          .setRequired(true)
      ]
    );
  }

  override async handleAutocomplete(interaction: AutocompleteInteraction<CacheType>): Promise<void> {
    const focused = interaction.options.getFocused();
    const modules = await sqlHandler.getModuleNameAndUniId();
    interaction.respond(
      modules
        .filter((m) => m.uni_id.toLowerCase().startsWith(focused.toLowerCase()))
        .map((m) => ({
          name: m.name,
          value: m.uni_id
        }))
    );
  }

  override async handle(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    try {
      super.handle(interaction);
    } catch {
      return;
    }

    const role = interaction.options.getRole('role', true);
    const module = interaction.options.getString('module', true);
    await sqlHandler.setRole(role.id, module);

    await MessageHandler.reply({
      interaction,
      title: LanguageHandler.language.commands.linkrole.success.title,
      description: LanguageHandler.replaceArgs(LanguageHandler.language.commands.linkrole.success.description, [
        role.id,
        module
      ]),
      ephemeral: true
    });
  }
}

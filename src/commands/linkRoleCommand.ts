import {
  AutocompleteInteraction,
  CacheType,
  ChatInputCommandInteraction,
  SlashCommandRoleOption,
  SlashCommandStringOption
} from 'discord.js';
import { AutocompleteInteractionModel, MessageHandler } from 'discord.ts-architecture';
import { sqlClient } from '../handlers/sqlHandler';
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
    const modules = await sqlClient.getModuleNameAndUniIds();

    const selection =
      modules
        ?.filter(
          (m) =>
            m.uni_id.toLowerCase().startsWith(focused.toLowerCase()) ||
            (m.name?.toLowerCase().startsWith(focused.toLowerCase()) ?? false)
        )
        ?.map((m) => ({ value: m.uni_id, name: m.name ?? '' })) ?? [];

    if (selection.length > 25) {
      interaction.respond(selection.splice(25));
    } else {
      interaction.respond(selection);
    }
  }

  override async handle(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    try {
      super.handle(interaction);
    } catch {
      return;
    }

    const role = interaction.options.getRole('role', true);
    const module = interaction.options.getString('module', true);
    await sqlClient.setRole({ role_id: role.id, uni_id: module });

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

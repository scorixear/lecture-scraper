import { SelectMenuInteraction, CacheType } from 'discord.js';
import { SelectMenuInteractionModel } from 'discord.ts-architecture/lib/model/SelectMenuInteractionModel';
import SetModuleButton from '../buttons/setModuleButton';

export default class ModuleSelectMenu extends SelectMenuInteractionModel {
  constructor(id: string) {
    super(id);
  }

  override async handle(interaction: SelectMenuInteraction<CacheType>): Promise<void> {
    await interaction.deferUpdate();
    const module = interaction.values[0];
    const current = SetModuleButton.selections.get(interaction.message.channelId)?.get(interaction.message.id);

    if (current) {
      current[1] = module;
      SetModuleButton.selections.get(interaction.message.channelId)?.set(interaction.message.id, current);
    } else {
      SetModuleButton.selections.set(
        interaction.message.channelId,
        new Map([[interaction.message.id, [undefined, module]]])
      );
    }
  }
}

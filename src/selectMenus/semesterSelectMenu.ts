import { SelectMenuInteraction, CacheType } from 'discord.js';
import { SelectMenuInteractionModel } from 'discord.ts-architecture/lib/model/SelectMenuInteractionModel';
import SetModuleButton from '../buttons/setModuleButton';

export default class SemesterSelectMenu extends SelectMenuInteractionModel {
  constructor(id: string) {
    super(id);
  }

  override async handle(interaction: SelectMenuInteraction<CacheType>): Promise<void> {
    await interaction.deferUpdate();
    const semester = interaction.values[0];
    const current = SetModuleButton.selections.get([interaction.message.channelId, interaction.message.id]);

    if (current) {
      current[0] = semester;
      SetModuleButton.selections.set([interaction.message.channelId, interaction.message.id], current);
    } else {
      SetModuleButton.selections.set([interaction.message.channelId, interaction.message.id], [semester, undefined]);
    }
  }
}

import { WizardContext } from "../types";

export abstract class BaseSelectionHandler {
  constructor(
    protected readonly maxItems: number,
    protected readonly maxItemsMessage: string,
    protected readonly promptMessage: string
  ) {}

  abstract promptForSelection(ctx: WizardContext): Promise<void>;

  protected handleSelection(
    ctx: WizardContext,
    selectedItems: string[],
    item: string
  ): boolean {
    if (selectedItems.includes(item)) {
      return this.removeItem(selectedItems, item);
    }

    if (selectedItems.length >= this.maxItems) {
      ctx.answerCbQuery(this.maxItemsMessage);
      return false;
    }

    selectedItems.push(item);
    return true;
  }

  private removeItem(selectedItems: string[], item: string): boolean {
    const index = selectedItems.indexOf(item);
    if (index > -1) {
      selectedItems.splice(index, 1);
    }
    return true;
  }
}

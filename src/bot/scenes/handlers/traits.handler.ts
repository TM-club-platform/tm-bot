import { Injectable } from "@nestjs/common";
import { BaseSelectionHandler } from "./base-selection.handler";
import { WizardContext } from "../types";
import { WIZARD_CONSTANTS } from "../constants";
import { createInlineKeyboard } from "../lib";
import { traits } from "../checkboxes";

@Injectable()
export class TraitsHandler extends BaseSelectionHandler {
  constructor() {
    super(
      WIZARD_CONSTANTS.MAX_TRAITS,
      WIZARD_CONSTANTS.MESSAGES.MAX_TRAITS_REACHED,
      `Какой ты человек? Можно выбрать максимум ${WIZARD_CONSTANTS.MAX_TRAITS} вайба`
    );
  }

  async promptForSelection(ctx: WizardContext): Promise<void> {
    const keyboard = createInlineKeyboard(
      ctx.session.selectedTraits,
      traits,
      WIZARD_CONSTANTS.BUTTONS.DONE_TRAITS
    );
    await ctx.reply(this.promptMessage, keyboard);
  }

  async handleTraitSelection(
    ctx: WizardContext & { match: RegExpExecArray }
  ): Promise<boolean> {
    const trait = ctx.match[1];
    const success = this.handleSelection(
      ctx,
      ctx.session.selectedTraits,
      "trait-" + trait
    );

    if (success) {
      const keyboard = createInlineKeyboard(
        ctx.session.selectedTraits,
        traits,
        WIZARD_CONSTANTS.BUTTONS.DONE_TRAITS
      );
      await ctx.editMessageReplyMarkup(keyboard.reply_markup);
    }

    return success;
  }

  async handleDoneTraits(ctx: WizardContext): Promise<boolean> {
    if (ctx.session.selectedTraits.length === 0) {
      await ctx.reply(WIZARD_CONSTANTS.MESSAGES.NO_TRAITS_SELECTED);
      return false;
    }

    ctx.wizard.state.userData.traits = ctx.session.selectedTraits;
    return true;
  }
}

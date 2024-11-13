import { Injectable } from "@nestjs/common";
import { BaseSelectionHandler } from "./base-selection.handler";
import { SelectionContext, WizardContext } from "../types";
import { WIZARD_CONSTANTS } from "../constants";
import { createInlineKeyboard } from "../lib";
import { hobbies } from "../checkboxes";

@Injectable()
export class HobbiesHandler extends BaseSelectionHandler {
  constructor() {
    super(
      WIZARD_CONSTANTS.MAX_HOBBIES,
      WIZARD_CONSTANTS.MESSAGES.MAX_HOBBIES_REACHED,
      `Какие у тебя увлечения? Можно выбрать максимум ${WIZARD_CONSTANTS.MAX_HOBBIES} хобби`
    );
  }

  async promptForSelection(ctx: WizardContext): Promise<void> {
    const keyboard = createInlineKeyboard(
      ctx.session.selectedHobbies,
      hobbies,
      WIZARD_CONSTANTS.BUTTONS.DONE_HOBBIES
    );
    await ctx.reply(this.promptMessage, keyboard);
  }

  async handleHobbySelection(ctx: SelectionContext): Promise<boolean> {
    const hobby = ctx.match[1];
    const success = this.handleSelection(
      ctx,
      ctx.session.selectedHobbies,
      "hobby-" + hobby
    );

    if (success) {
      const keyboard = createInlineKeyboard(
        ctx.session.selectedHobbies,
        hobbies,
        WIZARD_CONSTANTS.BUTTONS.DONE_HOBBIES
      );
      await ctx.editMessageReplyMarkup(keyboard.reply_markup);
    }

    return success;
  }

  async handleDoneHobbies(ctx: WizardContext): Promise<boolean> {
    if (ctx.session.selectedHobbies.length === 0) {
      await ctx.reply(WIZARD_CONSTANTS.MESSAGES.NO_HOBBIES_SELECTED);
      return false;
    }

    ctx.wizard.state.userData.hobbies = ctx.session.selectedHobbies;
    return true;
  }
}

import { Injectable } from "@nestjs/common";
import { BaseSelectionHandler } from "./base-selection.handler";
import { SelectionContext, WizardContext } from "../types";
import { WIZARD_CONSTANTS } from "../constants";
import { createInlineKeyboard } from "../lib";
import { topics } from "../checkboxes";

@Injectable()
export class TopicsHandler extends BaseSelectionHandler {
  constructor() {
    super(
      WIZARD_CONSTANTS.MAX_TOPICS,
      WIZARD_CONSTANTS.MESSAGES.MAX_TOPICS_REACHED,
      `Какие темы тебе интересны? Можно выбрать максимум ${WIZARD_CONSTANTS.MAX_TOPICS} тем`
    );
  }

  async promptForSelection(ctx: WizardContext): Promise<void> {
    const keyboard = createInlineKeyboard(
      ctx.session.selectedTopics,
      topics,
      WIZARD_CONSTANTS.BUTTONS.DONE
    );
    await ctx.reply(this.promptMessage, keyboard);
  }

  async handleTopicSelection(ctx: SelectionContext): Promise<boolean> {
    const topic = ctx.match[1];
    const success = this.handleSelection(
      ctx,
      ctx.session.selectedTopics,
      "topic-" + topic
    );

    if (success) {
      const keyboard = createInlineKeyboard(
        ctx.session.selectedTopics,
        topics,
        WIZARD_CONSTANTS.BUTTONS.DONE
      );
      await ctx.editMessageReplyMarkup(keyboard.reply_markup);
    }

    return success;
  }

  async handleDoneTopics(ctx: WizardContext): Promise<boolean> {
    if (ctx.session.selectedTopics.length === 0) {
      await ctx.reply(WIZARD_CONSTANTS.MESSAGES.NO_TOPICS_SELECTED);
      return false;
    }

    ctx.wizard.state.userData.topics = ctx.session.selectedTopics;
    return true;
  }
}

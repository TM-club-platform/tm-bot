import { Injectable } from "@nestjs/common";
import { BaseSelectionHandler } from "./base-selection.handler";
import { WizardContext } from "../types";

@Injectable()
export class TextAnketaHandler extends BaseSelectionHandler {
  async promptForSelection(ctx: WizardContext): Promise<void> {
    await this.promptForDescription(ctx);
  }

  async promptForDescription(ctx: WizardContext): Promise<void> {
    await ctx.reply(
      "А теперь самое время написать объявление и рассказать своим тревел-мейтам, что ты здесь ищешь, чтобы синхронизироваться по желаниям и ожиданиям 😊"
    );

    await ctx.replyWithPhoto({ source: "assets/what_write_in_anketa.jpeg" });

    await ctx.reply("Что ты здесь ищешь?");
  }

  async handleDescription(ctx: WizardContext): Promise<boolean> {
    if (!("text" in ctx.message) || typeof ctx.message.text !== "string") {
      await ctx.reply("Пожалуйста, отправьте текстовое сообщение");
      return false;
    }

    ctx.wizard.state.userData.description = ctx.message.text;
    return true;
  }
}

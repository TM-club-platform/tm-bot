import { Injectable } from "@nestjs/common";
import { WizardContext } from "../types";
import { WIZARD_CONSTANTS } from "../constants";

@Injectable()
export class NameStepHandler {
  async handle(ctx: WizardContext): Promise<boolean> {
    if (!this.hasValidTextMessage(ctx)) {
      await ctx.reply("Пожалуйста, введите ваше имя текстом");
      return false;
    }

    const name = ctx.message.text.trim();
    if (!this.isValidName(name)) {
      await ctx.reply("Пожалуйста, введите корректное имя");
      return false;
    }

    ctx.wizard.state.userData.name = name;
    await ctx.reply(`Приятно познакомиться, ${name}! Сколько тебе лет?`);

    return true;
  }

  private isValidName(name: string): boolean {
    return name.length > 1 && name.length < 50;
  }

  private hasValidTextMessage(
    ctx: WizardContext
  ): ctx is WizardContext & { message: { text: string } } {
    return "text" in ctx.message && typeof ctx.message.text === "string";
  }
}

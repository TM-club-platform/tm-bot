import { Injectable } from "@nestjs/common";
import { WizardContext } from "../types";
import { WIZARD_CONSTANTS } from "../constants";

@Injectable()
export class AgeStepHandler {
  async handle(ctx: WizardContext): Promise<boolean> {
    if (!this.hasValidTextMessage(ctx)) {
      await ctx.reply(WIZARD_CONSTANTS.MESSAGES.INVALID_AGE);
      return false;
    }

    const age = this.parseAge(ctx.message.text);
    if (!this.isValidAge(age)) {
      await ctx.reply(WIZARD_CONSTANTS.MESSAGES.INVALID_AGE);
      return false;
    }

    ctx.wizard.state.userData.age = age;
    return true;
  }

  private parseAge(text: string): number | null {
    const age = parseInt(text.trim());
    return isNaN(age) ? null : age;
  }

  private isValidAge(age: number | null): age is number {
    return age !== null && age >= 13 && age <= 100;
  }

  private hasValidTextMessage(
    ctx: WizardContext
  ): ctx is WizardContext & { message: { text: string } } {
    return "text" in ctx.message && typeof ctx.message.text === "string";
  }
}

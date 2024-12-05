//@ts-nocheck
import { Injectable } from "@nestjs/common";
import { WizardContext } from "../types";
import { InlineQueryResult } from "telegraf/typings/core/types/typegram";
import { COUNTRIES } from "../constants";

@Injectable()
export class CountriesHandler {
  COUNTRIES = COUNTRIES;

  async handleInlineQuery(ctx: WizardContext): Promise<void> {
    if (!ctx.inlineQuery) return;

    const query = ctx.inlineQuery.query.toLowerCase();
    const results = this.COUNTRIES.filter(
      (country) =>
        country.name.toLowerCase().includes(query) ||
        country.code.toLowerCase().includes(query)
    )
      .slice(0, 10)
      .map((country) => ({
        type: "article" as const,
        id: country.code,
        title: `${country.emoji} ${country.name}`,
        description: country.name,
        input_message_content: {
          message_text: `${country.emoji} ${country.name}`,
        },
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `Выбрать ${country.name}`,
                callback_data: `SELECT_${country.code}`,
              },
            ],
          ],
        },
      }));

    await ctx.answerInlineQuery(results);
  }

  async handleCountryCallback(
    ctx: WizardContext & { callbackQuery: { data: string } }
  ): Promise<boolean> {
    const countryCode = ctx.callbackQuery.data.replace("SELECT_", "");
    const country = this.COUNTRIES.find((c) => c.code === countryCode);

    if (!country) {
      await ctx.answerCbQuery("Страна не найдена");
      return false;
    }

    ctx.wizard.state.userData.countries = `${country.emoji} ${country.name}`;
    await ctx.answerCbQuery();
    await ctx.editMessageText(`Вы выбрали: ${country.emoji} ${country.name}`);
    return true;
  }

  async handleCountrySelection(ctx: WizardContext): Promise<boolean> {
    if (!this.hasValidTextMessage(ctx)) {
      await ctx.reply("Пожалуйста, выберите страну из списка");
      return false;
    }

    ctx.wizard.state.userData.countries = ctx.message.text;
    return true;
  }

  private hasValidTextMessage(
    ctx: WizardContext
  ): ctx is WizardContext & { message: { text: string } } {
    return "text" in ctx.message && typeof ctx.message.text === "string";
  }
}

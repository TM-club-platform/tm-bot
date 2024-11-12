import {
  Start,
  Update,
  Ctx,
  On,
  Action,
  Wizard,
  WizardStep,
  InjectBot,
} from "nestjs-telegraf";
import { Context, Markup, Telegraf } from "telegraf";
import { BotService } from "../bot.service";
import { Injectable } from "@nestjs/common";
import { CallbackQuery } from "telegraf/typings/core/types/typegram";
import { SceneSessionData } from "telegraf/typings/scenes";

interface MyContext extends Context {
  session?: SceneSessionData;
}

interface WizardContext extends Context {
  scene: any;
  wizard: {
    next: () => Promise<void>;
    state: {
      userData: {
        name?: string;
        age?: number;
        occupation?: string;
        traits: string[];
      };
    };
  };
}

// function createInlineKeyboard(selectedTraits: string[]) {
//   const options = [
//     "😄 Экстраверт",
//     "🧐 Интроверт",
//     "✅ Душнила",
//     "👿 Токсик",
//     "🌌 Атеист",
//     "🕊️ Религиозный",
//     "💥 Спонтанный",
//     "⏰ Организованный",
//   ];
//   const buttons = options.map((option) => [
//     Markup.button.callback(
//       (selectedTraits.includes(option) ? "✔️ " : "") + option,
//       `toggle_${option}`
//     ),
//   ]);
//   buttons.push([Markup.button.callback("Готово!", "done")]);
//   return Markup.inlineKeyboard(buttons, { columns: 2 });
// }

@Update()
@Injectable()
@Wizard("registration-wizard")
export class RegistrationScene {
  constructor(
    private readonly botService: BotService,
    @InjectBot() private bot: Telegraf<any>
  ) {}

  @WizardStep(1)
  async startWizard(ctx: WizardContext) {
    ctx.wizard.state.userData = { traits: [] };
    //@ts-ignore
    console.log(ctx?.session);
    await ctx.reply(
      "Отлично, ответь на следующие вопросы:\nКак тебя зовут?",
      Markup.forceReply()
    );
    ctx.wizard.next();
  }

  @WizardStep(2)
  async getName(ctx: WizardContext) {
    if ("text" in ctx.message && ctx.message.text) {
      ctx.wizard.state.userData.name = ctx.message.text;
      await ctx.reply(
        `Приятно познакомиться, ${ctx.message.text}! Сколько тебе лет?`,
        Markup.forceReply()
      );
      ctx.wizard.next();
    }
    return;
  }

  @WizardStep(3)
  async getAge(ctx: WizardContext) {
    if ("text" in ctx.message && ctx.message.text) {
      const age = parseInt(ctx.message.text);
      if (isNaN(age)) {
        return await ctx.reply(
          "Пожалуйста, введите корректный возраст цифрами"
        );
      }

      ctx.wizard.state.userData.age = age;
      await ctx.reply(
        "Кем ты работаешь / чем занимаешься?\n" +
          "Можно использовать текст длиной до 80 символов."
      );
      ctx.wizard.next();
    }
    return;
  }

  //   @WizardStep(4)
  //   async getOccupation(ctx: WizardContext) {
  //     if ("text" in ctx.message && ctx.message.text) {
  //       ctx.wizard.state.userData.occupation = ctx.message.text;
  //       await ctx.reply(
  //         "Какой ты человек? Можно выбрать максимум 4 вайба",
  //         Markup.inlineKeyboard([
  //           [Markup.button.callback("😄 Экстраверт", "trait_extrovert")],
  //           [Markup.button.callback("🧐 Интроверт", "trait_introvert")],
  //           [Markup.button.callback("✅ Душнила", "trait_annoying")],
  //           [Markup.button.callback("👿 Токсик", "trait_toxic")],
  //         ])
  //       );
  //       return await ctx.scene.leave();
  //     }
  //     return;
  //   }
  //   @WizardStep(5)
  //   async getTraits(ctx: WizardContext) {

  //     if ("text" in ctx.message && ctx.message.text) {
  //       ctx.wizard.state.userData.occupation = ctx.message.text;
  //       await ctx.reply(
  //         "О чем тебе интересно поговорить? Можно выбрать максимум 4 темы",
  //         Markup.inlineKeyboard([
  //           [Markup.button.callback("😄 Крипта", "trait_extrovert")],
  //           [Markup.button.callback("🧐 не крипта", "trait_introvert")],
  //         ])
  //       );
  //       return await ctx.scene.leave();
  //     }
  //     return;
  //   }

  //   @WizardStep(4)
  //   async start(@Ctx() ctx: WizardContext) {
  //     ctx.wizard.state.userData.traits = []; // Initialize the selected traits array
  //     await ctx.reply(
  //       "Какой ты человек? Можно выбрать максимум 4 вайба",
  //       createInlineKeyboard(ctx.session.selectedTraits)
  //     );
  //     return ctx.wizard.next(); // Move to the next step to handle interactions
  //   }

  //   @WizardStep(4)
  //   @Action(/toggle_(.+)/)
  //   async handleSelection(@Ctx() ctx: MyContext) {
  //     const trait = ctx.match[1]; // Extract the trait from callback data

  //     // Toggle the trait in the session state
  //     if (ctx.session.selectedTraits.includes(trait)) {
  //       ctx.session.selectedTraits = ctx.session.selectedTraits.filter(
  //         (item) => item !== trait
  //       );
  //     } else if (ctx.session.selectedTraits.length < 4) {
  //       ctx.session.selectedTraits.push(trait);
  //     } else {
  //       await ctx.answerCbQuery(
  //         "Достигнуто максимальное количество выбранных пунктов."
  //       );
  //       return;
  //     }

  //     // Update the keyboard with the new state
  //     await ctx.editMessageReplyMarkup(
  //       createInlineKeyboard(ctx.session.selectedTraits).reply_markup
  //     );
  //   }

  //   @WizardStep(4)
  //   @Action("done")
  //   async handleDone(@Ctx() ctx: Context) {
  //     if (!ctx.session.selectedTraits.length) {
  //       await ctx.reply("Вы не выбрали ни одного вайба.");
  //     } else {
  //       await ctx.reply(
  //         `Вы выбрали следующие вайбы: ${ctx.session.selectedTraits.join(", ")}`
  //       );
  //     }
  //     ctx.session.selectedTraits = []; // Reset the session
  //     return ctx.scene.leave(); // End the wizard
  //   }
}

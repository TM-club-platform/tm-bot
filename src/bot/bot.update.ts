import { Start, Update, Action, InjectBot, Wizard } from "nestjs-telegraf";
import { Context, Scenes, Telegraf } from "telegraf";
import { BotService } from "./bot.service";
import { WizardContext } from "telegraf/typings/scenes";
import { Injectable } from "@nestjs/common";

@Update()
@Injectable()
export class BotUpdate {
  constructor(
    private readonly botService: BotService,
    @InjectBot() private bot: Telegraf<Context>
  ) {}

  @Start()
  async startCommand(ctx: Context): Promise<void> {
    try {
      const user = ctx.from;

      // Check if user exists in database
      let existingUser = await this.botService.findUser(user.id);

      if (!existingUser) {
        existingUser = await this.botService.createOrUpdateUser({
          telegramId: user.id,
          name: user.first_name + " " + user.last_name,
        });
      }
      

      // Send welcome picture
      await ctx.replyWithPhoto({ source: "./assets/welcome.jpeg" });

      // Send information message
      await ctx.reply(
        "Как работает бот?\n\n" +
          "Каждую неделю тебе приходит метч с человеком, который подбирается на основе твоей локации, анкеты, интересов и объявления.\n\n" +
          "У тебя есть три дня, чтобы написать собеседнику, а затем — анкета сгорает.\n\n" +
          "Мы сделали ограничение по времени, чтобы здесь смогли встретиться люди, которые действительно заинтересованы в общении, открыты к новым знакомствам и эмоциям"
      );

      await ctx.replyWithPhoto(
        { source: "./assets/how_to_works.jpeg" },
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Заполнить анкету", callback_data: "fill_form" }],
            ],
          },
        }
      );
    } catch (error) {
      console.error("Error in start command:", error);
      await ctx.reply("Sorry, there was an error processing your request.");
    }
  }

  @Action("fill_form")
  async startWizard(ctx: WizardContext) {
    await ctx.scene.enter("registration-wizard");
  }
}

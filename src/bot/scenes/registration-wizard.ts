import {
  Update,
  Ctx,
  Action,
  Wizard,
  WizardStep,
  InjectBot,
  On,
} from "nestjs-telegraf";
import { Telegraf } from "telegraf";
import { BotService } from "../bot.service";
import { Injectable } from "@nestjs/common";
import { WIZARD_CONSTANTS } from "./constants";
import { AgeStepHandler } from "./handlers/age.handler";
import { NameStepHandler } from "./handlers/name.handler";
import { SelectionContext, WizardContext } from "./types";
import { TraitsHandler } from "./handlers/traits.handler";
import { HobbiesHandler } from "./handlers/hobbies.handler";
import { TopicsHandler } from "./handlers/topics.handler";
import { CountriesHandler } from "./handlers/countries.handler";
@Update()
@Injectable()
@Wizard("registration-wizard")
export class RegistrationScene {
  constructor(
    private readonly nameHandler: NameStepHandler,
    private readonly ageHandler: AgeStepHandler,
    private readonly traitsHandler: TraitsHandler,
    private readonly hobbiesHandler: HobbiesHandler,
    private readonly topicsHandler: TopicsHandler,
    private readonly countriesHandler: CountriesHandler,
    private readonly botService: BotService,
    @InjectBot() private bot: Telegraf<any>
  ) {}

  private initializeState(ctx: WizardContext) {
    ctx.wizard.state.userData = { 
      telegramId: ctx.from.id,
      traits: [], 
      hobbies: [], 
      topics: [] 
    };
    ctx.session.selectedTraits = [];
    ctx.session.selectedHobbies = [];
    ctx.session.selectedTopics = [];
  }

  @WizardStep(1)
  async startWizard(ctx: WizardContext) {
    this.initializeState(ctx);
    await ctx.reply(WIZARD_CONSTANTS.MESSAGES.START);
    ctx.wizard.next();
  }

  @WizardStep(2)
  async getName(ctx: WizardContext) {
    const success = await this.nameHandler.handle(ctx);
    if (success) {
      ctx.wizard.next();
    }
  }

  @WizardStep(3)
  async getAge(ctx: WizardContext) {
    const success = await this.ageHandler.handle(ctx);
    if (success) {
      await this.promptForOccupation(ctx);
      ctx.wizard.next();
    }
  }

  @WizardStep(4)
  async getOccupation(@Ctx() ctx: WizardContext) {
    if (!this.hasValidTextMessage(ctx)) return;
    ctx.wizard.state.userData.occupation = ctx.message.text;
    await this.traitsHandler.promptForSelection(ctx);
    ctx.wizard.next();
  }

  @WizardStep(5)
  @Action(/trait-(.+)/)
  async handleSelectionTraits(@Ctx() ctx: SelectionContext) {
    await this.traitsHandler.handleTraitSelection(ctx);
  }

  @WizardStep(6)
  @Action(WIZARD_CONSTANTS.BUTTONS.DONE_TRAITS.name)
  async handleDoneTraits(@Ctx() ctx: SelectionContext) {
    const success = await this.traitsHandler.handleDoneTraits(ctx);
    if (success) {
      await this.hobbiesHandler.promptForSelection(ctx);
      ctx.wizard.next();
    }
  }

  @WizardStep(7)
  @Action(/hobby-(.+)/)
  async handleSelectionHobbies(@Ctx() ctx: SelectionContext) {
    await this.hobbiesHandler.handleHobbySelection(ctx);
  }

  @WizardStep(8)
  @Action(WIZARD_CONSTANTS.BUTTONS.DONE_HOBBIES.name)
  async handleDoneHobbies(@Ctx() ctx: WizardContext) {
    const success = await this.hobbiesHandler.handleDoneHobbies(ctx);
    if (success) {
      await this.topicsHandler.promptForSelection(ctx);
      ctx.wizard.next();
    }
  }

  @WizardStep(9)
  @Action(/topic-(.+)/)
  async handleSelectionTopics(@Ctx() ctx: SelectionContext) {
    await this.topicsHandler.handleTopicSelection(ctx);
  }

  @WizardStep(10)
  @Action(WIZARD_CONSTANTS.BUTTONS.DONE.name)
  async handleDoneTopics(@Ctx() ctx: WizardContext) {
    const success = await this.topicsHandler.handleDoneTopics(ctx);
    if (success) {
      await this.promptForCountries(ctx);
      // @ts-ignore
      ctx.wizard.selectStep(10);
    }
  }

  @WizardStep(11)
  async chooseCountries(@Ctx() ctx: WizardContext) {
    if (!this.hasValidTextMessage(ctx)) return;
    ctx.wizard.state.userData.countries = ctx.message.text;
    await this.promptForInfo(ctx);
    ctx.wizard.next();
  }

  @WizardStep(12)
  async getInfo(@Ctx() ctx: WizardContext) {
    if (!this.hasValidTextMessage(ctx)) return;

    ctx.wizard.state.userData.instagram = ctx.message.text;

    try {
      await this.botService.createOrUpdateUser({
        telegramId: ctx.wizard.state.userData.telegramId,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
        username: ctx.from.username,
        name: ctx.wizard.state.userData.name,
        age: ctx.wizard.state.userData.age,
        occupation: ctx.wizard.state.userData.occupation,
        traits: ctx.wizard.state.userData.traits,
        hobbies: ctx.wizard.state.userData.hobbies,
        topics: ctx.wizard.state.userData.topics,
        countries: ctx.wizard.state.userData.countries,
        info: ctx.wizard.state.userData.info,
        instagram: ctx.wizard.state.userData.instagram,
      });

      await ctx.reply("Создаем твою анкету. Подожди несколько минут, чтобы произошла магия 🪄🔮");
      return ctx.scene.leave();
    } catch (error) {
      console.error("Error creating/updating user:", error);
      await ctx.reply("Произошла ошибка при создании анкеты. Пожалуйста, попробуйте позже.");
      return ctx.scene.leave();
    }
  }

  private hasValidTextMessage(
    ctx: WizardContext
  ): ctx is WizardContext & { message: { text: string } } {
    return "text" in ctx.message && typeof ctx.message.text === "string";
  }

  private async promptForOccupation(ctx: WizardContext) {
    await ctx.reply(
      `Кем ты работаешь / чем занимаешься?\n` +
        `Можно использовать текст длиной до ${WIZARD_CONSTANTS.MAX_OCCUPATION_LENGTH} символов.`
    );
  }

  private async promptForCountries(ctx: WizardContext) {
    await ctx.reply(
      `Готово! В каких странах ты мечтаешь побывать больше всего?`
    );
  }

  private async promptForInfo(ctx: WizardContext) {
    await ctx.reply(
      "Расскажи самое важное и интересное о себе в свободной форме. Можно использовать текст длиной до 284 символов.\n" +
        "Например:\n" +
        "Привет! Я Настя, диджитал-номад и сейчас живу на Бали. Больше всего люблю путешествовать, кататься на досках и толстеньких собак."
    );
  }

  private async promptForInstagram(ctx: WizardContext) {
    await ctx.reply(
      "Пришли ник своего инстаграма без ссылки и значка @.\n" +
        "Например: travelmate"
    );
  }
}

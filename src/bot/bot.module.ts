import { Module } from "@nestjs/common";
import { TelegrafModule } from "nestjs-telegraf";
import { BotUpdate } from "./bot.update";
import { BotService } from "./bot.service";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "./schemas/user.schema";
import { session } from "telegraf";
import { RegistrationScene } from "./scenes/registration-wizard";
import { TraitsHandler } from "./scenes/handlers/traits.handler";
import { AgeStepHandler } from "./scenes/handlers/age.handler";
import { NameStepHandler } from "./scenes/handlers/name.handler";
import { HobbiesHandler } from "./scenes/handlers/hobbies.handler";
import { TopicsHandler } from "./scenes/handlers/topics.handler";
import { CountriesHandler } from "./scenes/handlers/countries.handler";

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      useFactory: () => ({
        token: process.env.BOT_TOKEN,
        middlewares: [session()],
        // launchOptions: {
        //   dropPendingUpdates: true,
        //   polling: {
        //     timeout: 30,
        //     limit: 100,
        //     allowedUpdates: [], // Receive all update types
        //   },
        //   onError: (err) => {
        //     console.error("Telegram error:", err);
        //   },
        // },
      }),
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [
    BotUpdate,
    BotService,
    RegistrationScene,
    TraitsHandler,
    HobbiesHandler,
    TopicsHandler,
    AgeStepHandler,
    NameStepHandler,
    CountriesHandler,
  ],
})
export class BotModule {}

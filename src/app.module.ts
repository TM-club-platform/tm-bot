import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { TelegrafModule } from "nestjs-telegraf";
import { BotModule } from "./bot/bot.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI),
    // TelegrafModule.forRoot({
    //   token: process.env.BOT_TOKEN,
    // }),
    BotModule,
  ],
})
export class AppModule {}

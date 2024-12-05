import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { TelegrafModule } from "nestjs-telegraf";
import { BotModule } from "./bot/bot.module";
import { MatchingModule } from "./matching/matching.module";
import { ProfilePhotoModule } from "./profile-photo/profile-photo.module";
import { session } from "telegraf";
import { SheetsModule } from './sheets/sheets.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI),
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
    BotModule,
    MatchingModule,
    ProfilePhotoModule,
    SheetsModule,
  ],
})
export class AppModule {}

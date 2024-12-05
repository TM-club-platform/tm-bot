import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { getBotToken } from "nestjs-telegraf";
import { Telegraf } from "telegraf";
import "dotenv/config";

async function bootstrap() {
  console.log("MongoDB URI:", process.env.MONGODB_URI);
  const app = await NestFactory.create(AppModule);

  // Get bot instance
  const bot = app.get<Telegraf>(getBotToken());

  // Handle shutdown gracefully
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));

  await app.listen(3000);
}
bootstrap();

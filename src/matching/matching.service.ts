import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "../bot/schemas/user.schema";
import { InjectBot } from "nestjs-telegraf";
import { Telegraf } from "telegraf";

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectBot() private bot: Telegraf<any>
  ) {}

  @Cron("0 10 * * 1") // Every Monday at 10:00 MSK
  async handleParticipationCheck() {
    try {
      this.logger.log("Starting Monday participation check...");
      const users = await this.getUsersForParticipationCheck();
      for (const user of users) {
        await this.sendParticipationRequest(user);
      }
    } catch (error) {
      this.logger.error("Error in participation check:", error);
    }
  }

  @Cron("0 10 * * 3") // Every Wednesday at 10:00 MSK
  async handleFinalParticipationCheck() {
    try {
      this.logger.log("Starting Wednesday final check...");
      const users = await this.getUsersForFinalCheck();
      for (const user of users) {
        await this.sendFinalParticipationRequest(user);
      }
      this.markUnresponsiveUsers();
    } catch (error) {
      this.logger.error("Error in final participation check:", error);
    }
  }

  private async getUsersForParticipationCheck() {
    return this.userModel.find({
      $or: [
        { participationDelay: null },
        { participationDelay: { $lte: new Date() } },
      ],
    });
  }

  private async getUsersForFinalCheck() {
    return this.userModel.find({
      isParticipating: null,
      participationDelay: null,
    });
  }

  private async markUnresponsiveUsers() {
    setTimeout(
      async () => {
        const unresponsiveUsers = await this.getUsersForFinalCheck();
        for (const user of unresponsiveUsers) {
          user.isParticipating = false;
          await user.save();
        }
      },
      2 * 60 * 60 * 1000
    ); // 2 hours
  }

  private async sendParticipationRequest(user: User) {
    const message =
      "Сегодня стартует новый подбор пар. Планируешь участвовать на этой неделе?";
    const keyboard = this.createParticipationKeyboard();
    await this.sendMessageWithKeyboard(user.telegramId, message, keyboard);
  }

  private async sendFinalParticipationRequest(user: User) {
    const message = "Осталось всего 2 часа, чтобы подтвердить участие!";
    const keyboard = this.createParticipationKeyboard();
    await this.sendMessageWithKeyboard(user.telegramId, message, keyboard);
    await this.sendMessageWithKeyboard(
      user.telegramId,
      "❗️Важно: если ты делаешь паузу в подборе, то подписка не продлевается.\n\n" +
        "Поэтому советуем попробовать встретиться со своим тревел-мейтом. А вдруг на этой неделе выпадает кто-то особенный? ☺️"
    );
  }

  private createParticipationKeyboard() {
    return {
      inline_keyboard: [
        [{ text: "Участвую", callback_data: "participate" }],
        [{ text: "Пропущу неделю", callback_data: "skip_week" }],
        [{ text: "Пропущу месяц", callback_data: "skip_month" }],
      ],
    };
  }

  private async sendMessageWithKeyboard(
    userId: number,
    message: string,
    keyboard?: any
  ) {
    try {
      await this.bot.telegram.sendMessage(userId, message, {
        reply_markup: keyboard,
      });
    } catch (error) {
      this.logger.error(`Failed to send message to user ${userId}:`, error);
    }
  }

  async handleParticipationResponse(
    userId: number,
    response: "participate" | "skip_week" | "skip_month"
  ) {
    const user = await this.userModel.findOne({ telegramId: userId });
    if (!user) return;

    this.updateUserParticipation(user, response);
    user.lastParticipationCheck = new Date();
    await user.save();
  }

  private updateUserParticipation(user: User, response: string) {
    const participationSettings = {
      participate: { isParticipating: true, delay: null },
      skip_week: { isParticipating: false, delay: 7 * 24 * 60 * 60 * 1000 },
      skip_month: { isParticipating: false, delay: 28 * 24 * 60 * 60 * 1000 },
    };

    const settings = participationSettings[response];
    user.isParticipating = settings.isParticipating;
    user.participationDelay = settings.delay
      ? new Date(Date.now() + settings.delay)
      : null;
  }

  @Cron("0 0 * * 3") // Every Wednesday at 00:00
  // @Cron("*/5 * * * *") // Run every 5 minutes for testing
  async handleWeeklyMatching() {
    try {
      this.logger.log("Starting weekly matching process...");
      const users = await this.userModel.find({ isParticipating: true }).exec();
      if (users.length < 2) {
        this.logger.log("Not enough users for matching");
        return;
      }

      const shuffledUsers = this.shuffleArray([...users]);
      await this.matchUsers(shuffledUsers);
      this.logger.log("Weekly matching process completed");
    } catch (error) {
      this.logger.error("Error in matching process:", error);
    }
  }

  private async matchUsers(users: User[]) {
    for (let i = 0; i < users.length - 1; i++) {
      const user1 = users[i];
      let bestMatch = null;
      let highestScore = 0;

      for (let j = i + 1; j < users.length; j++) {
        const user2 = users[j];
        if (
          user1.telegramId === user2.telegramId ||
          user1.matchedWith.includes(user2.telegramId)
        ) {
          continue;
        }

        const score = this.calculateMatchScore(user1, user2);
        if (score > highestScore) {
          highestScore = score;
          bestMatch = user2;
        }
      }

      if (bestMatch) {
        await this.notifyMatch(user1, bestMatch);
      }
    }
  }

  private async notifyMatch(user1: User, user2: User) {
    await this.sendMatchNotification(user1, user2);
    await this.sendMatchNotification(user2, user1);

    user1.matchedWith.push(user2.telegramId);
    user2.matchedWith.push(user1.telegramId);

    await user1.save();
    await user2.save();
  }

  private calculateMatchScore(user1: User, user2: User): number {
    let score = 0;
    // Uncomment when country and location data is available
    // if (user1.country === user2.country) {
    //   score += 6;
    //   if (user1.location === user2.location) {
    //     score += 5;
    //   }
    // }
    if (user1.topics && user2.topics) {
      score += this.calculateWeightedScore(user1.topics, user2.topics, 1);
    }
    if (user1.hobbies && user2.hobbies) {
      score += this.calculateWeightedScore(user1.hobbies, user2.hobbies, 0.7);
    }
    if (user1.traits && user2.traits) {
      score += this.calculateWeightedScore(user1.traits, user2.traits, 0.4);
    }
    return score;
  }

  private calculateWeightedScore(
    arr1: string[],
    arr2: string[],
    weight: number
  ): number {
    const commonElements = arr1.filter((value) => arr2.includes(value));
    return commonElements.length * weight;
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  private async sendMatchNotification(user: User, match: User) {
    try {
      const message = this.createMatchMessage(match);
      await this.bot.telegram.sendMessage(user.telegramId, message, {
        parse_mode: "HTML",
      });
    } catch (error) {
      this.logger.error(
        `Failed to send match notification to user ${user.telegramId}:`,
        error
      );
    }
  }

  private async sendNoMatchNotification(user: User) {
    try {
      await this.bot.telegram.sendMessage(
        user.telegramId,
        "К сожалению, на этой неделе для вас не нашлось пары. Попробуйте в следующий раз!"
      );
    } catch (error) {
      this.logger.error(
        `Failed to send no-match notification to user ${user.telegramId}:`,
        error
      );
    }
  }

  private createMatchMessage(match: User): string {
    let message = "🎉 У вас новый метч!\n\n";
    if (match.name) message += `<b>Имя:</b> ${match.name}\n`;
    if (match.age) message += `<b>Возраст:</b> ${match.age}\n`;
    if (match.occupation)
      message += `<b>Род занятий:</b> ${match.occupation}\n`;
    message += "\n";
    if (match.traits?.length > 0)
      message += `<b>Черты:</b> ${match.traits.join(", ")}\n`;
    if (match.hobbies?.length > 0)
      message += `<b>Хобби:</b> ${match.hobbies.join(", ")}\n`;
    if (match.topics?.length > 0)
      message += `<b>Интересы:</b> ${match.topics.join(", ")}\n`;
    if (match.countries)
      message += `\n<b>Страны мечты:</b> ${match.countries}\n`;
    if (match.info) message += `<b>О себе:</b> ${match.info}\n`;
    if (match.instagram) message += `\n<b>Instagram:</b> @${match.instagram}`;
    message += "\n\nУ вас есть 3 дня, чтобы начать общение. Удачи! 🍀";
    return message;
  }
}

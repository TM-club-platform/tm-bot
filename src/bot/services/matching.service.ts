import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectBot() private bot: Telegraf<any>
  ) {}

  @Cron('0 0 * * 3') // Every Wednesday at 00:00
  async handleMatching() {
    try {
      this.logger.log('Starting weekly matching process...');

      // Get all users
      const users = await this.userModel.find().exec();

      // Shuffle users array
      const shuffledUsers = this.shuffleArray([...users]);

      // Create pairs
      for (let i = 0; i < shuffledUsers.length - 1; i += 2) {
        const user1 = shuffledUsers[i];
        const user2 = shuffledUsers[i + 1];

        if (user1 && user2) {
          await this.sendMatchNotification(user1, user2);
          await this.sendMatchNotification(user2, user1);
        }
      }

      // If there's an odd number of users, handle the last one
      if (shuffledUsers.length % 2 !== 0) {
        const lastUser = shuffledUsers[shuffledUsers.length - 1];
        await this.sendNoMatchNotification(lastUser);
      }

      this.logger.log('Weekly matching process completed');
    } catch (error) {
      this.logger.error('Error in matching process:', error);
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  private async sendMatchNotification(user: User, match: User) {
    const message = this.createMatchMessage(match);
    
    try {
      await this.bot.telegram.sendMessage(user.telegramId, message, {
        parse_mode: 'HTML',
      });
    } catch (error) {
      this.logger.error(`Failed to send match notification to user ${user.telegramId}:`, error);
    }
  }

  private async sendNoMatchNotification(user: User) {
    try {
      await this.bot.telegram.sendMessage(
        user.telegramId,
        'К сожалению, на этой неделе для вас не нашлось пары. Попробуйте в следующий раз!'
      );
    } catch (error) {
      this.logger.error(`Failed to send no-match notification to user ${user.telegramId}:`, error);
    }
  }

  private createMatchMessage(match: User): string {
    let message = '🎉 У вас новый метч!\n\n';
    message += `<b>Имя:</b> ${match.name}\n`;
    message += `<b>Возраст:</b> ${match.age}\n`;
    message += `<b>Род занятий:</b> ${match.occupation}\n\n`;

    if (match.traits?.length > 0) {
      message += `<b>Черты:</b> ${match.traits.join(', ')}\n`;
    }
    if (match.hobbies?.length > 0) {
      message += `<b>Хобби:</b> ${match.hobbies.join(', ')}\n`;
    }
    if (match.topics?.length > 0) {
      message += `<b>Интересы:</b> ${match.topics.join(', ')}\n`;
    }
    
    message += `\n<b>Страны мечты:</b> ${match.countries}\n`;
    message += `<b>О себе:</b> ${match.info}\n`;
    
    if (match.instagram) {
      message += `\n<b>Instagram:</b> @${match.instagram}`;
    }

    message += '\n\nУ вас есть 3 дня, чтобы начать общение. Удачи! 🍀';
    
    return message;
  }
} 
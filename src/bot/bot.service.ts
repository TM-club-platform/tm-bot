import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';

@Injectable()
export class BotService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async createUser(telegramId: number, firstName: string, lastName?: string, username?: string): Promise<User> {
    const user = new this.userModel({
      telegramId,
      firstName,
      lastName,
      username,
    });
    return user.save();
  }

  async findUser(telegramId: number): Promise<User> {
    return this.userModel.findOne({ telegramId }).exec();
  }
} 
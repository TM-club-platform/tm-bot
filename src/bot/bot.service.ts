import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "./schemas/user.schema";

interface CreateUserDto {
  telegramId: number;
  name: string;
  age?: number;
  occupation?: string;
  traits?: string[];
  hobbies?: string[];
  topics?: string[];
  countries?: string;
  info?: string;
  instagram?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}

@Injectable()
export class BotService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>
  ) {}

  async createOrUpdateUser(userData: CreateUserDto): Promise<User> {
    const existingUser = await this.findUser(userData.telegramId);

    if (existingUser) {
      // Update existing user
      return this.userModel
        .findOneAndUpdate({ telegramId: userData.telegramId }, userData, {
          new: true,
        })
        .exec();
    }

    // Create new user
    const user = new this.userModel(userData);
    return user.save();
  }

  async findUser(telegramId: number): Promise<User> {
    return this.userModel.findOne({ telegramId }).exec();
  }
}

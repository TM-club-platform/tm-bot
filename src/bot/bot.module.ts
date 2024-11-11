import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BotUpdate } from './bot.update';
import { BotService } from './bot.service';
import { User, UserSchema } from './schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [BotUpdate, BotService],
})
export class BotModule {} 
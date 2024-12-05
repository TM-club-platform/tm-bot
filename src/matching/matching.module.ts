import { Module } from "@nestjs/common";
import { MatchingService } from "./matching.service";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "../bot/schemas/user.schema";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}

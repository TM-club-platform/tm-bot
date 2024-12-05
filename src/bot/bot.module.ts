import { Module } from "@nestjs/common";
import { BotUpdate } from "./bot.update";
import { BotService } from "./bot.service";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "./schemas/user.schema";
import { RegistrationScene } from "./scenes/registration-wizard";
import { TraitsHandler } from "./scenes/handlers/traits.handler";
import { AgeStepHandler } from "./scenes/handlers/age.handler";
import { NameStepHandler } from "./scenes/handlers/name.handler";
import { HobbiesHandler } from "./scenes/handlers/hobbies.handler";
import { TopicsHandler } from "./scenes/handlers/topics.handler";
import { PhotoHandler } from "./scenes/handlers/photo.handler";
import { LocationHandler } from "./scenes/handlers/location.handler";
import { TextAnketaHandler } from "./scenes/handlers/textAnketa.handler";

@Module({
  imports: [
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
    LocationHandler,
    TextAnketaHandler,
    PhotoHandler,
  ],
})
export class BotModule {}

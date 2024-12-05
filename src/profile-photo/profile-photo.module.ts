import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ProfilePhotoService } from "./profile-photo.service";
import { User, UserSchema } from "../bot/schemas/user.schema";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [ProfilePhotoService],
  exports: [ProfilePhotoService],
})
export class ProfilePhotoModule {}

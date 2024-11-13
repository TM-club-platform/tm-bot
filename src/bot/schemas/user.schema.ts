import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class User extends Document {
  @Prop({ required: true })
  telegramId: number;

  @Prop({})
  name: string;

  @Prop({})
  age: number;

  @Prop({})
  occupation: string;

  @Prop({ type: [String] })
  traits: string[];

  @Prop({ type: [String] })
  hobbies: string[];

  @Prop({ type: [String] })
  topics: string[];

  @Prop()
  countries: string;

  @Prop()
  info: string;

  @Prop()
  instagram: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  username: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

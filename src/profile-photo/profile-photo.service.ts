import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Jimp, JimpMime, loadFont } from "jimp";
import { join } from "path";
import { User } from "../bot/schemas/user.schema";
import { InjectBot } from "nestjs-telegraf";
import { Telegraf } from "telegraf";
import { MongoClient, GridFSBucket } from "mongodb";
import { ObjectId } from "mongodb";

@Injectable()
export class ProfilePhotoService {
  private readonly logger = new Logger(ProfilePhotoService.name);
  private readonly mockupPath = join(
    process.cwd(),
    "assets",
    "mockups",
    "profile-template.png"
  );
  private readonly gridFSBucket: GridFSBucket;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectBot() private bot: Telegraf<any>
  ) {
    // Initialize GridFS connection
    const client = new MongoClient(process.env.MONGODB_URI);
    client.connect();
    this.gridFSBucket = new GridFSBucket(client.db(process.env.MONGO_DB_NAME));
  }

  async generateProfilePhoto(
    telegramId: number,
    photoId: string,
    text: string
  ) {
    try {
      const user = await this.userModel.findOne({ telegramId });
      if (!user) {
        throw new Error("User not found");
      }

      // Download photo from Telegram
      const file = await this.bot.telegram.getFile(photoId);
      const photoUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;

      // Load and process images
      const [mockup, uploadedImage] = await Promise.all([
        Jimp.read(this.mockupPath),
        Jimp.read(photoUrl),
      ]);

      // Process the image
      uploadedImage.resize({ w: 200, h: 200 });
      mockup.composite(uploadedImage, 50, 50);

      // Add text to mockup
      const font = await loadFont("FONT_SANS_32_BLACK");
      mockup.print({ font, x: 10, y: 300, text });

      // Convert to buffer for storage
      const buffer = await mockup.getBuffer(JimpMime.png);

      // Save to GridFS and update user
      const photoData = (await this.savePhotoToGridFS(buffer, telegramId)) as {
        id: ObjectId;
        filename: string;
      };
      await this.updateUserPhoto(user, photoData.id.toString());

      return photoData;
    } catch (error) {
      this.logger.error("Error generating profile photo:", error);
      throw error;
    }
  }

  private async savePhotoToGridFS(buffer: Buffer, telegramId: number) {
    const filename = `profile-${telegramId}-${Date.now()}.png`;
    const uploadStream = this.gridFSBucket.openUploadStream(filename, {
      contentType: "image/png",
    });

    return new Promise((resolve, reject) => {
      uploadStream.on("error", (error: Error) => {
        reject(error);
      });

      uploadStream.on("finish", () => {
        resolve({
          filename: uploadStream.filename,
          id: uploadStream.id,
        });
      });

      uploadStream.end(buffer);
    });
  }

  private async updateUserPhoto(user: User, photoId: string) {
    user.profilePhoto = photoId;
    await user.save();
  }

  async deleteProfilePhoto(telegramId: number) {
    try {
      const user = await this.userModel.findOne({ telegramId });
      if (!user || !user.profilePhoto) {
        return false;
      }

      // Delete from GridFS
      await this.gridFSBucket.delete(new ObjectId(user.profilePhoto));

      // Remove reference from user
      user.profilePhoto = null;
      await user.save();

      return true;
    } catch (error) {
      this.logger.error("Error deleting profile photo:", error);
      throw error;
    }
  }

  async getProfilePhoto(telegramId: number) {
    try {
      const user = await this.userModel.findOne({ telegramId });
      if (!user?.profilePhoto) {
        return null;
      }

      const downloadStream = this.gridFSBucket.openDownloadStream(
        new ObjectId(user.profilePhoto)
      );

      return downloadStream;
    } catch (error) {
      this.logger.error("Error getting profile photo:", error);
      throw error;
    }
  }
}

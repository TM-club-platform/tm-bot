import { Injectable } from "@nestjs/common";
import { WizardContext } from "../types";

@Injectable()
export class PhotoHandler {
  async promptForPhoto(ctx: WizardContext): Promise<void> {
    await ctx.reply(
      "Пришли свое фото для анкеты.\n\n" +
        "Советуем выбрать изображение с нейтральным фото, где хорошо видно лицо и твою улыбку. 😉"
    );
  }

  async handlePhoto(ctx: WizardContext): Promise<boolean> {
    if (!ctx.message || !("photo" in ctx.message)) {
      await ctx.reply("Пожалуйста, отправьте фотографию");
      return false;
    }

    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    ctx.wizard.state.userData.photo = photo.file_id;
    return true;
  }
}

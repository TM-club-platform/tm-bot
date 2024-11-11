import { Start, Update, Ctx, On } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { BotService } from './bot.service';

@Update()
export class BotUpdate {
  constructor(private readonly botService: BotService) {}

  @Start()
  async start(@Ctx() ctx: Context) {
    const { id, first_name, last_name, username } = ctx.from;
    
    let user = await this.botService.findUser(id);
    if (!user) {
      user = await this.botService.createUser(id, first_name, last_name, username);
    }

    return `Welcome ${first_name}! Your user ID is: ${id}`;
  }

  @On('text')
  async onMessage(@Ctx() ctx: Context) {
    return 'I received your message!';
  }
} 
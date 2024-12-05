import { Injectable } from "@nestjs/common";
import { WizardContext } from "../types";
import { COUNTRIES, WIZARD_CONSTANTS } from "../constants";

@Injectable()
export class LocationHandler {
  async promptForCountrySelection(ctx: WizardContext): Promise<void> {
    const countryButtons = COUNTRIES.map((country) => ({
      text: country.name,
      callback_data: `country-${country.name}`,
    }));

    const keyboard = {
      inline_keyboard: countryButtons.map((button) => [button]),
    };

    await ctx.reply("Выбери страну, в которой ты находишься", {
      reply_markup: keyboard,
    });
  }

  async promptForDistrictSelection(ctx: WizardContext): Promise<void> {
    const country = COUNTRIES.find(
      (c) => c.name === ctx.session.selectedCountry?.replace("country-", "")
    );
    if (!country) return;

    const districtButtons = country.districts.map((district) => ({
      text: district.name,
      callback_data: `district-${district.name}`,
    }));

    const keyboard = {
      inline_keyboard: districtButtons.map((button) => [button]),
    };

    await ctx.reply("Выбери район, в котором ты находишься", {
      reply_markup: keyboard,
    });
  }

  async handleCountrySelection(
    ctx: WizardContext & { match: RegExpExecArray }
  ): Promise<boolean> {
    const country = ctx.match[1];
    ctx.session.selectedCountry = `country-${country}`;
    return true;
  }

  async handleDistrictSelection(
    ctx: WizardContext & { match: RegExpExecArray }
  ): Promise<boolean> {
    const district = ctx.match[1];
    ctx.session.selectedDistrict = `district-${district}`;
    return true;
  }
}

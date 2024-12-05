import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { SheetsService } from "./sheets.service";

interface User {
  id: string;
  username: string;
  name: string;
  goal: string;
  gender: string;
  country: string;
  region: string;
  interests: number[];
  similarInterests: string;
  announcement: string;
  profile: string;
  placesToVisit: string;
  instagram: string;
  skip: number;
  previousMatch: string[];
  nextMatch?: string;
}

interface UsersByCountry {
  [country: string]: User[];
}

@Injectable()
export class SheetsSchedulerService {
  private readonly logger = new Logger(SheetsSchedulerService.name);
  private readonly SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
  private readonly SHEET_RANGE = "A1:P200"; // Adjust range based on your needs

  constructor(private readonly sheetsService: SheetsService) {}

  @Cron(process.env.CRON_EXPRESSION || CronExpression.EVERY_DAY_AT_10AM)
  async handleCron() {
    try {
      this.logger.debug("Starting scheduled sheet data processing");

      // Read data from sheet
      const data = await this.sheetsService.readSheetData(
        this.SPREADSHEET_ID,
        this.SHEET_RANGE
      );

      if (!data || !data.length) {
        this.logger.warn("No data found in sheet");
        return;
      }

      // Process the data
      const processedData = this.processSheetData(data);

      // Update specific columns if needed
      await this.updateProcessedData(processedData);

      this.logger.debug("Finished processing sheet data");
    } catch (error) {
      this.logger.error(`Error processing sheet data: ${error.message}`);
    }
  }

  private parseArrayString(arrayString: string) {
    return arrayString
      .replace(/[\[\]]/g, "")
      .split(",")
      .map(Number);
  }

  private calculateCompatibilityScore(user1: any, user2: any): number {
    let score = 0;

    // Compare regions (weight: 2)
    if (user1.region && user2.region && user1.region === user2.region) {
      score += 2;
    }

    // Compare interests (weight: 1)
    if (user1.interests && user2.interests) {
      const interests1 = user1.interests;
      const interests2 = user2.interests;

      const commonInterests = interests1.filter((interest) =>
        interests2.includes(interest)
      );

      score += commonInterests.length;
    }

    return score;
  }

  private findBestMatch(user: any, availableUsers: any[]): string {
    let bestMatch = null;
    let bestScore = -1;

    for (const candidate of availableUsers) {
      const score = this.calculateCompatibilityScore(user, candidate);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = candidate;
      }
    }

    if (!bestMatch && availableUsers.length > 0) {
      bestMatch =
        availableUsers[Math.floor(Math.random() * availableUsers.length)];
    }

    return bestMatch?.id;
  }

  private mapRowToUser(row: any[]): User {
    return {
      id: row[0],
      username: row[1],
      name: row[2],
      goal: row[3],
      gender: row[4],
      country: row[5],
      region: row[6],
      interests: row[7] ? this.parseArrayString(row[7]) : [],
      similarInterests: row[8],
      announcement: row[9],
      profile: row[10],
      placesToVisit: row[11],
      instagram: row[12],
      skip: Number(row[13]),
      previousMatch: row[14] ? JSON.parse(row[14]) : [],
      nextMatch: row[15],
    };
  }

  private groupUsersByCountry(users: User[]): UsersByCountry {
    return users.reduce((acc: UsersByCountry, user) => {
      if (!acc[user.country]) {
        acc[user.country] = [];
      }
      acc[user.country].push(user);
      return acc;
    }, {});
  }

  private findMatchesForCountry(countryUsers: User[]): Map<string, string> {
    const matches = new Map<string, string>();

    const shuffledUsers = [...countryUsers]
      .filter((user) => !user.skip)
      .sort(() => Math.random() - 0.5);
    let availableIds = shuffledUsers.map((user) => user.id);

    for (let i = 0; i < shuffledUsers.length; i++) {
      const currentUser = shuffledUsers[i];

      if (!currentUser || matches.has(currentUser.id)) continue;

      const matchId = this.findMatchForUser(
        currentUser,
        shuffledUsers,
        availableIds
      );

      if (matchId) {
        matches.set(currentUser.id, matchId);
        matches.set(matchId, currentUser.id);
        availableIds = availableIds.filter(
          (id) => id !== matchId && id !== currentUser.id
        );
      } else {
        this.logger.warn(
          `No match found for user ${currentUser.id} in ${currentUser.country}`
        );
      }
    }

    return matches;
  }

  private findMatchForUser(
    user: User,
    allUsers: User[],
    availableIds: string[]
  ): string | null {
    const availableUsers = allUsers.filter(
      (u) =>
        availableIds.includes(u.id) &&
        u.id !== user.id &&
        (!user.previousMatch || !user.previousMatch.includes(u.id))
    );

    if (availableUsers.length === 0) return null;

    return this.findBestMatch(user, availableUsers);
  }

  private processSheetData(data: any[][]): User[] {
    const [headers, ...rows] = data;
    const users: User[] = rows.map((row) => this.mapRowToUser(row));
    const usersByCountry = this.groupUsersByCountry(users);

    // Process matches for each country
    for (const country in usersByCountry) {
      const countryMatches = this.findMatchesForCountry(
        usersByCountry[country]
      );

      // Assign matches back to users
      usersByCountry[country].forEach((user) => {
        user.nextMatch = countryMatches.get(user.id) || undefined;
      });
    }

    return users;
  }

  private async updateProcessedData(processedData: any[]) {
    try {
      // Example: Update a specific column with processed results
      const updateRange = "P2:P200"; // Example: updating 'Skip' column
      const valuesToUpdate = processedData.map((row) => [row.nextMatch || ""]);

      await this.sheetsService.updateSheetData(
        this.SPREADSHEET_ID,
        updateRange,
        valuesToUpdate
      );
    } catch (error) {
      this.logger.error(`Error updating processed data: ${error.message}`);
      throw error;
    }
  }
}

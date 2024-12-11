require("dotenv").config();

const { google } = require("googleapis");

class SheetsScheduler {
  constructor() {
    this.SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
    this.SHEET_RANGE = "A1:P200";
    this.auth = null;
  }

  async initialize() {
    try {
      this.auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });
    } catch (error) {
      console.error("Failed to initialize Google Auth:", error);
      throw error;
    }
  }

  async processSheet() {
    try {
      console.log("Starting sheet data processing");

      const data = await this.readSheetData();

      if (!data || !data.length) {
        console.warn("No data found in sheet");
        return;
      }

      const processedData = this.processSheetData(data);
      await this.updateProcessedData(processedData);

      console.log("Finished processing sheet data");
    } catch (error) {
      console.error(`Error processing sheet data: ${error.message}`);
    }
  }

  async readSheetData() {
    const sheets = google.sheets({ version: "v4", auth: this.auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: this.SPREADSHEET_ID,
      range: this.SHEET_RANGE,
    });
    return response.data.values;
  }

  async updateSheetData(range, values) {
    const sheets = google.sheets({ version: "v4", auth: this.auth });
    await sheets.spreadsheets.values.update({
      spreadsheetId: this.SPREADSHEET_ID,
      range: range,
      valueInputOption: "RAW",
      resource: { values },
    });
  }

  parseArrayString(arrayString) {
    return arrayString
      .replace(/[\[\]]/g, "")
      .split(",")
      .map(Number);
  }

  calculateCompatibilityScore(user1, user2) {
    let score = 0;

    if (user1.region && user2.region && user1.region === user2.region) {
      score += 2;
    }

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

  findBestMatch(user, availableUsers) {
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

  mapRowToUser(row) {
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

  groupUsersByCountry(users) {
    return users.reduce((acc, user) => {
      if (!acc[user.country]) {
        acc[user.country] = [];
      }
      acc[user.country].push(user);
      return acc;
    }, {});
  }

  findMatchesForCountry(countryUsers) {
    const matches = new Map();

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
        console.warn(
          `No match found for user ${currentUser.id} in ${currentUser.country}`
        );
      }
    }

    return matches;
  }

  findMatchForUser(user, allUsers, availableIds) {
    const availableUsers = allUsers.filter(
      (u) =>
        availableIds.includes(u.id) &&
        u.id !== user.id &&
        (!user.previousMatch || !user.previousMatch.includes(u.id))
    );

    if (availableUsers.length === 0) return null;

    return this.findBestMatch(user, availableUsers);
  }

  processSheetData(data) {
    const [headers, ...rows] = data;
    const users = rows.map((row) => this.mapRowToUser(row));
    const usersByCountry = this.groupUsersByCountry(users);

    for (const country in usersByCountry) {
      const countryMatches = this.findMatchesForCountry(
        usersByCountry[country]
      );

      usersByCountry[country].forEach((user) => {
        user.nextMatch = countryMatches.get(user.id) || undefined;
      });
    }

    return users;
  }

  async updateProcessedData(processedData) {
    try {
      const updateRange = "P2:P200";
      const valuesToUpdate = processedData.map((row) => [row.nextMatch || ""]);

      await this.updateSheetData(updateRange, valuesToUpdate);
    } catch (error) {
      console.error(`Error updating processed data: ${error.message}`);
      throw error;
    }
  }
}

// Usage example:
async function main() {
  const scheduler = new SheetsScheduler();
  await scheduler.initialize();
  await scheduler.processSheet();
}

// Run the script
main().catch(console.error);

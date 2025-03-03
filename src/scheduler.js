require("dotenv").config();

const { google } = require("googleapis");
const BaseSheetsOperator = require("./baseSheets");
const {
  CONSTANTS,
  parseArrayString,
  mapRowToUser,
  groupUsersByCountry,
  groupUsersByRegion,
} = require("./utils");

/**
 * Class for scheduling user matches from Google Sheets data
 */
class SheetsScheduler extends BaseSheetsOperator {
  constructor() {
    super();
    this.SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
    this.SHEET_RANGE = "A1:P200";
  }

  /**
   * Process the Google Sheet to match users
   * @throws {Error} If processing fails
   */
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
      throw error;
    }
  }

  /**
   * Calculate compatibility score between two users
   * @param {Object} user1 - First user
   * @param {Object} user2 - Second user
   * @returns {number} Compatibility score
   */
  calculateCompatibilityScore(user1, user2) {
    let score = 0;

    // Add points for same region
    if (user1.region && user2.region && user1.region === user2.region) {
      score += 2;
    }

    // Add points for common interests
    if (user1.interests && user2.interests) {
      const interests1 = Array.isArray(user1.interests) ? user1.interests : [];
      const interests2 = Array.isArray(user2.interests) ? user2.interests : [];
      const commonInterests = interests1.filter((interest) =>
        interests2.includes(interest)
      );
      score += commonInterests.length;
    }

    return score;
  }

  /**
   * Find the best match for a user from available users
   * @param {Object} user - User to find match for
   * @param {Array} availableUsers - Array of available users
   * @returns {string|null} ID of best match or null if no match found
   */
  findBestMatch(user, availableUsers) {
    if (!availableUsers.length) return null;

    let bestMatch = null;
    let bestScore = -1;

    for (const candidate of availableUsers) {
      const score = this.calculateCompatibilityScore(user, candidate);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = candidate;
      }
    }

    // If no good match found, pick a random one
    if (!bestMatch && availableUsers.length > 0) {
      bestMatch =
        availableUsers[Math.floor(Math.random() * availableUsers.length)];
    }

    return bestMatch?.id;
  }

  /**
   * Find matches for users in a group
   * @param {Array} groupUsers - Array of users in a group
   * @returns {Map} Map of user IDs to match IDs
   */
  findMatchesInGroup(groupUsers) {
    const matches = new Map();

    // Filter out users who want to skip and shuffle for randomness
    const shuffledUsers = [...groupUsers]
      .filter((user) => !user.skip)
      .sort(() => Math.random() - 0.5);

    let availableIds = new Set(shuffledUsers.map((user) => user.id));

    for (let i = 0; i < shuffledUsers.length; i++) {
      const currentUser = shuffledUsers[i];

      // Skip if user already has a match
      if (!currentUser || matches.has(currentUser.id)) continue;

      const matchId = this.findMatchForUser(
        currentUser,
        shuffledUsers,
        availableIds,
        matches
      );

      if (matchId) {
        this.recordMatch(
          currentUser,
          matchId,
          shuffledUsers,
          matches,
          availableIds
        );
      } else {
        console.warn(
          `No match found for user ${currentUser.id} in ${currentUser.country}`
        );
      }
    }

    return matches;
  }

  /**
   * Record a match between two users
   * @param {Object} user - User to match
   * @param {string} matchId - ID of matched user
   * @param {Array} allUsers - Array of all users
   * @param {Map} matches - Map of user IDs to match IDs
   * @param {Set} availableIds - Set of available user IDs
   */
  recordMatch(user, matchId, allUsers, matches, availableIds) {
    // Record the match in both directions
    matches.set(user.id, matchId);
    matches.set(matchId, user.id);

    // Update previous matches for both users
    user.previousMatch = user.previousMatch || [];
    user.previousMatch.push(matchId);

    const matchedUser = allUsers.find((u) => u.id === matchId);
    if (matchedUser) {
      matchedUser.previousMatch = matchedUser.previousMatch || [];
      matchedUser.previousMatch.push(user.id);
    }

    // Remove both users from available pool
    availableIds.delete(matchId);
    availableIds.delete(user.id);
  }

  /**
   * Find a match for a specific user
   * @param {Object} user - User to find match for
   * @param {Array} allUsers - Array of all users
   * @param {Set} availableIds - Set of available user IDs
   * @param {Map} matches - Map of user IDs to match IDs
   * @returns {string|null} ID of matched user or null if no match found
   */
  findMatchForUser(user, allUsers, availableIds, matches) {
    // Filter available users who haven't been matched and haven't matched with this user before
    const availableUsers = allUsers.filter(
      (u) =>
        availableIds.has(u.id) &&
        u.id !== user.id &&
        !matches.has(u.id) &&
        !(user.previousMatch || []).includes(u.id) &&
        !(u.previousMatch || []).includes(user.id)
    );

    if (availableUsers.length === 0) return null;

    return this.findBestMatch(user, availableUsers);
  }

  /**
   * Process sheet data to create matches
   * @param {Array} data - Sheet data as array of rows
   * @returns {Array} Processed user objects with matches
   */
  processSheetData(data) {
    const [headers, ...rows] = data;
    const users = rows.map(mapRowToUser);
    const usersByCountry = groupUsersByCountry(users);

    // Process each country
    for (const country in usersByCountry) {
      let countryMatches;

      if (!CONSTANTS.COUNTRIES_WITHOUT_RESTRICTED_REGIONS.includes(country)) {
        // For countries with region restrictions, match within regions
        countryMatches = this.matchUsersWithinRegions(usersByCountry[country]);
      } else {
        // For countries without region restrictions, match within country
        countryMatches = this.findMatchesInGroup(usersByCountry[country]);
      }

      // Update next match for each user in the country
      usersByCountry[country].forEach((user) => {
        user.nextMatch = countryMatches.get(user.id) || undefined;
      });
    }

    return users;
  }

  /**
   * Match users within regions of a country
   * @param {Array} countryUsers - Array of users in a country
   * @returns {Map} Map of user IDs to match IDs
   */
  matchUsersWithinRegions(countryUsers) {
    const usersByRegion = groupUsersByRegion(countryUsers);
    const allMatches = new Map();

    // Process each region
    for (const region in usersByRegion) {
      const regionMatches = this.findMatchesInGroup(usersByRegion[region]);

      // Merge region matches into all matches
      for (const [userId, matchId] of regionMatches.entries()) {
        allMatches.set(userId, matchId);
      }
    }

    return allMatches;
  }

  /**
   * Update processed data in the sheet
   * @param {Array} processedData - Array of user objects with matches
   * @throws {Error} If updating processed data fails
   */
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

/**
 * Main function to run the scheduler
 */
async function main() {
  try {
    const scheduler = new SheetsScheduler();
    await scheduler.initialize();
    await scheduler.processSheet();
  } catch (error) {
    console.error("Error in main function:", error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = SheetsScheduler;

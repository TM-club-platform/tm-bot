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
    this.SHEET_RANGE = "A1:P1000";
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
   * Normalize ID by removing leading apostrophe if present
   * @param {string} id - ID to normalize
   * @returns {string} Normalized ID
   */
  normalizeId(id) {
    return id ? id.toString().replace(/^'/, "") : id;
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
      score += 4;
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

    // Filter out users who want to skip
    const activeUsers = groupUsers.filter((user) => !user.skip);

    // Create compatibility matrix
    const compatibilityScores = new Map();

    // Calculate compatibility scores for all possible pairs
    for (let i = 0; i < activeUsers.length; i++) {
      for (let j = i + 1; j < activeUsers.length; j++) {
        const user1 = activeUsers[i];
        const user2 = activeUsers[j];

        // Проверяем, не было ли предыдущих матчей
        const previouslyMatched =
          (user1.previousMatch || []).some(
            (id) => id.toString() === user2.id.toString()
          ) ||
          (user2.previousMatch || []).some(
            (id) => id.toString() === user1.id.toString()
          );

        if (previouslyMatched) {
          continue;
        }

        const score = this.calculateCompatibilityScore(user1, user2);
        const pairKey = `${user1.id}-${user2.id}`;
        compatibilityScores.set(pairKey, score);
      }
    }

    // Sort pairs by score in descending order
    const sortedPairs = Array.from(compatibilityScores.entries()).sort(
      ([, score1], [, score2]) => score2 - score1
    );

    const matchedUsers = new Set();

    // Match users starting from highest compatibility scores
    for (const [pairKey, score] of sortedPairs) {
      const [user1Id, user2Id] = pairKey.split("-");

      // Skip if either user is already matched
      if (matchedUsers.has(user1Id) || matchedUsers.has(user2Id)) {
        continue;
      }

      // Record the match
      matches.set(user1Id.toString(), user2Id.toString());
      matches.set(user2Id.toString(), user1Id.toString());
      matchedUsers.add(user1Id);
      matchedUsers.add(user2Id);
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
    const normalizedUserId = this.normalizeId(user.id);
    const normalizedMatchId = this.normalizeId(matchId);

    // Record the match in both directions
    matches.set(normalizedUserId, normalizedMatchId);
    matches.set(normalizedMatchId, normalizedUserId);

    // Update previous matches for both users
    user.previousMatch = user.previousMatch || [];
    user.previousMatch.push(normalizedMatchId);

    const matchedUser = allUsers.find(
      (u) => this.normalizeId(u.id) === normalizedMatchId
    );
    if (matchedUser) {
      matchedUser.previousMatch = matchedUser.previousMatch || [];
      matchedUser.previousMatch.push(normalizedUserId);
    }

    // Remove both users from available pool
    availableIds.delete(normalizedMatchId);
    availableIds.delete(normalizedUserId);
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
      console.log(`\n=== Processing ${country} ===`);
      let countryMatches;

      if (!CONSTANTS.COUNTRIES_WITHOUT_RESTRICTED_REGIONS.includes(country)) {
        countryMatches = this.matchUsersWithinRegions(usersByCountry[country]);
      } else {
        countryMatches = this.findMatchesInGroup(usersByCountry[country]);
      }

      // Найдем пользователей без пары
      const unmatchedUsers = usersByCountry[country].filter(user => {
        const hasMatch = countryMatches.get(user.id.toString());
        if (!hasMatch && !user.skip) {
          console.log(`Unmatched user: ${user.name} (${user.id})`);
          console.log(`  Previous matches: ${user.previousMatch || 'none'}`);
          console.log(`  Region: ${user.region}`);
          
          // Покажем с кем этот пользователь мог бы быть в паре
          const potentialMatches = usersByCountry[country]
            .filter(potentialMatch => 
              potentialMatch.id !== user.id && 
              !potentialMatch.skip &&
              !(user.previousMatch || []).includes(potentialMatch.id.toString()) &&
              !countryMatches.get(potentialMatch.id.toString())
            );
          
          if (potentialMatches.length > 0) {
            console.log('  Potential matches were:');
            potentialMatches.forEach(match => {
              console.log(`    - ${match.name} (${match.id}) in ${match.region}`);
            });
          } else {
            console.log('  No potential matches were available');
          }
        }
        return !hasMatch && !user.skip;
      });

      console.log(`\nTotal unmatched in ${country}: ${unmatchedUsers.length}`);

      usersByCountry[country].forEach((user) => {
        const matchId = countryMatches.get(user.id.toString());
        user.nextMatch = matchId;
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

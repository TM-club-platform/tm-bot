/**
 * Common utility functions for the TravelMate bot
 */

// Constants used across the application
const CONSTANTS = {
  COUNTRIES_WITHOUT_RESTRICTED_REGIONS: ["Бали", "Шри-Ланка"],
  AVAILABLE_COUNTRIES: ["Бали", "Шри-Ланка", "Вьетнам", "Тайланд"],
  AVAILABLE_REGIONS: [
    "Букит",
    "Паттая",
    "Чангу",
    "Убуд",
    "Чиангмай",
    "Дананг",
    "Пхукет",
    "Нячанг",
  ],
};

/**
 * Parse array string from sheet cell
 * @param {string} arrayString - String representation of array
 * @returns {Array<number>} Parsed array of numbers
 */
function parseArrayString(arrayString) {
  return arrayString
    .replace(/[\[\]]/g, "")
    .split(",")
    .map(Number);
}

/**
 * Map a row from the sheet to a user object
 * @param {Array} row - Row data from sheet
 * @returns {Object} User object
 */
function mapRowToUser(row) {
  return {
    id: row[0],
    username: row[1],
    name: row[2],
    goal: row[3],
    gender: row[4],
    country: row[5],
    region: row[6],
    interests: row[7] ? parseArrayString(row[7]) : [],
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

/**
 * Group users by country
 * @param {Array} users - Array of user objects
 * @returns {Object} Users grouped by country
 */
function groupUsersByCountry(users) {
  return users.reduce((acc, user) => {
    if (!acc[user.country]) {
      acc[user.country] = [];
    }
    acc[user.country].push(user);
    return acc;
  }, {});
}

/**
 * Group users by region
 * @param {Array} users - Array of user objects
 * @returns {Object} Users grouped by region
 */
function groupUsersByRegion(users) {
  return users.reduce((acc, user) => {
    if (!acc[user.region]) {
      acc[user.region] = [];
    }
    acc[user.region].push(user);
    return acc;
  }, {});
}

module.exports = {
  CONSTANTS,
  parseArrayString,
  mapRowToUser,
  groupUsersByCountry,
  groupUsersByRegion,
};

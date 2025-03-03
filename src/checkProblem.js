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
 * Class for validating user data from Google Sheets
 */
class SheetsValidator extends BaseSheetsOperator {
  constructor() {
    super();
    this.SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
    this.SHEET_RANGE = "A1:P200";
  }

  /**
   * Initialize Google Sheets authentication
   * @throws {Error} If authentication fails
   */
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

  /**
   * Read data from Google Sheets
   * @returns {Promise<Array>} Sheet data as array of rows
   * @throws {Error} If reading sheet data fails
   */
  async readSheetData() {
    try {
      const sheets = google.sheets({ version: "v4", auth: this.auth });
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: this.SPREADSHEET_ID,
        range: this.SHEET_RANGE,
      });
      return response.data.values;
    } catch (error) {
      console.error("Error reading sheet data:", error);
      throw error;
    }
  }

  /**
   * Process the Google Sheet to validate user data
   * @throws {Error} If processing fails
   */
  async processSheet() {
    try {
      console.log("Starting sheet data validation");

      const data = await this.readSheetData();

      if (!data || !data.length) {
        console.warn("No data found in sheet");
        return;
      }
      this.processSheetData(data);

      console.log("Finished validating sheet data");
    } catch (error) {
      console.error(`Error processing sheet data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process and validate sheet data
   * @param {Array} data - Sheet data as array of rows
   * @returns {Array} Processed user objects
   */
  processSheetData(data) {
    const [headers, ...rows] = data;
    const users = rows.map(mapRowToUser);

    // Validate country and region for each user
    this.validateUserData(users);

    // Check for sufficient users in each country/region
    this.validateUserDistribution(users);

    return users;
  }

  /**
   * Validate country and region for each user
   * @param {Array} users - Array of user objects
   */
  validateUserData(users) {
    for (const user of users) {
      if (!CONSTANTS.AVAILABLE_COUNTRIES.includes(user.country)) {
        console.log(`Error: User ${user.id} has wrong country ${user.country}`);
      }
      if (!CONSTANTS.AVAILABLE_REGIONS.includes(user.region)) {
        console.log(`Error: User ${user.id} has wrong region ${user.region}`);
      }
    }
  }

  /**
   * Validate that there are enough users in each country/region
   * @param {Array} users - Array of user objects
   */
  validateUserDistribution(users) {
    const usersByCountry = groupUsersByCountry(users);

    for (const country in usersByCountry) {
      if (!CONSTANTS.COUNTRIES_WITHOUT_RESTRICTED_REGIONS.includes(country)) {
        // For countries with region restrictions, check each region
        const usersByRegion = groupUsersByRegion(usersByCountry[country]);
        for (const region in usersByRegion) {
          if (usersByRegion[region].length < 2) {
            console.log(
              `Error: Not enough users in country ${country} and region ${region}`
            );
          }
        }
      } else {
        // For countries without region restrictions, check country as a whole
        if (usersByCountry[country].length < 2) {
          console.log(`Error: Not enough users in country ${country}`);
        }
      }
    }
  }
}

/**
 * Main function to run the validation
 */
async function main() {
  try {
    const validator = new SheetsValidator();
    await validator.initialize();
    await validator.processSheet();
  } catch (error) {
    console.error("Error in main function:", error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = SheetsValidator;

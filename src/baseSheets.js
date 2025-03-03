require("dotenv").config();

const { google } = require("googleapis");

/**
 * Base class for Google Sheets operations
 */
class BaseSheetsOperator {
  constructor() {
    this.SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
    this.SHEET_RANGE = "A1:P200";
    this.auth = null;
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
   * Update sheet data
   * @param {string} range - Range to update (e.g., "P2:P200")
   * @param {Array} values - Values to update
   * @throws {Error} If updating sheet data fails
   */
  async updateSheetData(range, values) {
    try {
      const sheets = google.sheets({ version: "v4", auth: this.auth });
      await sheets.spreadsheets.values.update({
        spreadsheetId: this.SPREADSHEET_ID,
        range: range,
        valueInputOption: "RAW",
        resource: { values },
      });
    } catch (error) {
      console.error("Error updating sheet data:", error);
      throw error;
    }
  }

  /**
   * Process the Google Sheet
   * This method should be implemented by subclasses
   * @throws {Error} If processing fails
   */
  async processSheet() {
    throw new Error("Method 'processSheet' must be implemented by subclasses");
  }
}

module.exports = BaseSheetsOperator;

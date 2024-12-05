import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

@Injectable()
export class SheetsService {
  private readonly logger = new Logger(SheetsService.name);
  private sheets;

  constructor() {
    this.initializeSheets();
  }

  private async initializeSheets() {
    try {
      // Create JWT client using service account credentials
      const auth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      // Initialize Google Sheets API
      this.sheets = google.sheets({ version: 'v4', auth });
    } catch (error) {
      this.logger.error('Failed to initialize Google Sheets:', error);
      throw error;
    }
  }

  async readSheetData(spreadsheetId: string, range: string) {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      return response.data.values;
    } catch (error) {
      this.logger.error(`Failed to read sheet data: ${error.message}`);
      throw error;
    }
  }

  async updateSheetData(spreadsheetId: string, range: string, values: any[][]) {
    try {
      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values,
        },
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to update sheet data: ${error.message}`);
      throw error;
    }
  }

  // Add your custom logic methods here
  async processAndUpdateSheet(spreadsheetId: string, readRange: string, writeRange: string) {
    try {
      // Read data
      const data = await this.readSheetData(spreadsheetId, readRange);
      
      // Process data (add your custom logic here)
      const processedData = data.map(row => {
        // Example processing - modify this according to your needs
        return [...row, 'processed'];
      });

      // Update sheet with processed data
      await this.updateSheetData(spreadsheetId, writeRange, processedData);
    } catch (error) {
      this.logger.error(`Failed to process and update sheet: ${error.message}`);
      throw error;
    }
  }
} 
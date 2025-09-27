import { google } from 'googleapis';

interface StudentData {
  studentNo: string;
  name: string;
  program: string;
  school: string;
  gpa?: number;
  gown?: string;
  fee?: string;
}

class GoogleSheetsService {
  isConfigured(): boolean {
    const requiredEnvVars = [
      'GOOGLE_PROJECT_ID',
      'GOOGLE_PRIVATE_KEY_ID',
      'GOOGLE_PRIVATE_KEY',
      'GOOGLE_CLIENT_EMAIL',
      'GOOGLE_CLIENT_ID',
    ];

    return requiredEnvVars.every((varName) => !!process.env[varName]);
  }

  private async getAuthClient() {
    // Check if all required environment variables are set
    const requiredEnvVars = {
      GOOGLE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID,
      GOOGLE_PRIVATE_KEY_ID: process.env.GOOGLE_PRIVATE_KEY_ID,
      GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
      GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    };

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required Google Sheets environment variables: ${missingVars.join(', ')}. ` +
          `Please check your .env.local file and ensure all Google service account credentials are set. ` +
          `Refer to docs/google-sheets-setup.md for setup instructions.`
      );
    }

    // Use service account credentials for server-side access
    const credentials = {
      type: 'service_account',
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.GOOGLE_CLIENT_EMAIL}`,
    };

    try {
      const authClient = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      // Test the authentication by getting an access token
      const client = await authClient.getClient();
      return authClient;
    } catch (error) {
      console.error('Google authentication error:', error);
      throw new Error(
        `Failed to authenticate with Google Sheets API. This could be due to: ` +
          `1) Invalid service account credentials, ` +
          `2) Malformed private key (check for proper \\n line breaks), ` +
          `3) Google Sheets API not enabled in your project, ` +
          `4) Service account doesn't have necessary permissions. ` +
          `Please refer to docs/google-sheets-setup.md for detailed setup instructions.`
      );
    }
  }

  async createGraduationSheet(
    graduationListName: string,
    students: StudentData[]
  ) {
    try {
      const authClient = await this.getAuthClient();

      const sheets = google.sheets({
        version: 'v4',
        auth: authClient,
      });

      // Create a new spreadsheet
      const createResponse = await sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: `${graduationListName} - ${new Date().toLocaleDateString()}`,
          },
          sheets: [
            {
              properties: {
                title: 'Graduation List',
              },
            },
          ],
        },
      });

      const spreadsheetId = createResponse.data.spreadsheetId!;
      const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

      // Prepare headers
      const headers = [
        'Student Number',
        'Student Name',
        'Program',
        'School',
        'GPA',
        'Graduation Gown Receipt',
        'Graduation Fee Receipt',
      ];

      // Prepare student data rows
      const rows = students.map((student) => [
        student.studentNo,
        student.name,
        student.program,
        student.school,
        student.gpa?.toString() || '',
        student.gown || '',
        student.fee || '',
      ]);

      // Add header row
      const allData = [headers, ...rows];

      // Write data to the sheet
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Graduation List!A1',
        valueInputOption: 'RAW',
        requestBody: {
          values: allData,
        },
      });

      // Format the sheet
      await this.formatSheet(sheets, spreadsheetId);

      return {
        spreadsheetId,
        spreadsheetUrl,
      };
    } catch (error: any) {
      console.error('Error creating Google Sheet:', error);

      // Provide more specific error messages based on the error type
      if (error.code === 403) {
        throw new Error(
          'Permission denied: The service account does not have permission to create Google Sheets. ' +
            'Please ensure: 1) Google Sheets API is enabled in your Google Cloud project, ' +
            '2) The service account has the correct permissions, ' +
            '3) All environment variables are correctly set. ' +
            'See docs/google-sheets-setup.md for detailed instructions.'
        );
      } else if (error.code === 401) {
        throw new Error(
          'Authentication failed: Invalid service account credentials. ' +
            'Please check your Google service account credentials in the environment variables.'
        );
      } else if (error.message?.includes('environment variables')) {
        // Re-throw environment variable errors as-is
        throw error;
      } else {
        throw new Error(
          `Failed to create Google Sheet: ${error.message || 'Unknown error'}. ` +
            'Please check your Google Sheets API configuration.'
        );
      }
    }
  }

  async updateGraduationSheet(spreadsheetId: string, students: StudentData[]) {
    try {
      const authClient = await this.getAuthClient();

      const sheets = google.sheets({
        version: 'v4',
        auth: authClient,
      });

      // Clear existing data (except headers)
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: 'Graduation List!A2:G',
      });

      // Prepare student data rows
      const rows = students.map((student) => [
        student.studentNo,
        student.name,
        student.program,
        student.school,
        student.gpa?.toString() || '',
        student.gown || '',
        student.fee || '',
      ]);

      if (rows.length > 0) {
        // Write new data
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: 'Graduation List!A2',
          valueInputOption: 'RAW',
          requestBody: {
            values: rows,
          },
        });
      }

      return true;
    } catch (error: any) {
      console.error('Error updating Google Sheet:', error);

      // Provide more specific error messages
      if (error.code === 403) {
        throw new Error(
          'Permission denied: Cannot update the Google Sheet. The spreadsheet may not exist or ' +
            'the service account lacks permission to modify it.'
        );
      } else if (error.code === 404) {
        throw new Error(
          'Google Sheet not found: The spreadsheet may have been deleted or the ID is invalid.'
        );
      } else {
        throw new Error(
          `Failed to update Google Sheet: ${error.message || 'Unknown error'}`
        );
      }
    }
  }

  private async formatSheet(sheets: any, spreadsheetId: string) {
    // Format headers and columns
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          // Make header row bold
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  textFormat: {
                    bold: true,
                  },
                  backgroundColor: {
                    red: 0.9,
                    green: 0.9,
                    blue: 0.9,
                  },
                },
              },
              fields:
                'userEnteredFormat.textFormat.bold,userEnteredFormat.backgroundColor',
            },
          },
          // Auto-resize columns
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: 0,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: 7,
              },
            },
          },
          // Freeze header row
          {
            updateSheetProperties: {
              properties: {
                sheetId: 0,
                gridProperties: {
                  frozenRowCount: 1,
                },
              },
              fields: 'gridProperties.frozenRowCount',
            },
          },
        ],
      },
    });
  }
}

export const googleSheetsService = new GoogleSheetsService();
export type { StudentData };

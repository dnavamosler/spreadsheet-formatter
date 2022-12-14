import { sign } from 'jsonwebtoken';
import axios from 'axios';
const moment = require('moment');

interface Payload {
  iss: string;
  scope: string;
  aud: string;
  exp: number;
  iat: number;
}

const googleSpreadsheetsApi = 'https://sheets.googleapis.com/v4/spreadsheets/';
const googleApiToken = 'https://oauth2.googleapis.com/token';
const googleApiDrive = 'https://www.googleapis.com/auth/drive';
const grantType = 'urn:ietf:params:oauth:grant-type:jwt-bearer';

class spredSheetFormatter {
  #token: string | null;
  #expDate: any;
  #account: string | null;
  #secret: any;

  constructor() {
    this.#token = null;
    this.#expDate = null;
    this.#account = null;
    this.#secret = 'null';
  }
  setConfig(secret: string, account: string) {
    this.#secret = secret;
    this.#account = account;
  }
  private createJWT() {
    const date = moment();
    const expDate = moment(date).add({
      hours: 1
    });
    this.#expDate = expDate;
    const payload = {
      iss: this.#account,
      scope: googleApiDrive,
      aud: googleApiToken,
      exp: expDate.unix(),
      iat: date.unix()
    };

    const token = sign(payload, this.#secret, { algorithm: 'RS256' });

    const oAuthPayload = {
      grant_type: grantType,
      assertion: token
    };

    return axios
      .post(googleApiToken, oAuthPayload)
      .then((res) => {
        this.#token = res.data.access_token;
      })
      .catch((err) => {
        this.#token = null;
        console.error(err);
      });
  }
  private async checkAuthentication() {
    if (!this.#secret || !this.#account) {
      this.#token = null;
      return;
    }
    if (!this.#token) {
      await this.createJWT();
    }
    if (this.#token && moment(this.#expDate).isAfter(moment(), 'seconds')) {
      await this.createJWT();
    }
  }
  async getPageSpreadSheet(spreadSheetId: string, pageTitle: string) {
    await this.checkAuthentication();
    return new Promise(async (resolve, reject) => {
      try {
        const spreadSheetData = await axios
          .get(
            googleSpreadsheetsApi +
              spreadSheetId +
              '/values/' +
              pageTitle +
              '!A1:AZ9999',
            {
              headers: {
                Authorization: `Bearer ${this.#token}`
              }
            }
          )
          .then((e) => e.data)
          .catch((e) => {
            throw new Error('Error no fetch spreadsheet data!!');
          });
        const values = spreadSheetData.values;

        if (!values) {
          throw new Error('Metadatasheet has no values!!');
        }

        let metaData = {};
        values.forEach(([title, description]: [string, string]) => {
          if (title)
            metaData = {
              ...metaData,
              [title.toLowerCase().split(' ').join('-')]: description
            };
        });

        resolve(metaData);
      } catch (error) {
        reject(error);
      }
    });
  }
  async getSpreadSheet(spreadSheetId: string, metadataId: string) {
    await this.checkAuthentication();
    if (!this.#token) {
      console.error('Please set the config!!');
      return;
    }
    return new Promise(async (resolve, reject) => {
      try {
        const spreadSheetData = await axios
          .get(googleSpreadsheetsApi + spreadSheetId, {
            headers: {
              Authorization: `Bearer ${this.#token}`
            }
          })
          .then((e) => e.data)
          .catch((e) => {
            throw new Error('Error no fetch spreadsheet data!!');
          });

        const sheets = spreadSheetData.sheets;
        const metadataSheet = sheets.find(
          (sheet: any) => sheet.properties?.sheetId == metadataId
        );

        if (!metadataSheet) {
          throw new Error('Error not found metadata spreadsheet!!');
        }

        const title = metadataSheet.properties.title;
        const metaData = await this.getPageSpreadSheet(spreadSheetId, title);

        const DATA = { sheets, metaData };

        resolve(DATA);
      } catch (error) {
        reject(error);
      }
    });
  }
}

const spreadSheet = new spredSheetFormatter();

export const SpreadSheetFormatter = spreadSheet;

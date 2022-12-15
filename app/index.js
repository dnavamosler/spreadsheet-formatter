import * as jose from 'jose';
import axios from 'axios';
import dayjs from 'dayjs';

const googleSpreadsheetsApi = 'https://sheets.googleapis.com/v4/spreadsheets/';
const googleApiToken = 'https://oauth2.googleapis.com/token';
const googleApiDrive = 'https://www.googleapis.com/auth/drive';
const grantType = 'urn:ietf:params:oauth:grant-type:jwt-bearer';

class spredSheetFormatter {
  constructor() {
    this.token = null;
    this.expDate = null;
    this.account = null;
    this.secret = 'null';
  }
  setConfig(secret, account) {
    this.secret = secret;
    this.account = account;
  }
  async createJWT() {
    const date = dayjs();
    const expDate = dayjs(date).add({
      hours: 1
    });
    this.expDate = expDate;
    const payload = {
      iss: this.account,
      scope: googleApiDrive,
      aud: googleApiToken,
      exp: expDate.unix(),
      iat: date.unix()
    };

    // const token = jwt.sign(payload, this.secret, { algorithm: "RS256" });

    const alg = 'RS256';

    const secret = await jose.importPKCS8(this.secret, alg);

    const token = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg })
      .setExpirationTime('1h')
      .sign(secret);
    const oAuthPayload = {
      grant_type: grantType,
      assertion: token
    };

    return new Promise((resolve, reject) => {
      axios
        .post(googleApiToken, oAuthPayload)
        .then((res) => {
          this.token = res.data.access_token;
          resolve(res.data.access_token);
        })
        .catch(() => {
          this.token = null;
          reject('error no auth');
        });
    });
  }
  async checkAuthentication() {
    if (!this.secret || !this.account) {
      this.token = null;
      return;
    }
    if (!this.token) {
      await this.createJWT();
    }
    if (this.token && dayjs(this.expDate).isAfter(dayjs(), 'seconds')) {
      await this.createJWT();
    }
  }
  async getPageSpreadSheet(spreadSheetId, pageTitle, pageId, asObject = true) {
    await this.checkAuthentication();
    // eslint-disable-next-line no-async-promise-executor
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
                Authorization: `Bearer ${this.token}`
              }
            }
          )
          .then((e) => e.data)
          .catch(() => {
            throw new Error('Error no fetch spreadsheet data!!');
          });
        const values = spreadSheetData.values;

        if (!values) {
          throw new Error('Metadatasheet has no values!!');
        }

        let metaDataObject = {};
        let metaDataArray = [];
        values.forEach(([title, description], index) => {
          if (title) {
            if (asObject) {
              metaDataObject = {
                ...metaDataObject,
                [title.toLowerCase().split(' ').join('-')]: description
              };
            } else {
              const haveError =
                description?.search('#REF!') === 0 || !description
                  ? true
                  : false;
              const errorMessage = `Error in: https://docs.google.com/spreadsheets/d/${spreadSheetId}/edit#gid=${pageId} in row ${
                index + 1
              }`;
              if (haveError) {
                console.error(errorMessage);
              }
              metaDataArray.push({
                row: index + 1,
                key: title.toLowerCase().split(' ').join('-'),
                value: description,
                error: haveError,
                errorDescription: haveError ? errorMessage : undefined
              });
            }
          }
        });

        resolve(
          asObject
            ? metaDataObject
            : metaDataArray.filter((el) => el.key !== 'ignore')
        );
      } catch (error) {
        reject(error);
      }
    });
  }
  async getSpreadSheet(spreadSheetId, metadataId) {
    await this.checkAuthentication();
    if (!this.token) {
      console.error('Please set the config!!');
      return;
    }
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      try {
        const spreadSheetData = await axios
          .get(googleSpreadsheetsApi + spreadSheetId, {
            headers: {
              Authorization: `Bearer ${this.token}`
            }
          })
          .then((e) => e.data)
          .catch(() => {
            throw new Error('Error no fetch spreadsheet data!!');
          });

        const sheets = spreadSheetData.sheets;
        const metadataSheet = sheets.find(
          (sheet) => sheet.properties?.sheetId == metadataId
        );

        if (!metadataSheet) {
          throw new Error('Error not found metadata spreadsheet!!');
        }

        const title = metadataSheet.properties.title;
        const metaData = await this.getPageSpreadSheet(
          spreadSheetId,
          title,
          metadataId
        );

        const DATA = { sheets, metaData };

        resolve(DATA);
      } catch (error) {
        reject(error);
      }
    });
  }
}

const spreadSheet = new spredSheetFormatter();

export default spreadSheet;

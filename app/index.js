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
  cutChunks(list, type) {
    let newList = [];
    let temporalList = [];
    for (let index = 0; index < list.length; index++) {
      const currentIsList = [type].includes(list[index].key);
      if (currentIsList) {
        temporalList.push(list[index]);
      } else {
        if (temporalList.length) {
          newList = [
            ...newList,
            {
              row: temporalList[0].row,
              key: type,
              value: temporalList,
              error: false,
              errorDescription: undefined
            }
          ];
          temporalList = [];
        } else {
          newList.push(list[index]);
        }
      }
    }
    return newList;
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

        // eliminar ignorados
        metaDataArray = metaDataArray.filter((el) => el.key !== 'ignore');

        // Procesamiento de listas / chunks
        metaDataArray = this.cutChunks(metaDataArray, 'ul');
        metaDataArray = this.cutChunks(metaDataArray, 'ol');

        resolve(asObject ? metaDataObject : metaDataArray);
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

spreadSheet.setConfig(
  '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC0EbV8Gja2NCE+\nldXOBQ+eoGesFUS6c77rympu1duQK5tGZqpISNTEFc33irlv53OlcyK8pIa/cZ1v\nMD6r67dP6xziAY6a+A2gMDyqFT7E/ICUwZv91r8pGSxh+qKRWrWVaN0/yYlzLHXt\n7zfCguLWINkNGctfwpELcbMPt2UlXQs8fKf7LbQiwo3WZAtpkWnEzC6C554qhiDN\nvxQlcwV9VpLJipKbKr+YB+1SGlIvpuqBZI8ZwShLfjq95tP8Vow9dZ7qm+dshAek\nB6ogZruSw6FuFoxlOTutMbtlCwDGsYth5kjbYUXdcRRdgCGa2cN8KYR+Vy+8JEuX\no9BeMwG5AgMBAAECgf9JgPEUN58dwSnQ4ljkQCygE9o95HCpq5XDqlzH4YQ+1Y4M\nrtvTpec0I7Jv2bDYfSI350fGuWJHw5kASjFK/G1XsiGYIAqWN6tYOFiLFSEKSAg0\nsNN8Sqy9mgkD9ctmiiCVXLjz0NDKsttwxLV+MO9neQEg1+assD+E7GSrhbFEDoeS\n/Yv0EJGBQbrEkmMJhPow5BcXUHkjgzmgOdgRL6wm/1vQyrIiNMTolDpSOUTu2kwh\n1mw8KtdeLz7I+9euVLW6NuM2SfJCsSIWVqhy+9fLYlhqto4vIt2BHVPLsrQZEdv8\nXQRJgg8GqPLF2MTDVBq9gGUm8ZchLD7d5wtUmqkCgYEA4GCd9JwMtr1KhZ68CJiO\nXXD6TFrNsHplUuBA61YbdkeZR+qLQIXhYQ+tKM2f+n2OeqZOY5Iul6TZcXFjXb7Y\nDwlGbtqioH8OeZll0BYv11bUXdRlsXP54exyzeTx9iAS0FjonYcEUQqYvoInpe80\nyxqHnoufRjgnV8dYEOeB7B0CgYEAzXJ7MHJ0OnhFPNOz4XpGYY22P0qhu5U3L5Qy\nSmN6fnUETwDs62A+lV8UnZDYb88xmFBYLc0rfPdsKiOIDH82fQ+fmFt784PH4d/U\nsiOW8Qa1WiK78neD0qv46NIaRLhS5IuB8zqUdCCzpt0SkDl+GUjgCRfcEIg+LUky\nPkfIYU0CgYARWQb9YY9OFaaMXDB3jav8J38Cpkae7WemF7aNO3QWGgUM3WJ006UQ\nRxEBRZyn1ktMykznP+cgTFuPfM/M8LNtvi7W5UqLlCc/WY/Ync6HHKyAsKpIJQpd\n4FUj/B6FBAfQWf9qJoU76tDScee02aDAT0XLCUqAOFk6XSw+6ldONQKBgQCKFGpl\nWldxwMnQIv0gCz1obYVSroda+uPXT4QpaQi4G0+lBZs2az5EyF2jtOky5I+RrlZF\nmkKjP+vrumvC8nEdxrVeAgah2S0rS3O5sp/NKNQUW4n0YY0wt7KYUDWlgDj+MCFL\n51BFaIE2IhlK48kzlz4z/lxCpD8d0rc5EqfDdQKBgQCVmCr0HOwY7s1UGUdgOXUS\nGsnJZM/6DIZqFjzwHJQGbHgVWgE/RxisCki8WH+2+7SEFhlBdURSRYDRLtcffqv8\nButT99Hd8VfrkEyxwNgcq4ABSx2yZDUtNNzXJAYvjDdEZ1YqluUJ+quUecOj/0wd\nQSrbgZZF8zJx+Qz5tRasig==\n-----END PRIVATE KEY-----\n',
  'planilla-love@planilla-love.iam.gserviceaccount.com'
);

spreadSheet
  .getSpreadSheet('1_Mt36KhNt9alaF5n3URLSmGp8moOlkqStIlE64JE6yU', '1457608419')
  .then((data) => {
    spreadSheet
      .getPageSpreadSheet(
        '1_Mt36KhNt9alaF5n3URLSmGp8moOlkqStIlE64JE6yU',
        'Summary%20-%20LSR',
        986936660,
        false
      )
      .then((data) => {
        // console.log(data);
      });
  });
export default spreadSheet;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpreadSheetFormatter = void 0;
var jsonwebtoken_1 = require("jsonwebtoken");
var spredSheetFormatter = /** @class */ (function () {
    function spredSheetFormatter() {
        this.grantType = 'urn:ietf:params:oauth:grant-type:jwt-bearer';
        this.assertation = null;
    }
    spredSheetFormatter.prototype.createJWT = function () {
        var secret = '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC0EbV8Gja2NCE+\nldXOBQ+eoGesFUS6c77rympu1duQK5tGZqpISNTEFc33irlv53OlcyK8pIa/cZ1v\nMD6r67dP6xziAY6a+A2gMDyqFT7E/ICUwZv91r8pGSxh+qKRWrWVaN0/yYlzLHXt\n7zfCguLWINkNGctfwpELcbMPt2UlXQs8fKf7LbQiwo3WZAtpkWnEzC6C554qhiDN\nvxQlcwV9VpLJipKbKr+YB+1SGlIvpuqBZI8ZwShLfjq95tP8Vow9dZ7qm+dshAek\nB6ogZruSw6FuFoxlOTutMbtlCwDGsYth5kjbYUXdcRRdgCGa2cN8KYR+Vy+8JEuX\no9BeMwG5AgMBAAECgf9JgPEUN58dwSnQ4ljkQCygE9o95HCpq5XDqlzH4YQ+1Y4M\nrtvTpec0I7Jv2bDYfSI350fGuWJHw5kASjFK/G1XsiGYIAqWN6tYOFiLFSEKSAg0\nsNN8Sqy9mgkD9ctmiiCVXLjz0NDKsttwxLV+MO9neQEg1+assD+E7GSrhbFEDoeS\n/Yv0EJGBQbrEkmMJhPow5BcXUHkjgzmgOdgRL6wm/1vQyrIiNMTolDpSOUTu2kwh\n1mw8KtdeLz7I+9euVLW6NuM2SfJCsSIWVqhy+9fLYlhqto4vIt2BHVPLsrQZEdv8\nXQRJgg8GqPLF2MTDVBq9gGUm8ZchLD7d5wtUmqkCgYEA4GCd9JwMtr1KhZ68CJiO\nXXD6TFrNsHplUuBA61YbdkeZR+qLQIXhYQ+tKM2f+n2OeqZOY5Iul6TZcXFjXb7Y\nDwlGbtqioH8OeZll0BYv11bUXdRlsXP54exyzeTx9iAS0FjonYcEUQqYvoInpe80\nyxqHnoufRjgnV8dYEOeB7B0CgYEAzXJ7MHJ0OnhFPNOz4XpGYY22P0qhu5U3L5Qy\nSmN6fnUETwDs62A+lV8UnZDYb88xmFBYLc0rfPdsKiOIDH82fQ+fmFt784PH4d/U\nsiOW8Qa1WiK78neD0qv46NIaRLhS5IuB8zqUdCCzpt0SkDl+GUjgCRfcEIg+LUky\nPkfIYU0CgYARWQb9YY9OFaaMXDB3jav8J38Cpkae7WemF7aNO3QWGgUM3WJ006UQ\nRxEBRZyn1ktMykznP+cgTFuPfM/M8LNtvi7W5UqLlCc/WY/Ync6HHKyAsKpIJQpd\n4FUj/B6FBAfQWf9qJoU76tDScee02aDAT0XLCUqAOFk6XSw+6ldONQKBgQCKFGpl\nWldxwMnQIv0gCz1obYVSroda+uPXT4QpaQi4G0+lBZs2az5EyF2jtOky5I+RrlZF\nmkKjP+vrumvC8nEdxrVeAgah2S0rS3O5sp/NKNQUW4n0YY0wt7KYUDWlgDj+MCFL\n51BFaIE2IhlK48kzlz4z/lxCpD8d0rc5EqfDdQKBgQCVmCr0HOwY7s1UGUdgOXUS\nGsnJZM/6DIZqFjzwHJQGbHgVWgE/RxisCki8WH+2+7SEFhlBdURSRYDRLtcffqv8\nButT99Hd8VfrkEyxwNgcq4ABSx2yZDUtNNzXJAYvjDdEZ1YqluUJ+quUecOj/0wd\nQSrbgZZF8zJx+Qz5tRasig==\n-----END PRIVATE KEY-----\n';
        var date = new Date();
        var seconds = Math.floor(date.getTime() / 1000);
        var expSeconds = seconds + 60 * 60;
        var payload = {
            iss: 'planilla-love@planilla-love.iam.gserviceaccount.com',
            scope: 'https://www.googleapis.com/auth/drive',
            aud: 'https://oauth2.googleapis.com/token',
            exp: expSeconds,
            iat: seconds
        };
        var token = (0, jsonwebtoken_1.sign)(payload, secret, { algorithm: 'RS256' });
        console.log(token);
    };
    spredSheetFormatter.prototype.authGoogle = function () { };
    return spredSheetFormatter;
}());
var spreadSheet = new spredSheetFormatter();
spreadSheet.createJWT();
exports.SpreadSheetFormatter = spreadSheet;

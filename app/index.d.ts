declare module 'spreadsheet-formatter' {
  export function setConfig(secret: string, account: string);
  export function getSpreadSheet(spreadSheetId: string, metadataId: string);
  export function getPageSpreadSheet(
    spreadSheetId: string,
    pageTitle: string,
    pageId: string,
    asObject?: boolean
  );
  export function getOriginalPageSpreadSheet(
    spreadSheetId: string,
    pageTitle: string,
    pageId: string
  );
}

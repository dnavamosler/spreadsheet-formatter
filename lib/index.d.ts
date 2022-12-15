declare class spredSheetFormatter {
    #private;
    constructor();
    setConfig(secret: string, account: string): void;
    private createJWT;
    private checkAuthentication;
    getPageSpreadSheet(spreadSheetId: string, pageTitle: string, pageId: string, asObject?: boolean): Promise<unknown>;
    getSpreadSheet(spreadSheetId: string, metadataId: string): Promise<unknown>;
}
export declare const SpreadSheetFormatter: spredSheetFormatter;
export {};

export enum NdaStage {
    NOT_STARTED = "NOT_STARTED",
    AWAITING_APPROVAL = "AWAITING_APPROVAL",
    APPROVED = "APPROVED",
    NOT_APPROVED = "NOT_APPROVED"
}

export type NdaStatus = {
    stage: NdaStage,
    signatureDataUri: string,
    pdfDataUri: string,
}

export interface Response {
  body: string | Buffer,
  statusCode: number,
  headers?: {[h:string]: string}
}
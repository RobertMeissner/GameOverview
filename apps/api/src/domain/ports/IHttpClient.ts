export interface IHttpClient {
    fetch(request: Request): Promise<Response>
}

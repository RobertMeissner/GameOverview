export interface IHttpClient {
    fetch(request: Request, response: Response): Observable<Response>
}

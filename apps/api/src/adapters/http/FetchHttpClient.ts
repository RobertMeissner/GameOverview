import type {IHttpClient} from "../../domain/ports/IHttpClient";

export class FetchHttpClient implements IHttpClient {
    async fetch(request: Request): Promise<Response> {
        return fetch(request, {})
    }
}

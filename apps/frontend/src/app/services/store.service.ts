import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {BulkImportResponse, GameImportRequest, ImportResult, StoreStats} from '../domain/entities/StoreStats';

@Injectable({providedIn: 'root'})
export class StoreService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
  }

  getStoreStats(): Observable<StoreStats> {
    return this.http.get<StoreStats>(`${this.apiUrl}/stores/stats`);
  }

  importSingleGame(game: GameImportRequest): Observable<ImportResult> {
    return this.http.post<ImportResult>(`${this.apiUrl}/import/single`, game);
  }

  importBulkGames(games: GameImportRequest[]): Observable<BulkImportResponse> {
    return this.http.post<BulkImportResponse>(`${this.apiUrl}/import/bulk`, games);
  }
}

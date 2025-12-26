import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {GameSearchResult, ScrapedGameInfo, ScraperStatus} from '../domain/entities/ScrapedGameInfo';

@Injectable({providedIn: 'root'})
export class ScraperService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
  }

  searchGames(query: string, limit: number = 10): Observable<GameSearchResult> {
    return this.http.get<GameSearchResult>(`${this.apiUrl}/scraper/search`, {
      params: {query, limit: limit.toString()}
    });
  }

  getGameDetails(igdbId: number): Observable<ScrapedGameInfo> {
    return this.http.get<ScrapedGameInfo>(`${this.apiUrl}/scraper/games/${igdbId}`);
  }

  getStatus(): Observable<ScraperStatus> {
    return this.http.get<ScraperStatus>(`${this.apiUrl}/scraper/status`);
  }
}

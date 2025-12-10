import {Injectable} from '@angular/core';
import {Game} from '../domain/entities/game.model';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';

@Injectable({providedIn: 'root'})
export class GamesService {
  private readonly apiUrl = environment.apiUrl

  constructor(private http: HttpClient) {
  }

  getAllGames(): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.apiUrl}/games`);
  }

  getTopGames(): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.apiUrl}/games/top`);
  }
}

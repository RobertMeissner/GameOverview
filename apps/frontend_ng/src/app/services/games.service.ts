import {Injectable} from '@angular/core';
import {Game} from '../domain/entities/game.model';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({providedIn: 'root'})
export class GamesService {
  private readonly apiUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) {
  }

  getAllGames(): Observable<Game[]> {
    return this.http.get<Game[]>(`${this.apiUrl}/games`);
  }
}

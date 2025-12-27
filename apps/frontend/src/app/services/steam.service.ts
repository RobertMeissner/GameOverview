import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SteamLibraryImportRequest {
  steamId: string;
  gamerId?: string;
}

export interface SteamLibraryImportResponse {
  success: boolean;
  created: number;
  updated: number;
  failed: number;
  message: string;
}

export interface SteamStatusResponse {
  enabled: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class SteamService {
  private apiUrl = 'http://localhost:8080/steam';

  constructor(private http: HttpClient) {}

  /**
   * Import user's Steam library with playtime information
   */
  importLibrary(steamId: string, gamerId?: string): Observable<SteamLibraryImportResponse> {
    const request: SteamLibraryImportRequest = {
      steamId,
      gamerId
    };
    return this.http.post<SteamLibraryImportResponse>(`${this.apiUrl}/import-library`, request);
  }

  /**
   * Check Steam integration status
   */
  getStatus(): Observable<SteamStatusResponse> {
    return this.http.get<SteamStatusResponse>(`${this.apiUrl}/status`);
  }
}

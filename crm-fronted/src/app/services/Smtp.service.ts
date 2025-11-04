import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SmtpSettings } from '../models/SmtpSettings.model';

@Injectable({
  providedIn: 'root'
})
export class SmtpService {
  private apiUrl = 'https://localhost:44386/api/SmtpSettings';

  constructor(private http: HttpClient) { }

  getSettings(): Observable<SmtpSettings> {
    return this.http.get<SmtpSettings>(this.apiUrl);
  }

  createSettings(settings: SmtpSettings): Observable<SmtpSettings> {
    return this.http.post<SmtpSettings>(this.apiUrl, settings);
  }

  updateSettings(settings: SmtpSettings): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${settings.id}`, settings);
  }
}

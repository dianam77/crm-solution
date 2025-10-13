import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ChatMessage, CreateChatMessageDto } from '../models/ChatMessage';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'https://localhost:44386/api/chat';

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwtToken');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  getMessages(conversationId?: number): Observable<ChatMessage[]> {
    let url = `${this.apiUrl}/messages`;
    if (conversationId !== undefined) url += `?conversationId=${conversationId}`;
    return this.http.get<ChatMessage[]>(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(err => throwError(() => err)));
  }

  sendMessage(dto: CreateChatMessageDto): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.apiUrl}/messages`, dto, { headers: this.getAuthHeaders() })
      .pipe(catchError(err => throwError(() => err)));
  }

  markAsRead(messageId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/messages/${messageId}/read`, {}, { headers: this.getAuthHeaders() })
      .pipe(catchError(err => throwError(() => err)));
  }

  hideMessage(messageId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/messages/${messageId}/hide`, {}, { headers: this.getAuthHeaders() })
      .pipe(catchError(err => throwError(() => err)));
  }
}

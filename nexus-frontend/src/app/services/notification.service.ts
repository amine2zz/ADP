import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new BehaviorSubject<Notification>({
    message: '',
    type: 'info',
    show: false
  });

  notification$ = this.notificationSubject.asObservable();

  show(message: string, type: 'success' | 'error' | 'info' = 'success') {
    this.notificationSubject.next({ message, type, show: true });
    setTimeout(() => {
      this.hide();
    }, 5000);
  }

  hide() {
    this.notificationSubject.next({ ...this.notificationSubject.value, show: false });
  }
}

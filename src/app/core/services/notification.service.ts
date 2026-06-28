import { Injectable, inject, signal } from '@angular/core';
import { Messaging, getToken, onMessage } from '@angular/fire/messaging';
import { Firestore, doc, updateDoc, arrayUnion } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private messaging = inject(Messaging);
  private firestore = inject(Firestore);
  private auth      = inject(AuthService);

  // Estado para la UI
  readonly permission = signal<NotificationPermission | 'unsupported'>(this.currentPermission());
  readonly foregroundMsg = signal<{ title: string; body: string } | null>(null);

  private currentPermission(): NotificationPermission | 'unsupported' {
    if (typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission;
  }

  /** ¿Está configurada la clave VAPID? (si no, la feature queda oculta) */
  isConfigured(): boolean {
    return !!environment.vapidKey;
  }

  /** ¿El navegador/dispositivo soporta push? (iOS solo en PWA instalada, iOS 16.4+) */
  isSupported(): boolean {
    return typeof Notification !== 'undefined' && 'serviceWorker' in navigator;
  }

  /** Pide permiso, obtiene el token FCM y lo guarda en el perfil del usuario. */
  async enable(): Promise<{ ok: boolean; reason?: string }> {
    if (!this.isConfigured() || !this.isSupported()) return { ok: false, reason: 'unsupported' };

    try {
      const perm = await Notification.requestPermission();
      this.permission.set(perm);
      if (perm !== 'granted') return { ok: false, reason: 'denied' };

      // Registrar el SW de FCM en un scope propio para no pisar el ngsw de Angular
      const swReg = await navigator.serviceWorker.register('firebase-messaging-sw.js', {
        scope: '/firebase-cloud-messaging-push-scope',
      });

      const token = await getToken(this.messaging, {
        vapidKey: environment.vapidKey,
        serviceWorkerRegistration: swReg,
      });
      if (!token) return { ok: false, reason: 'no-token' };

      // Guardar token en users/{uid}.fcmTokens
      const uid = this.auth.currentUser()?.uid;
      if (uid) {
        await updateDoc(doc(this.firestore, 'users', uid), {
          fcmTokens: arrayUnion(token),
        });
      }
      this.listenForeground();
      return { ok: true };
    } catch (e: any) {
      console.error('Error activando notificaciones:', e);
      return { ok: false, reason: e?.message ?? 'error' };
    }
  }

  /** Mensajes recibidos con la app abierta (foreground). */
  listenForeground(): void {
    try {
      onMessage(this.messaging, payload => {
        this.foregroundMsg.set({
          title: payload.notification?.title ?? '⚽ La Quiniela Vinotinto',
          body:  payload.notification?.body  ?? 'Tenés un partido sin predecir.',
        });
        setTimeout(() => this.foregroundMsg.set(null), 6000);
      });
    } catch { /* messaging no disponible */ }
  }
}

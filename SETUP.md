# World Cup Predictor 2026 — Guía de configuración

## 1. Crear proyecto Firebase

1. Ir a https://console.firebase.google.com → "Crear proyecto"
2. Nombre: `world-cup-predictor`
3. Habilitar **Google Analytics** (opcional)

### 1.1 Habilitar Authentication
- Firebase Console → Authentication → Comenzar
- Proveedores: habilitar **Email/Contraseña** y **Google**

### 1.2 Crear base de datos Firestore
- Firebase Console → Firestore Database → Crear base de datos
- Modo: **Producción** (reglas seguras)
- Ubicación: `us-east1` (o la más cercana)

### 1.3 Obtener credenciales
- Firebase Console → ⚙️ Configuración del proyecto → Tus apps → Agregar app web
- Copiar el objeto `firebaseConfig`

---

## 2. Configurar el proyecto

Editar `src/environments/environment.ts` con tus datos reales:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey:            'tu-api-key',
    authDomain:        'tu-proyecto.firebaseapp.com',
    projectId:         'tu-proyecto',
    storageBucket:     'tu-proyecto.appspot.com',
    messagingSenderId: '123456789',
    appId:             '1:123:web:abc123',
  },
  footballApiKey:  'tu-token-football-data-org',
  footballApiUrl:  'https://api.football-data.org/v4',
  competitionCode: 'WC',
};
```

Hacer lo mismo en `src/environments/environment.prod.ts`.

---

## 3. Desplegar reglas de Firestore

```bash
# Instalar Firebase CLI (si no lo tenés)
npm install -g firebase-tools

# Login
firebase login

# Inicializar (seleccionar Firestore)
firebase init firestore

# Desplegar reglas e índices
firebase deploy --only firestore
```

---

## 4. Configurar GitHub Actions (cálculo automático)

En tu repositorio GitHub → Settings → Secrets and variables → Actions:

| Secret | Valor |
|--------|-------|
| `FOOTBALL_API_KEY` | Token de football-data.org |
| `FIREBASE_PROJECT_ID` | ID del proyecto Firebase |
| `FIREBASE_API_KEY` | API Key pública de Firebase |

El workflow se ejecutará automáticamente cada 30 minutos.

**Ejecución manual:** GitHub → Actions → "Sincronizar Resultados Mundial 2026" → Run workflow

---

## 5. Primera sincronización de partidos

Desde el **Panel de Admin** (necesitás rol admin):
1. Iniciar sesión
2. Ir a `/admin`
3. Click en "Sincronizar partidos" → importa todos los 104 partidos del Mundial
4. Listo 🎉

**Para darte rol admin en Firestore:**
- Ir a Firestore Console → Colección `users` → tu documento → editar campo `role` = `admin`

---

## 6. Comandos de desarrollo

```bash
# Desarrollo local
npm start

# Build producción
npm run build

# Sincronización manual (sin GitHub Actions)
FOOTBALL_API_KEY=xxx FIREBASE_PROJECT_ID=yyy FIREBASE_API_KEY=zzz node scripts/sync-results.js
```

---

## 7. Deploy a producción (Firebase Hosting - gratis)

```bash
firebase init hosting
# Public directory: dist/world-cup-predictor/browser
# Single-page app: YES
# Overwrites index.html: NO

npm run build
firebase deploy --only hosting
```

---

## Sistema de puntos

| Resultado | Puntos |
|-----------|--------|
| 🎯 Marcador exacto | +15 |
| ✓ Ganador + diferencia de goles | +10 |
| ~ Solo ganador o empate | +5 |

**Corte de predicciones:** 30 minutos antes del pitido inicial.

---

## Estructura del proyecto

```
src/app/
├── core/           # Servicios, modelos, guards
├── features/       # Pantallas: auth, home, my-bets, ranking, profile, admin
├── shared/         # Componentes reutilizables, pipes
└── layout/         # Navbar, footer, shell
```

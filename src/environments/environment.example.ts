// Copiá este archivo como environment.ts y environment.prod.ts
// y completá con tus propias credenciales

export const environment = {
  production: false,
  firebase: {
    apiKey:            'YOUR_API_KEY',
    authDomain:        'YOUR_PROJECT.firebaseapp.com',
    projectId:         'YOUR_PROJECT_ID',
    storageBucket:     'YOUR_PROJECT.firebasestorage.app',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId:             'YOUR_APP_ID',
  },
  footballApiKey:  'YOUR_FOOTBALL_DATA_API_KEY',
  footballApiUrl:  'https://api.football-data.org/v4',
  competitionCode: 'WC',
};

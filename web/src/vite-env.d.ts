/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_MAPBOX_ACCESS_TOKEN: string;
  readonly VITE_MAPBOX_STYLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
}

interface Window {
  APP_CONFIG?: { apiUrl?: string }
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

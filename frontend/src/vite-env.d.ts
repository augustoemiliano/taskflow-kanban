/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** "true" builds the browser-only demo (no back-end; data kept in localStorage). */
  readonly VITE_DEMO_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

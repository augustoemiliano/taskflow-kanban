import { createBrowserStorage } from "./browserStorage";
import { createLocalTaskApi, type LocalTaskApi } from "./localTaskApi";

export const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";

let demoTaskApi: LocalTaskApi | null = null;

/** Lazily creates the singleton used by the demo build (shared by the board and the banner). */
export const getDemoTaskApi = (): LocalTaskApi => {
  demoTaskApi ??= createLocalTaskApi({ storage: createBrowserStorage() });
  return demoTaskApi;
};

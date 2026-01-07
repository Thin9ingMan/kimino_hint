import {
  AuthenticationApi,
  Configuration,
  EventsApi,
  FriendshipsApi,
  ProfilesApi,
  UsersApi,
} from "@yuki-js/quarkus-crud-js-fetch-client";

import { getJwtToken } from "./tokenStorage";

const DEFAULT_BASE_URL = "https://quarkus-crud.ouchiserver.aokiapp.com";

export function getApiBaseUrl(): string {
  return (
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
    DEFAULT_BASE_URL
  );
}

export function createApiConfig(): Configuration {
  return new Configuration({
    basePath: getApiBaseUrl(),
    // The generated client accepts either a string or a function returning a string/Promise.
    accessToken: async () => getJwtToken() ?? undefined,
  });
}

// Singleton instances. Token is read dynamically via accessToken(), so it remains up-to-date.
const config = createApiConfig();

export const apis = {
  config,
  auth: new AuthenticationApi(config),
  profiles: new ProfilesApi(config),
  users: new UsersApi(config),
  events: new EventsApi(config),
  friendships: new FriendshipsApi(config),
} as const;

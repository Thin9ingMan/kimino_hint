// Centralized OpenAPI client factory. Reads base URL from Vite env VITE_API_BASE_URL and attaches JWT via localStorage.
import { Configuration, AuthenticationApi, ProfilesApi, UsersApi, EventsApi, FriendshipsApi } from "@yuki-js/quarkus-crud-js-fetch-client";

const BASE_PATH = import.meta.env.VITE_API_BASE_URL || "https://quarkus-crud.ouchiserver.aokiapp.com";

export const createConfig = () =>
  new Configuration({
    basePath: BASE_PATH,
    accessToken: async () => localStorage.getItem("jwtToken") || "",
  });

export const apis = {
  auth: () => new AuthenticationApi(createConfig()),
  profiles: () => new ProfilesApi(createConfig()),
  users: () => new UsersApi(createConfig()),
  events: () => new EventsApi(createConfig()),
  friendships: () => new FriendshipsApi(createConfig()),
};
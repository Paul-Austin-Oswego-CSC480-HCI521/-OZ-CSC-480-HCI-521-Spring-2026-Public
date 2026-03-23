import axios, { type CreateAxiosDefaults } from "axios";
import { getDefaultStore } from "jotai";
import { tokenAtom } from "../../context/state";

const store = getDefaultStore();

export function createClient(baseURL: string) {
  const client = axios.create({ baseURL });

  client.interceptors.request.use((config) => {
    const raw = localStorage.getItem("csc_480_token");
    if (raw) {
      const token = JSON.parse(raw);
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // once token expires, redirect to login again

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem("csc_480_token");
        store.set(tokenAtom, null);
        document.cookie =
          "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.href = "/signin";
      }
      return Promise.reject(error);
    },
  );

  return client;
}

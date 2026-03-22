import axios, { type CreateAxiosDefaults } from "axios";
import { getDefaultStore } from "jotai";
import { tokenAtom } from "../../context/state";

const store = getDefaultStore();

export function createClient(baseURL: string) {
  const client = axios.create({ baseURL });

  client.interceptors.request.use((config) => {
    const token = store.get(tokenAtom);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return client;
}

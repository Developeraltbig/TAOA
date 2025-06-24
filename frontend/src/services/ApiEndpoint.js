import axios from "axios";

const backendURL = import.meta.env.VITE_BACKEND_URL;
export const instance = axios.create({
  baseURL: backendURL,
  withCredentials: true,
});

export const get = (url, params) => instance.get(url, { params });
export const post = (url, data) => instance.post(url, data);
export const put = (url, data) => instance.put(url, data);
export const delet = (url) => instance.delete(url);

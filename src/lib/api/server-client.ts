import axios from 'axios';
import { getAccessToken } from '@/lib/auth/session';
import { API_BASE_URL } from '@/constants';

const serverApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

serverApiClient.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// No auto-refresh on server side to avoid loops/complexity as per MD
// serverApiClient.interceptors.response.use(
//   (response) => response,
//   (error) => Promise.reject(error)
// );

export default serverApiClient;

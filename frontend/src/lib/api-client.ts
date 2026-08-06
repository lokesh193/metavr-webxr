import axios from 'axios';

function getApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // On Vercel production HTTPS deployment, route to the active HTTPS tunnel URL
    if (hostname.includes('vercel.app')) {
      return 'https://stupid-dingos-build.loca.lt/api';
    }
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:5000/api`;
    }
  }
  return 'http://localhost:5000/api';
}

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    config.baseURL = getApiBaseUrl();
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Add bypass header for localtunnel proxy page
      config.headers['Bypass-Tunnel-Remainder'] = 'true';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

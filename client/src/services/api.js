const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== 'undefined') {
      const currentPath = `${window.location.pathname}${window.location.search || ''}`;
      const redirect = encodeURIComponent(currentPath || '/');
      if (!window.location.pathname.startsWith('/signup')) {
        window.location.assign(`/signup?redirect=${redirect}`);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
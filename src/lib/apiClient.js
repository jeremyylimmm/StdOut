// Centralized API client configuration
// Uses VITE_API_BASE_URL from environment variables

export const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";
};

export const makeAuthUrl = (endpoint) => {
  return `${getApiBaseUrl()}/auth${endpoint}`;
};

export const makeInterviewUrl = (endpoint) => {
  return `${getApiBaseUrl()}/interviews${endpoint}`;
};

export const makeQuestionUrl = (endpoint) => {
  return `${getApiBaseUrl()}/questions${endpoint}`;
};

export const makeReviewUrl = (endpoint) => {
  return `${getApiBaseUrl()}/review${endpoint}`;
};

export const makeTranscribeUrl = (endpoint) => {
  return `${getApiBaseUrl()}/transcribe${endpoint}`;
};

export const makeRealTimeUrl = (endpoint) => {
  return `${getApiBaseUrl()}/realTime${endpoint}`;
};

export const makeRunUrl = () => {
  return `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}/run`;
};

// API Configuration - uses environment variable with fallback for development
const API_BASE_URL =
  import.meta.env.REACT_APP_API_URL || "http://localhost:3001";

export default API_BASE_URL;

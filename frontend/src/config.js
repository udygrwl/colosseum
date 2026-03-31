// In monorepo mode, API is served from the same origin (no CORS needed)
const API_BASE = import.meta.env.VITE_API_URL || ''
export default API_BASE

const API_BASE = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && window.location.hostname.includes('railway.app')
    ? 'https://colosseum-production-fce9.up.railway.app'
    : 'http://localhost:8000'
)
export default API_BASE

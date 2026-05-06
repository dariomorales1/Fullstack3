export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'; //revisar

export const KPI_THRESHOLDS = {
    SUCCESS: 100,
    WARNING: 80,
    CRITICAL: 50
};

export const REFRESH_INTERVAL = 30000;
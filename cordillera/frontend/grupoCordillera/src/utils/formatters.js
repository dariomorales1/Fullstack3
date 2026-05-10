export const formatCurrency = (value) => {
    const amount = Number(value ?? 0);
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        maximumFractionDigits: 0,
    }).format(amount);
};

export const formatCompactNumber = (value) => {
    const amount = Number(value ?? 0);
    return new Intl.NumberFormat('es-CL', {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(amount);
};

export const formatDate = (value, options = {}) => {
    if (!value) {
        return 'Sin fecha';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return new Intl.DateTimeFormat('es-CL', {
        dateStyle: 'medium',
        ...options,
    }).format(date);
};

export const formatDateTime = (value) => {
    if (!value) {
        return 'Sin fecha';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return new Intl.DateTimeFormat('es-CL', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
};

export const titleCase = (value) => {
    if (!value) {
        return '';
    }

    return String(value)
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const safeJsonParse = (value, fallback = null) => {
    if (!value || typeof value !== 'string') {
        return fallback;
    }

    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
};

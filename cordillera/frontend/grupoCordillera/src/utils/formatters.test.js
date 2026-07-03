import { describe, it, expect } from 'vitest';
import {
    formatCurrency,
    formatCompactNumber,
    formatDate,
    formatDateTime,
    titleCase,
    safeJsonParse,
} from './formatters';

describe('formatCurrency', () => {
    it('formatea numero positivo en CLP', () => {
        const result = formatCurrency(1500000);
        expect(result).toContain('1.500.000');
    });

    it('formatea cero', () => {
        const result = formatCurrency(0);
        expect(result).toContain('0');
    });

    it('maneja null usando 0 por defecto', () => {
        const result = formatCurrency(null);
        expect(result).toContain('0');
    });

    it('maneja undefined usando 0 por defecto', () => {
        const result = formatCurrency(undefined);
        expect(result).toContain('0');
    });
});

describe('formatCompactNumber', () => {
    it('formatea numero grande de forma compacta', () => {
        const result = formatCompactNumber(1500000);
        expect(result).toMatch(/1[,.]?5\s?M/i);
    });

    it('maneja cero', () => {
        const result = formatCompactNumber(0);
        expect(result).toContain('0');
    });
});

describe('formatDate', () => {
    it('formatea fecha ISO a formato legible', () => {
        const result = formatDate('2026-01-15T10:30:00');
        expect(result).toContain('2026');
        expect(result).toContain('15');
    });

    it('retorna Sin fecha cuando value es null', () => {
        expect(formatDate(null)).toBe('Sin fecha');
    });

    it('retorna Sin fecha cuando value es undefined', () => {
        expect(formatDate(undefined)).toBe('Sin fecha');
    });

    it('retorna el valor como string si la fecha es invalida', () => {
        expect(formatDate('not-a-date')).toBe('not-a-date');
    });
});

describe('formatDateTime', () => {
    it('formatea fecha con hora', () => {
        const result = formatDateTime('2026-06-07T14:30:00');
        expect(result).toContain('2026');
    });

    it('retorna Sin fecha cuando value es null', () => {
        expect(formatDateTime(null)).toBe('Sin fecha');
    });
});

describe('titleCase', () => {
    it('convierte snake_case a Title Case', () => {
        expect(titleCase('KPI_MENSUAL')).toBe('Kpi Mensual');
    });

    it('convierte texto en minusculas a Title Case', () => {
        expect(titleCase('ventas por sucursal')).toBe('Ventas Por Sucursal');
    });

    it('retorna string vacio cuando value es null', () => {
        expect(titleCase(null)).toBe('');
    });

    it('retorna string vacio cuando value es undefined', () => {
        expect(titleCase(undefined)).toBe('');
    });
});

describe('safeJsonParse', () => {
    it('parsea JSON valido', () => {
        expect(safeJsonParse('{"id":1}')).toEqual({ id: 1 });
    });

    it('retorna fallback para JSON invalido', () => {
        expect(safeJsonParse('not-json')).toBeNull();
    });

    it('retorna fallback personalizado para JSON invalido', () => {
        expect(safeJsonParse('bad', [])).toEqual([]);
    });

    it('retorna fallback cuando value es null', () => {
        expect(safeJsonParse(null)).toBeNull();
    });

    it('retorna fallback cuando value no es string', () => {
        expect(safeJsonParse(123)).toBeNull();
    });
});

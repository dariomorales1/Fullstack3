import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
    it('renderiza CUMPLIDO con clase verde', () => {
        const { container } = render(<StatusBadge status="CUMPLIDO" />);
        const span = container.querySelector('span');
        expect(span.className).toContain('emerald');
    });

    it('renderiza EN_RIESGO con clase amarilla', () => {
        const { container } = render(<StatusBadge status="EN_RIESGO" />);
        const span = container.querySelector('span');
        expect(span.className).toContain('yellow');
    });

    it('renderiza CRITICO con clase roja', () => {
        const { container } = render(<StatusBadge status="CRITICO" />);
        const span = container.querySelector('span');
        expect(span.className).toContain('red');
    });

    it('renderiza ERROR con clase roja', () => {
        const { container } = render(<StatusBadge status="ERROR" />);
        expect(container.querySelector('span').className).toContain('red');
    });

    it('renderiza EN_PROCESO con clase azul', () => {
        const { container } = render(<StatusBadge status="EN_PROCESO" />);
        expect(container.querySelector('span').className).toContain('blue');
    });

    it('renderiza estado desconocido con clase slate', () => {
        const { container } = render(<StatusBadge status="DESCONOCIDO" />);
        expect(container.querySelector('span').className).toContain('slate');
    });

    it('muestra el texto del status formateado', () => {
        render(<StatusBadge status="CUMPLIDO" />);
        expect(screen.getByText('Cumplido')).toBeInTheDocument();
    });
});

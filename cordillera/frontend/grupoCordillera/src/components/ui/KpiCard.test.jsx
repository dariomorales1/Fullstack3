import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KpiCard } from './KpiCard';

describe('KpiCard', () => {
    it('renderiza title y value', () => {
        render(<KpiCard title="Ventas Totales" value="$1.500.000" meta="3 operaciones" />);
        expect(screen.getByText('Ventas Totales')).toBeInTheDocument();
        expect(screen.getByText('$1.500.000')).toBeInTheDocument();
        expect(screen.getByText('3 operaciones')).toBeInTheDocument();
    });

    it('aplica el tone personalizado al meta', () => {
        const { container } = render(
            <KpiCard title="KPI" value="100%" meta="CUMPLIDO" tone="text-emerald-600" />
        );
        const metaEl = container.querySelector('.text-emerald-600');
        expect(metaEl).not.toBeNull();
        expect(metaEl.textContent).toBe('CUMPLIDO');
    });

    it('renderiza icono si se provee', () => {
        const MockIcon = (props) => <svg data-testid="icon" {...props} />;
        render(<KpiCard title="Test" value="0" meta="" icon={MockIcon} />);
        expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('no renderiza icono si no se provee', () => {
        render(<KpiCard title="Test" value="0" meta="" />);
        expect(screen.queryByTestId('icon')).toBeNull();
    });
});

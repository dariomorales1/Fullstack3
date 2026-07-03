import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext');

const renderWithRouter = (initialEntry = '/dashboard') =>
    render(
        <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<div>Dashboard</div>} />
                </Route>
                <Route path="/login" element={<div>Login Page</div>} />
            </Routes>
        </MemoryRouter>
    );

describe('ProtectedRoute', () => {
    it('renderiza children cuando isAuthenticated=true', () => {
        useAuth.mockReturnValue({ isAuthenticated: true, loading: false });
        renderWithRouter();
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('redirige a /login cuando isAuthenticated=false', () => {
        useAuth.mockReturnValue({ isAuthenticated: false, loading: false });
        renderWithRouter();
        expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('muestra spinner mientras loading=true', () => {
        useAuth.mockReturnValue({ isAuthenticated: false, loading: true });
        const { container } = renderWithRouter();
        expect(container.querySelector('.animate-spin')).not.toBeNull();
    });
});

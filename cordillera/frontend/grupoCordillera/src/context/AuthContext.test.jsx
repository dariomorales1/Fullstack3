import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

const TestConsumer = () => {
    const { isAuthenticated, user, token, login, logout } = useAuth();
    return (
        <div>
            <span data-testid="auth">{String(isAuthenticated)}</span>
            <span data-testid="user">{user?.email ?? 'null'}</span>
            <span data-testid="token">{token ?? 'null'}</span>
            <button onClick={() => login({ email: 'test@cordillera.cl' }, 'jwt-123')}>
                Login
            </button>
            <button onClick={logout}>Logout</button>
        </div>
    );
};

const renderWithProvider = () =>
    render(
        <AuthProvider>
            <TestConsumer />
        </AuthProvider>
    );

describe('AuthContext', () => {
    beforeEach(() => {
        window.sessionStorage.clear();
    });

    it('provee valores por defecto: isAuthenticated=false', async () => {
        renderWithProvider();
        await act(async () => {});
        expect(screen.getByTestId('auth').textContent).toBe('false');
    });

    it('login actualiza isAuthenticated a true y expone el usuario', async () => {
        renderWithProvider();
        await act(async () => {});

        await act(async () => {
            screen.getByText('Login').click();
        });

        expect(screen.getByTestId('auth').textContent).toBe('true');
        expect(screen.getByTestId('user').textContent).toBe('test@cordillera.cl');
        expect(screen.getByTestId('token').textContent).toBe('jwt-123');
    });

    it('logout limpia estado y vuelve a isAuthenticated=false', async () => {
        renderWithProvider();
        await act(async () => {});

        await act(async () => { screen.getByText('Login').click(); });
        await act(async () => { screen.getByText('Logout').click(); });

        expect(screen.getByTestId('auth').textContent).toBe('false');
        expect(screen.getByTestId('user').textContent).toBe('null');
    });

    it('token NO se guarda en localStorage sino en sessionStorage', async () => {
        renderWithProvider();
        await act(async () => {});
        await act(async () => { screen.getByText('Login').click(); });

        expect(window.localStorage.getItem('token')).toBeNull();
        expect(window.sessionStorage.getItem('token')).toBe('jwt-123');
    });
});

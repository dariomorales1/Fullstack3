import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authApi } from './authApi';
import { authAxios } from './axiosInstance';

vi.mock('./axiosInstance', () => ({
    authAxios: { get: vi.fn(), post: vi.fn() },
}));

describe('authApi', () => {
    beforeEach(() => vi.clearAllMocks());

    it('login llama POST /api/auth/login con credenciales', async () => {
        const mockResponse = { token: 'jwt-token', email: 'user@cordillera.cl' };
        authAxios.post.mockResolvedValue({ data: mockResponse });

        const result = await authApi.login({ email: 'user@cordillera.cl', password: '123456' });

        expect(authAxios.post).toHaveBeenCalledWith('/api/auth/login', {
            email: 'user@cordillera.cl',
            password: '123456',
        });
        expect(result.token).toBe('jwt-token');
    });

    it('login propaga error 401 para credenciales invalidas', async () => {
        authAxios.post.mockRejectedValue({ response: { status: 401 } });

        await expect(authApi.login({ email: 'x@x.cl', password: 'wrong' }))
            .rejects.toMatchObject({ response: { status: 401 } });
    });

    it('register llama POST /api/auth/register', async () => {
        authAxios.post.mockResolvedValue({ data: { token: 'abc' } });

        await authApi.register({ email: 'new@cordillera.cl', password: '123456' });

        expect(authAxios.post).toHaveBeenCalledWith('/api/auth/register', expect.any(Object));
    });
});

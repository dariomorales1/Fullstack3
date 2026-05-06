import React, { createContext, useState, useContext, useEffect } from 'react';
// import { authApi } from '../api/authApi'; // Descomentar cuando la API esté lista

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    const login = (userData, jwtToken) => {
        setUser(userData);
        setToken(jwtToken);
        window.sessionStorage.setItem('token', jwtToken);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        window.sessionStorage.removeItem('token');
    };

    useEffect(() => {
        const initializeAuth = async () => {
            const savedToken = window.sessionStorage.getItem('token');

            if (savedToken) {
                setToken(savedToken);

                /*
                // Lógica de recuperación de sesión (auth/me) preparada:
                try {
                  const userData = await authApi.getUserProfile();
                  setUser(userData);
                } catch (error) {
                  console.error("Sesión inválida o expirada");
                  logout();
                }
                */
            }

            setLoading(false);
        };

        initializeAuth().catch((err) => {
            console.error("Error crítico en la inicialización de Auth:", err);
            setLoading(false);
        });
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            logout,
            isAuthenticated: !!token,
            loading
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
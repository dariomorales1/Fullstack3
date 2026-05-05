import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
    const { isAuthenticated, loading } = useAuth();

    // Mientras el AuthContext verifica el token contra el BFF, mostramos un estado de carga
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
            </div>
        );
    }

    // Si no está autenticado, redirigimos al login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Si todo está bien, renderiza la ruta hija (el contenido de la página)
    return <Outlet />;
};

export default ProtectedRoute;
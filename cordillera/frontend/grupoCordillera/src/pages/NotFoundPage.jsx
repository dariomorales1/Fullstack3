import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
            <div className="max-w-md">
                <h1 className="text-9xl font-extrabold text-blue-900 opacity-20">404</h1>

                <div className="-mt-16">
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">
                        Página no encontrada
                    </h2>
                    <p className="text-gray-600 mb-8">
                        Lo sentimos, no pudimos encontrar la página que estás buscando.
                        Asegúrate de que la URL sea correcta o vuelve al inicio.
                    </p>

                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-blue-900 text-white font-semibold rounded-lg shadow-md hover:bg-blue-800 transition-colors duration-200"
                    >
                        Volver al Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
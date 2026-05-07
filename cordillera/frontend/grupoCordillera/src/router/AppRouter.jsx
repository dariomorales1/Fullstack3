import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import { PUBLIC_ROUTES, PRIVATE_ROUTES } from './routes';
import {AppLayout} from '../components/layout/AppLayout';
import NotFoundPage from '../pages/NotFoundPage';

const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<PublicRoute />}>
                    {PUBLIC_ROUTES.map((route) => {
                        const Component = route.element;
                        return (
                            <Route
                                key={route.path}
                                path={route.path}
                                element={<Component />}
                            />
                        );
                    })}
                </Route>

                <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                        {PRIVATE_ROUTES.map((route) => {
                            const Component = route.element;
                            return (
                                <Route
                                    key={route.path}
                                    path={route.path}
                                    element={<Component />}
                                />
                            );
                        })}
                    </Route>
                </Route>

                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;
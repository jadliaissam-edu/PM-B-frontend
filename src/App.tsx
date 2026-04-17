import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import AIPage from "./pages/AIPage";

function ProtectedRoute({ children }: { children: ReactNode }) {
    const token = localStorage.getItem("accessToken");
    return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                    path="/workspace"
                    element={(
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    )}
                />
                <Route
                    path="/ai"
                    element={(
                        <ProtectedRoute>
                            <AIPage />
                        </ProtectedRoute>
                    )}
                />
                <Route path="/" element={<Navigate to="/workspace" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
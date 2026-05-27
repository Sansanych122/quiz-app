import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Імпорт всіх сторінок
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

import HomePage from './pages/HomePage'; // Твій поточний Dashboard з курсами
import CoursePage from './pages/CoursePage';
import QuizPage from './pages/QuizPage';
import AddCoursePage from './pages/AddCoursePage';

// Компонент для захисту приватних маршрутів (тільки для авторизованих)
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-blue-600 font-medium animate-pulse">Завантаження...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* === ПУБЛІЧНІ МАРШРУТИ === */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />

        {/* === ПРИВАТНІ МАРШРУТИ === */}
        {/* Головна панель з курсами тепер живе на /dashboard */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <HomePage /> 
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/add-course" 
          element={
            <PrivateRoute>
              <AddCoursePage />
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/course/:courseId" 
          element={
            <PrivateRoute>
              <CoursePage />
            </PrivateRoute>
          } 
        />
        
        {/* Маршрути для проходження тестів */}
        <Route 
          path="/test/:courseId" 
          element={
            <PrivateRoute>
              <QuizPage />
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/test/section/:sectionId" 
          element={
            <PrivateRoute>
              <QuizPage />
            </PrivateRoute>
          } 
        />

        {/* Глобальний редирект: якщо користувач ввів неіснуючий URL -> на головну */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
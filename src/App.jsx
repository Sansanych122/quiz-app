import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import CoursePage from './pages/CoursePage';
import QuizPage from './pages/QuizPage'; // ДОДАЛИ ІМПОРТ

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  return children;
};

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route 
        path="/auth" 
        element={user ? <Navigate to="/" replace /> : <AuthPage />} 
      />
      
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/course/:courseId" 
        element={
          <ProtectedRoute>
            <CoursePage />
          </ProtectedRoute>
        } 
      />

      {/* ПІДКЛЮЧИЛИ РЕАЛЬНУ СТОРІНКУ ТЕСТУВАННЯ */}
      <Route 
        path="/section/:sectionId" 
        element={
          <ProtectedRoute>
            <QuizPage />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}
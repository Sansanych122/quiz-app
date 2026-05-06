import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Імпорт всіх сторінок
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import CoursePage from './pages/CoursePage';
import QuizPage from './pages/QuizPage';
import AddCoursePage from './pages/AddCoursePage';

// Компонент для захисту приватних маршрутів (тільки для авторизованих)
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-primary font-medium">Завантаження...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      {/* Ми прибрали <Router> звідси, бо він вже є у main.jsx */}
      <Routes>
        {/* Публічний маршрут */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Приватні маршрути */}
        <Route 
          path="/" 
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
        <Route 
          path="/section/:sectionId" 
          element={
            <PrivateRoute>
              <QuizPage />
            </PrivateRoute>
          } 
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
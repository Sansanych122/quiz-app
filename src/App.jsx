import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import OfflineBanner from './components/OfflineBanner';

// Route-based Code Splitting (Lazy Loading)
const LandingPage = lazy(() => import('./pages/LandingPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));

const HomePage = lazy(() => import('./pages/HomePage'));
const CoursePage = lazy(() => import('./pages/CoursePage'));
const QuizPage = lazy(() => import('./pages/QuizPage'));
const AddCoursePage = lazy(() => import('./pages/AddCoursePage'));

// Fallback під час динамічного завантаження чанка роуту
const PageLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-brand-cream" role="status" aria-label="Завантаження сторінки">
    <div className="flex flex-col items-center gap-3 text-brand-sage animate-fade-in">
      <div className="w-8 h-8 rounded-full border-2 border-brand-sage/20 border-t-brand-sage animate-spin" />
      <span className="text-xs font-semibold text-brand-dark/70 uppercase tracking-wider">Завантаження...</span>
    </div>
  </div>
);

// Компонент для захисту приватних маршрутів (тільки для авторизованих)
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <PageLoadingFallback />;
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <OfflineBanner />
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            {/* === ПУБЛІЧНІ МАРШРУТИ === */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />

            {/* === ПРИВАТНІ МАРШРУТИ === */}
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

            {/* Глобальний редирект */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;

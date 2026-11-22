import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, AlertCircle, Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';
import { useToast } from '../components/Toast';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');
  const [nickname, setNickname] = useState('');

  // Стани для видимості паролів
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRepeat, setShowPasswordRepeat] = useState(false);

  // Валідація після першого blur
  const [touched, setTouched] = useState({});

  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  // Якщо користувач вже залогінений, перекидаємо на головну
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 8;
  const isPasswordRepeatValid = isLogin || (password === passwordRepeat && passwordRepeat.length > 0);
  const isNicknameValid = isLogin || nickname.trim().length >= 3;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Клієнтська валідація безпеки перед запитом
    if (!isLogin) {
      if (nickname.trim().length < 3) {
        setError('Нікнейм має містити мінімум 3 символи');
        return;
      }
      if (password.length < 8) {
        setError('Пароль має містити щонайменше 8 символів');
        return;
      }
      if (password !== passwordRepeat) {
        setError('Паролі не співпадають');
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        addToast({ message: 'Успішний вхід!', type: 'success' });
        navigate('/dashboard'); 
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nickname: nickname.trim() } },
        });
        if (signUpError) throw signUpError;
        addToast({ message: 'Акаунт успішно створено!', type: 'success' });
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.message === 'Invalid login credentials' 
        ? 'Невірний email або пароль' 
        : err.message.includes('already registered')
        ? 'Користувач із такою поштою вже існує'
        : err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'Не вдалося увійти через Google');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-brand-cream relative overflow-hidden font-sans selection:bg-brand-sage/20 selection:text-brand-dark">
      <SEO 
        title={isLogin ? "Увійти — UniQuiz" : "Реєстрація — UniQuiz"}
        description="Увійдіть до особистого кабінету UniQuiz або створіть новий акаунт для розумного навчання з AI."
        canonical="https://uniquiz.pages.dev/auth"
      />

      <div className="w-full max-w-md relative z-10">
        
        {/* Лого / Заголовок поверх картки */}
        <div className="text-center mb-8">
          <div className="mb-3">
            <span className="text-3xl sm:text-4xl font-bold tracking-tight text-brand-dark">
              Uni<span className="text-brand-sage">Quiz</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark tracking-tight">
            {isLogin ? 'З поверненням!' : 'Створіть акаунт'}
          </h1>
          <p className="text-sm text-brand-dark/70 mt-1.5 font-normal">
            {isLogin ? 'Увійдіть, щоб продовжити навчання' : 'Твій крок до розумного навчання з AI'}
          </p>
        </div>

        {/* Основна картка */}
        <div className="bg-white p-7 sm:p-9 rounded-[20px] border border-[#152A32]/10 shadow-soft">
          
          {error && (
            <div 
              role="alert" 
              className="mb-5 p-3.5 bg-brand-terracotta/10 border border-brand-terracotta/20 rounded-[12px] flex items-start gap-2.5 text-brand-terracotta text-sm font-medium animate-fade-in"
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-brand-terracotta" />
              <p className="leading-snug">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            
            {/* Поле Нікнейм (тільки реєстрація) */}
            {!isLogin && (
              <div>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark/40 group-focus-within:text-brand-sage transition-colors pointer-events-none">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    onBlur={() => handleBlur('nickname')}
                    placeholder="Ваш нікнейм (від 3 символів)"
                    className={`w-full pl-11 pr-4 h-[48px] sm:h-[50px] rounded-[12px] bg-white border text-sm font-medium text-brand-dark placeholder:text-brand-dark/40 outline-none transition-all ${
                      touched.nickname && !isNicknameValid
                        ? 'border-brand-terracotta focus:ring-4 focus:ring-brand-terracotta/20'
                        : 'border-[#152A32]/15 focus:border-brand-sage focus:ring-4 focus:ring-brand-sage/20'
                    }`}
                  />
                </div>
                {touched.nickname && !isNicknameValid && (
                  <p className="text-xs text-brand-terracotta mt-1.5 ml-1">Нікнейм має містити мінімум 3 символи</p>
                )}
              </div>
            )}

            {/* Поле Email */}
            <div>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark/40 group-focus-within:text-brand-sage transition-colors pointer-events-none">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur('email')}
                  placeholder="Електронна пошта"
                  className={`w-full pl-11 pr-4 h-[48px] sm:h-[50px] rounded-[12px] bg-white border text-sm font-medium text-brand-dark placeholder:text-brand-dark/40 outline-none transition-all ${
                    touched.email && email.length > 0 && !isEmailValid
                      ? 'border-brand-terracotta focus:ring-4 focus:ring-brand-terracotta/20'
                      : 'border-[#152A32]/15 focus:border-brand-sage focus:ring-4 focus:ring-brand-sage/20'
                  }`}
                />
              </div>
              {touched.email && email.length > 0 && !isEmailValid && (
                <p className="text-xs text-brand-terracotta mt-1.5 ml-1">Введіть коректну електронну адресу</p>
              )}
            </div>

            {/* Поле Пароль */}
            <div>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark/40 group-focus-within:text-brand-sage transition-colors pointer-events-none">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur('password')}
                  placeholder={isLogin ? "Пароль" : "Пароль (від 8 символів)"}
                  className={`w-full pl-11 pr-11 h-[48px] sm:h-[50px] rounded-[12px] bg-white border text-sm font-medium text-brand-dark placeholder:text-brand-dark/40 outline-none transition-all ${
                    !isLogin && touched.password && !isPasswordValid
                      ? 'border-brand-terracotta focus:ring-4 focus:ring-brand-terracotta/20'
                      : 'border-[#152A32]/15 focus:border-brand-sage focus:ring-4 focus:ring-brand-sage/20'
                  }`}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-dark/40 hover:text-brand-dark transition-colors focus:outline-none p-1"
                  aria-label={showPassword ? "Сховати пароль" : "Показати пароль"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {!isLogin && touched.password && !isPasswordValid && (
                <p className="text-xs text-brand-terracotta mt-1.5 ml-1">Пароль має містити щонайменше 8 символів</p>
              )}
            </div>

            {/* Поле Повторення пароля (тільки реєстрація) */}
            {!isLogin && (
              <div>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark/40 group-focus-within:text-brand-sage transition-colors pointer-events-none">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPasswordRepeat ? "text" : "password"}
                    required
                    value={passwordRepeat}
                    onChange={(e) => setPasswordRepeat(e.target.value)}
                    onBlur={() => handleBlur('passwordRepeat')}
                    placeholder="Повторіть пароль"
                    className={`w-full pl-11 pr-11 h-[48px] sm:h-[50px] rounded-[12px] bg-white border text-sm font-medium text-brand-dark placeholder:text-brand-dark/40 outline-none transition-all ${
                      touched.passwordRepeat && !isPasswordRepeatValid
                        ? 'border-brand-terracotta focus:ring-4 focus:ring-brand-terracotta/20'
                        : 'border-[#152A32]/15 focus:border-brand-sage focus:ring-4 focus:ring-brand-sage/20'
                    }`}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPasswordRepeat(!showPasswordRepeat)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-dark/40 hover:text-brand-dark transition-colors focus:outline-none p-1"
                    aria-label={showPasswordRepeat ? "Сховати повторення пароля" : "Показати повторення пароля"}
                  >
                    {showPasswordRepeat ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {touched.passwordRepeat && !isPasswordRepeatValid && (
                  <p className="text-xs text-brand-terracotta mt-1.5 ml-1">Паролі не співпадають</p>
                )}
              </div>
            )}

            {/* Кнопка відправки форми */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full h-[48px] sm:h-[50px] mt-2 rounded-[12px] font-bold text-sm sm:text-base transition-all duration-200 shadow-soft hover:shadow-soft-hover active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-60 ${
                isLogin
                  ? 'bg-brand-dark hover:bg-brand-dark-hover text-brand-cream'
                  : 'bg-brand-sage hover:bg-brand-sage-hover text-brand-cream'
              }`}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-brand-cream/30 border-t-brand-cream animate-spin" />
                  <span>Зачекайте...</span>
                </div>
              ) : isLogin ? (
                <>Увійти <ArrowRight size={18} /></>
              ) : (
                <>Створити акаунт <UserPlus size={18} /></>
              )}
            </button>
          </form>

          {/* Розділювач */}
          <div className="mt-6 mb-5 flex items-center gap-4">
            <div className="flex-1 h-px bg-[#152A32]/10"></div>
            <span className="text-xs font-semibold text-brand-dark/40 uppercase tracking-wider">або</span>
            <div className="flex-1 h-px bg-[#152A32]/10"></div>
          </div>

          {/* Кнопка Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-[48px] sm:h-[50px] bg-white border border-[#152A32]/15 hover:border-[#152A32]/30 hover:bg-[#152A32]/5 text-brand-dark rounded-[12px] font-semibold text-sm transition-all flex justify-center items-center gap-3 disabled:opacity-60 active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" className="shrink-0" aria-hidden="true">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238598)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
              </g>
            </svg>
            Продовжити з Google
          </button>
        </div>

        {/* Перемикач Вхід/Реєстрація */}
        <div className="mt-6 text-center relative z-10">
          <p className="text-brand-dark/70 font-normal text-sm">
            {isLogin ? 'Ще не маєте акаунту?' : 'Вже зареєстровані?'}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setPassword('');
                setPasswordRepeat('');
                setTouched({});
              }}
              className="ml-2 text-brand-sage hover:text-brand-sage-dark font-bold transition-colors focus:outline-none"
            >
              {isLogin ? 'Створити зараз' : 'Увійти'}
            </button>
          </p>
        </div>

        {/* Публічні юридичні посилання для Google OAuth */}
        <div className="mt-6 flex justify-center items-center gap-3 text-xs font-medium text-brand-dark/50 relative z-10">
          <a href="/privacy-policy" className="hover:text-brand-dark transition-colors">Політика конфіденційності</a>
          <span>•</span>
          <a href="/terms-of-service" className="hover:text-brand-dark transition-colors">Умови використання</a>
        </div>

      </div>
    </div>
  );
}

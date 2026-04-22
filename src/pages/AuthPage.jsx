import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Стейт форми
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');
  const [nickname, setNickname] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Логіка ВХОДУ
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        
      } else {
        // Логіка РЕЄСТРАЦІЇ
        if (password !== passwordRepeat) {
          throw new Error('Паролі не співпадають');
        }
        if (nickname.trim().length < 3) {
          throw new Error('Нікнейм має містити мінімум 3 символи');
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nickname: nickname.trim(), // Передаємо нікнейм у метадані для нашого SQL-тригера
            },
          },
        });
        if (signUpError) throw signUpError;
      }
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'Невірний email або пароль' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Декоративні розмиті кола на фоні для красивого glassmorphism ефекту */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>

      <div className="glass-panel p-8 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-textMain tracking-tight">
            {isLogin ? 'З поверненням' : 'Створення акаунту'}
          </h1>
          <p className="text-sm text-textMuted mt-2">
            {isLogin ? 'Увійдіть, щоб продовжити навчання' : 'Зареєструйтесь для доступу до тестів'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
            <AlertCircle size={18} />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-textMuted uppercase tracking-wider mb-1">Нікнейм</label>
              <input
                type="text"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Наприклад, Diana"
                className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/40 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-textMuted uppercase tracking-wider mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/40 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-textMuted uppercase tracking-wider mb-1">Пароль</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/40 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-textMuted uppercase tracking-wider mb-1">Повторіть пароль</label>
              <input
                type="password"
                required
                value={passwordRepeat}
                onChange={(e) => setPasswordRepeat(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/40 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 bg-primary hover:bg-blue-600 text-white rounded-xl font-medium transition-colors shadow-sm flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {loading ? 'Зачекайте...' : isLogin ? <><LogIn size={18} /> Увійти</> : <><UserPlus size={18} /> Зареєструватися</>}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-sm text-textMuted hover:text-primary transition-colors"
          >
            {isLogin ? 'Немає акаунту? Створити' : 'Вже є акаунт? Увійти'}
          </button>
        </div>
      </div>
    </div>
  );
}
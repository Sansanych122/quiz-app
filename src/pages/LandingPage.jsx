import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 font-sans relative overflow-hidden flex flex-col selection:bg-blue-100">
      
      {/* Premium Glassmorphism Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-400/10 rounded-full mix-blend-multiply filter blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-[120px] pointer-events-none"></div>

      {/* ШАПКА — Тільки Лого та Увійти */}
      <header className="w-full max-w-7xl mx-auto px-6 py-8 relative z-10 flex justify-between items-center">
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-2xl font-black tracking-tighter text-slate-900 hover:opacity-80 transition-opacity focus:outline-none"
        >
          Uni<span className="text-blue-600">Quiz</span>
        </button>
        <button 
          onClick={() => navigate('/auth')} 
          className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-all px-4 py-2 hover:bg-slate-100 rounded-xl focus:outline-none"
        >
          Увійти
        </button>
      </header>

      {/* ОСНОВНИЙ КОНТЕНТ */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 relative z-10 flex flex-col pt-16 md:pt-24">
        
        {/* HERO СЕКЦІЯ */}
        <section className="text-center max-w-4xl mx-auto mb-32 custom-animate-fade-in">
          {/* Плавна шкала типографіки для різних екранів */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-slate-900 leading-[1.05] mb-8">
            Навчайся розумніше, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">не важче.</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-500 font-medium leading-relaxed mb-12 max-w-2xl mx-auto">
            UniQuiz перетворює твої лекції, конспекти та готові файли з тестами на інтерактивний тренажер. Використовуй розумний парсинг або довір створення тестів штучному інтелекту.
          </p>
          
          <button 
            onClick={() => navigate('/auth')} 
            className="group relative px-10 py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-lg transition-all shadow-2xl shadow-slate-900/20 active:scale-95 overflow-hidden focus:outline-none focus:ring-4 focus:ring-slate-900/10"
          >
            <span className="relative z-10">Почати безкоштовно</span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        </section>

        {/* ФУНКЦІОНАЛ — 6 карток у 3 колонки (на великих екранах) */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32">
          
          <div className="bg-white/40 backdrop-blur-xl p-8 lg:p-10 rounded-[2.5rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500">
            <h2 className="text-xl font-black text-slate-900 mb-4">Класичний імпорт тестів</h2>
            <p className="text-slate-500 font-medium leading-relaxed text-sm">
              Вже маєш готовий файл із тестами від викладача? Просто завантаж PDF, DOCX або TXT. Наш алгоритм миттєво розпізнає питання та варіанти відповідей, перетворивши їх на зручний тренажер.
            </p>
          </div>

          <div className="bg-white/40 backdrop-blur-xl p-8 lg:p-10 rounded-[2.5rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500">
            <h2 className="text-xl font-black text-slate-900 mb-4">AI Генерація з нуля</h2>
            <p className="text-slate-500 font-medium leading-relaxed text-sm">
              Немає готових тестів? Не проблема. Завантаж звичайний конспект чи лекцію, і штучний інтелект самостійно витягне ключові факти та згенерує повноцінний тестовий модуль для перевірки знань.
            </p>
          </div>

          <div className="bg-white/40 backdrop-blur-xl p-8 lg:p-10 rounded-[2.5rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500">
            <h2 className="text-xl font-black text-slate-900 mb-4">Робота над помилками</h2>
            <p className="text-slate-500 font-medium leading-relaxed text-sm">
              Алгоритм запам'ятовує твої слабкі місця. Переходь у спеціальний режим, щоб сфокусуватись лише на тих питаннях, які викликали труднощі, доки не засвоїш їх на 100%.
            </p>
          </div>

          <div className="bg-white/40 backdrop-blur-xl p-8 lg:p-10 rounded-[2.5rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500">
            <h2 className="text-xl font-black text-slate-900 mb-4">Динамічне перемішування</h2>
            <p className="text-slate-500 font-medium leading-relaxed text-sm">
              Уникай механічного звикання. При кожному новому проходженні система випадково перемішує як самі питання, так і розташування варіантів відповідей, змушуючи мозок справді аналізувати.
            </p>
          </div>

          <div className="bg-white/40 backdrop-blur-xl p-8 lg:p-10 rounded-[2.5rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500">
            <h2 className="text-xl font-black text-slate-900 mb-4">Детальна аналітика</h2>
            <p className="text-slate-500 font-medium leading-relaxed text-sm">
              Слідкуй за своїми результатами у реальному часі. Отримуй деталізовану статистику щодо кількості пройдених тестів, відсотка успішності та загального прогресу навчання.
            </p>
          </div>

          <div className="bg-white/40 backdrop-blur-xl p-8 lg:p-10 rounded-[2.5rem] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500">
            <h2 className="text-xl font-black text-slate-900 mb-4">Глобальний Leaderboard</h2>
            <p className="text-slate-500 font-medium leading-relaxed text-sm">
              Навчання — це теж змагання. Здобувай бали за правильні відповіді, підвищуй свій персональний рейтинг та змагайся з іншими студентами за першість на платформі.
            </p>
          </div>

        </section>

        {/* КОРОТКА ПЕРЕВАГА */}
        <section className="mb-32 py-20 border-y border-slate-100 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 tracking-tight">Тисячі тестів розпізнано та згенеровано</h2>
          <p className="text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">
            Приєднуйся до студентів, які вже змінили свій підхід до навчання. UniQuiz — це твій персональний асистент у підготовці до іспитів будь-якої складності.
          </p>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="w-full relative z-10 bg-white/50 backdrop-blur-md border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-xl font-black tracking-tighter text-slate-900 hover:opacity-80 transition-opacity focus:outline-none"
            >
              Uni<span className="text-blue-600">Quiz</span>
            </button>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Smart Education Era
            </p>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-4">
            <div className="flex gap-8 text-xs font-bold text-slate-500">
              <a href="/privacy-policy" className="hover:text-blue-600 transition-colors uppercase tracking-wider">Політика конфіденційності</a>
              <a href="/terms-of-service" className="hover:text-blue-600 transition-colors uppercase tracking-wider">Умови використання</a>
            </div>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
              © {new Date().getFullYear()} UniQuiz Platform. Всі права захищені.
            </p>
          </div>
        </div>
      </footer>

      {/* ЛОКАЛЬНІ СТИЛІ ДЛЯ АНІМАЦІЇ */}
      <style>{`
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .custom-animate-fade-in {
          animation: fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
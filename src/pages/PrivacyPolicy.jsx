import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-blue-100">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <button 
          onClick={() => navigate(-1)} 
          className="text-sm font-bold text-blue-600 hover:text-blue-800 mb-8 transition-colors"
        >
          &larr; Повернутися
        </button>
        
        <article className="bg-white p-8 sm:p-12 rounded-[2rem] shadow-sm border border-slate-200 prose prose-slate max-w-none">
          <h1 className="text-3xl font-black tracking-tight mb-2">Політика конфіденційності</h1>
          <p className="text-sm text-slate-500 font-medium mb-8">Останнє оновлення: {new Date().toLocaleDateString('uk-UA')}</p>
          
          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-3">1. Збір інформації</h2>
              <p className="text-slate-600 leading-relaxed">
                Ми збираємо мінімально необхідну інформацію для функціонування сервісу UniQuiz. Це включає вашу електронну адресу (для авторизації) та ім'я користувача (нікнейм). При використанні Google OAuth ми отримуємо лише базовий профіль.
              </p>
            </div>
            
            <div>
              <h2 className="text-xl font-bold mb-3">2. Використання даних та AI</h2>
              <p className="text-slate-600 leading-relaxed">
                Завантажені вами матеріали (конспекти, файли) використовуються виключно для генерації тестових завдань за допомогою технологій штучного інтелекту. Ми не використовуємо ваші особисті матеріали для навчання публічних моделей без вашої явної згоди.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">3. Захист даних</h2>
              <p className="text-slate-600 leading-relaxed">
                Ми використовуємо сучасні методи шифрування та безпечні сервери (Supabase) для зберігання вашої інформації та прогресу навчання.
              </p>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
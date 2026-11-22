import React from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-cream font-sans text-brand-dark selection:bg-brand-sage/20 selection:text-brand-dark">
      <SEO 
        title="Політика конфіденційності — UniQuiz"
        description="Політика конфіденційності освітньої платформи UniQuiz: правила обробки та захисту персональних даних."
        canonical="https://uniquiz.pages.dev/privacy-policy"
      />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <button 
          onClick={() => navigate(-1)} 
          className="text-sm font-semibold text-brand-sage hover:text-brand-sage-dark mb-8 transition-colors flex items-center gap-1 focus-visible:outline-none"
        >
          &larr; Повернутися
        </button>
        
        <article className="bg-white p-8 sm:p-12 rounded-[20px] shadow-soft border border-[#152A32]/10">
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-brand-dark">Політика конфіденційності</h1>
          <p className="text-sm text-brand-dark/60 font-medium mb-8">Останнє оновлення: {new Date().toLocaleDateString('uk-UA')}</p>
          
          <section className="space-y-6 text-brand-dark/80">
            <div>
              <h2 className="text-lg font-bold mb-2 text-brand-dark">1. Збір інформації</h2>
              <p className="leading-relaxed text-sm sm:text-base">
                Ми збираємо мінімально необхідну інформацію для функціонування сервісу UniQuiz. Це включає вашу електронну адресу (для авторизації) та ім'я користувача (нікнейм). При використанні Google OAuth ми отримуємо лише базовий профіль.
              </p>
            </div>
            
            <div>
              <h2 className="text-lg font-bold mb-2 text-brand-dark">2. Використання даних та AI</h2>
              <p className="leading-relaxed text-sm sm:text-base">
                Завантажені вами матеріали (конспекти, файли) використовуються виключно для генерації тестових завдань за допомогою технологій штучного інтелекту. Ми не використовуємо ваші особисті матеріали для навчання публічних моделей без вашої явної згоди.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold mb-2 text-brand-dark">3. Захист даних</h2>
              <p className="leading-relaxed text-sm sm:text-base">
                Ми використовуємо сучасні методи шифрування та безпечні сервери (Supabase) для зберігання вашої інформації та прогресу навчання.
              </p>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}

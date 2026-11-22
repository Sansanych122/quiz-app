import React from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-cream font-sans text-brand-dark selection:bg-brand-sage/20 selection:text-brand-dark">
      <SEO 
        title="Умови використання — UniQuiz"
        description="Умови використання сервісу UniQuiz: права та обов'язки користувачів платформи."
        canonical="https://uniquiz.pages.dev/terms-of-service"
      />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <button 
          onClick={() => navigate(-1)} 
          className="text-sm font-semibold text-brand-sage hover:text-brand-sage-dark mb-8 transition-colors flex items-center gap-1 focus-visible:outline-none"
        >
          &larr; Повернутися
        </button>
        
        <article className="bg-white p-8 sm:p-12 rounded-[20px] shadow-soft border border-[#152A32]/10">
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-brand-dark">Умови використання</h1>
          <p className="text-sm text-brand-dark/60 font-medium mb-8">Останнє оновлення: {new Date().toLocaleDateString('uk-UA')}</p>
          
          <section className="space-y-6 text-brand-dark/80">
            <div>
              <h2 className="text-lg font-bold mb-2 text-brand-dark">1. Прийняття умов</h2>
              <p className="leading-relaxed text-sm sm:text-base">
                Реєструючись на платформі UniQuiz, ви погоджуєтесь з цими умовами. Платформа надається "як є" для освітніх цілей.
              </p>
            </div>
            
            <div>
              <h2 className="text-lg font-bold mb-2 text-brand-dark">2. Контент користувача</h2>
              <p className="leading-relaxed text-sm sm:text-base">
                Ви несете відповідальність за матеріали, які завантажуєте для генерації тестів. Ви гарантуєте, що маєте право використовувати ці матеріали і вони не порушують авторські права третіх осіб.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold mb-2 text-brand-dark">3. Обліковий запис</h2>
              <p className="leading-relaxed text-sm sm:text-base">
                Ви зобов'язані зберігати конфіденційність свого пароля. У разі виявлення несанкціонованого доступу до вашого акаунту, ви повинні негайно повідомити нас.
              </p>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}

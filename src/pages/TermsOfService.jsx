import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TermsOfService() {
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
          <h1 className="text-3xl font-black tracking-tight mb-2">Умови використання</h1>
          <p className="text-sm text-slate-500 font-medium mb-8">Останнє оновлення: {new Date().toLocaleDateString('uk-UA')}</p>
          
          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-3">1. Прийняття умов</h2>
              <p className="text-slate-600 leading-relaxed">
                Реєструючись на платформі UniQuiz, ви погоджуєтесь з цими умовами. Платформа надається "як є" для освітніх цілей.
              </p>
            </div>
            
            <div>
              <h2 className="text-xl font-bold mb-3">2. Контент користувача</h2>
              <p className="text-slate-600 leading-relaxed">
                Ви несете відповідальність за матеріали, які завантажуєте для генерації тестів. Ви гарантуєте, що маєте право використовувати ці матеріали і вони не порушують авторські права третіх осіб.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-3">3. Обліковий запис</h2>
              <p className="text-slate-600 leading-relaxed">
                Ви зобов'язані зберігати конфіденційність свого пароля. У разі виявлення несанкціонованого доступу до вашого акаунту, ви повинні негайно повідомити нас.
              </p>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw } from 'lucide-react';
import SEO from '../components/SEO';

const DEMO_QUIZZES = {
  medicine: {
    title: 'Медицина',
    questions: [
      {
        question: 'Який вітамін синтезується в шкірі під дією ультрафіолету?',
        options: ['Вітамін C', 'Вітамін D', 'Вітамін K', 'Вітамін B12'],
        correct: 'Вітамін D',
        explanation: 'Під дією UVB-променів у шкірі утворюється вітамін D3.',
      },
      {
        question: 'Яка камера серця виштовхує кров, збагачену киснем, у велике коло кровообігу?',
        options: ['Ліве передсердя', 'Лівий шлуночок', 'Правий шлуночок', 'Праве передсердя'],
        correct: 'Лівий шлуночок',
        explanation: 'Лівий шлуночок виштовхує кров в аорту.',
      },
      {
        question: 'Який орган виробляє інсулін?',
        options: ['Печінка', 'Підшлункова залоза', 'Нирки', 'Щитоподібна залоза'],
        correct: 'Підшлункова залоза',
        explanation: 'Інсулін виробляють бета-клітини острівців Лангерганса.',
      },
    ],
  },
  history: {
    title: 'Історія України',
    questions: [
      {
        question: 'У якому році Верховна Рада ухвалила Акт проголошення незалежності України?',
        options: ['1989', '1991', '1994', '1996'],
        correct: '1991',
        explanation: 'Акт ухвалено 24 серпня 1991 року.',
      },
      {
        question: 'Хто став першим Президентом незалежної України?',
        options: ['Леонід Кучма', 'Віктор Ющенко', 'Леонід Кравчук', 'Михайло Грушевський'],
        correct: 'Леонід Кравчук',
        explanation: 'Леонід Кравчук обраний 1 грудня 1991 року.',
      },
      {
        question: 'Хто очолив національно-визвольну війну українського народу 1648–1657 рр.?',
        options: ['Іван Мазепа', 'Богдан Хмельницький', 'Петро Сагайдачний', 'Іван Виговський'],
        correct: 'Богдан Хмельницький',
        explanation: 'Хмельницький очолив повстання 1648 року, що переросло у війну.',
      },
    ],
  },
  engineering: {
    title: 'Інженерія',
    questions: [
      {
        question: 'В яких одиницях вимірюється електричний опір у системі СІ?',
        options: ['Вольт', 'Ампер', 'Ом', 'Ват'],
        correct: 'Ом',
        explanation: 'Одиниця опору — ом (Ом); 1 Ом = 1 В / 1 А.',
      },
      {
        question: 'Який елемент є основою сталі?',
        options: ['Алюміній', 'Мідь', 'Залізо', 'Нікель'],
        correct: 'Залізо',
        explanation: 'Сталь — це сплав заліза з вуглецем.',
      },
      {
        question: 'Що означає абревіатура CAD в інженерії?',
        options: [
          'Central Automated Drafting',
          'Computer-Aided Design',
          'Control And Data',
          'Calculated Assembly Diagram',
        ],
        correct: 'Computer-Aided Design',
        explanation: 'CAD — система автоматизованого проєктування.',
      },
    ],
  },
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Стан інтерактивного Демо-тренажера
  const [activeCategory, setActiveCategory] = useState('medicine');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [focusedOptionIndex, setFocusedOptionIndex] = useState(0);
  const optionsRefs = useRef([]);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const currentQuestions = DEMO_QUIZZES[activeCategory].questions;
  const currentQ = currentQuestions[currentQuestionIndex];
  const totalQuestions = currentQuestions.length;
  const progressPercent = Math.round(((currentQuestionIndex + (selectedOption ? 1 : 0)) / totalQuestions) * 100);

  const handleCategoryChange = (key) => {
    setActiveCategory(key);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setScore(0);
    setIsFinished(false);
    setFocusedOptionIndex(0);
  };

  const handleSelectOption = (opt) => {
    if (selectedOption !== null || isFinished) return;
    setSelectedOption(opt);
    if (opt === currentQ.correct) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setFocusedOptionIndex(0);
    } else {
      setIsFinished(true);
    }
  };

  const handleResetDemo = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setScore(0);
    setIsFinished(false);
    setFocusedOptionIndex(0);
  };

  const handleKeyDown = (e, index) => {
    if (selectedOption !== null) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (index + 1) % currentQ.options.length;
      setFocusedOptionIndex(nextIndex);
      optionsRefs.current[nextIndex]?.focus();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (index - 1 + currentQ.options.length) % currentQ.options.length;
      setFocusedOptionIndex(prevIndex);
      optionsRefs.current[prevIndex]?.focus();
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleSelectOption(currentQ.options[index]);
    }
  };

  const getMotivationText = (finalScore) => {
    if (finalScore === 3) {
      return 'Відмінний результат! Ти бездоганно впорався з тестом.';
    }
    if (finalScore === 2) {
      return 'Чудовий старт! Ще декілька спроб — і результат буде максимальним.';
    }
    return 'Гарний початок! З UniQuiz ти швидко закриєш прогалини та засвоїш матеріал.';
  };

  return (
    <div className="min-h-screen bg-brand-cream text-brand-dark font-sans flex flex-col selection:bg-brand-sage/20 selection:text-brand-dark">
      <SEO 
        title="UniQuiz — Твій розумний AI-асистент для навчання"
        description="UniQuiz перетворює лекції та конспекти на інтерактивні тести за допомогою штучного інтелекту. Готуйся до іспитів швидше та ефективніше."
        canonical="https://uniquiz.pages.dev/"
      />
      {/* ШАПКА — Тільки Лого та Увійти */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 sm:py-8 flex justify-between items-center">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-2xl font-bold tracking-tight text-brand-dark hover:opacity-90 transition-opacity focus:outline-none"
        >
          Uni<span className="text-brand-sage">Quiz</span>
        </button>
        <button
          onClick={() => navigate('/auth')}
          className="btn-secondary h-[42px] px-5 py-2 text-sm font-semibold"
        >
          Увійти
        </button>
      </header>

      {/* ОСНОВНИЙ КОНТЕНТ */}
      <main className="flex-grow w-full max-w-6xl mx-auto px-6 flex flex-col pt-10 sm:pt-16 md:pt-20">
        {/* HERO СЕКЦІЯ */}
        <section className="text-center max-w-3xl mx-auto mb-20 sm:mb-28">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-[-0.02em] text-brand-dark leading-[1.08] mb-6">
            Навчайся розумніше, <br />
            <span className="text-brand-sage">не важче.</span>
          </h1>
          <p className="text-base sm:text-lg text-brand-dark/70 font-normal leading-relaxed mb-10 max-w-2xl mx-auto">
            UniQuiz перетворює твої лекції, конспекти та готові файли з тестами на інтерактивний тренажер. Використовуй розумний парсинг або довір створення тестів штучному інтелекту.
          </p>

          <button
            onClick={() => navigate('/auth')}
            className="btn-accent px-8 py-4 text-lg font-bold shadow-soft hover:shadow-soft-hover"
          >
            <span>Почати безкоштовно</span>
            <ArrowRight size={18} />
          </button>
        </section>

        {/* 10. ДЕМО-ТРЕНАЖЕР НА ЛЕНДІНГУ */}
        <section className="max-w-[720px] w-full mx-auto mb-28 sm:mb-36">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-dark mb-2">
              Спробуй прямо зараз
            </h2>
            <p className="text-sm sm:text-base text-brand-dark/70 font-normal">
              Демо без реєстрації: обери тему та пройди 3 питання
            </p>
          </div>

          {/* Перемикач тем (pill-таби) */}
          <div className="flex items-center justify-center gap-2 mb-6 overflow-x-auto pb-2 px-1">
            {Object.entries(DEMO_QUIZZES).map(([key, item]) => {
              const isActive = activeCategory === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleCategoryChange(key)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap active:scale-[0.98] ${
                    isActive
                      ? 'bg-brand-dark text-brand-cream shadow-sm'
                      : 'bg-transparent text-brand-dark/70 border border-[#152A32]/15 hover:border-[#152A32]/35 hover:text-brand-dark'
                  }`}
                >
                  {item.title}
                </button>
              );
            })}
          </div>

          {/* Картка тренажера */}
          <div className="card-clean p-6 sm:p-8 bg-white border border-[#152A32]/10 rounded-[20px]">
            {!isFinished ? (
              <div className="space-y-6">
                {/* Панель прогресу тренажера */}
                <div className="flex items-center justify-between gap-4 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-brand-sage/15 text-brand-dark text-xs font-bold flex items-center justify-center">
                      {currentQuestionIndex + 1}
                    </span>
                    <span className="text-xs font-semibold text-brand-dark/60 tracking-wide uppercase">
                      Питання {currentQuestionIndex + 1} з {totalQuestions}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-brand-sage">
                    {progressPercent}%
                  </span>
                </div>

                {/* Тонка смуга прогресу */}
                <div className="w-full h-1 bg-[#152A32]/8 rounded-full overflow-hidden -mt-3">
                  <div
                    className="h-full bg-brand-sage transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>

                {/* Текст питання */}
                <h3 className="text-lg sm:text-xl font-semibold text-brand-dark leading-snug">
                  {currentQ.question}
                </h3>

                {/* Варіанти відповідей */}
                <div
                  role="radiogroup"
                  aria-label={currentQ.question}
                  className="space-y-2.5"
                >
                  {currentQ.options.map((opt, idx) => {
                    const isAnswered = selectedOption !== null;
                    const isCorrect = opt === currentQ.correct;
                    const isChosen = opt === selectedOption;

                    let optionClasses =
                      'w-full min-h-[48px] px-4 py-3.5 rounded-xl border text-left text-sm sm:text-base font-medium flex items-center justify-between gap-3 transition-all outline-none ';

                    if (isAnswered) {
                      if (isCorrect) {
                        optionClasses +=
                          'bg-brand-sage/15 border-brand-sage text-brand-dark font-semibold';
                      } else if (isChosen) {
                        optionClasses +=
                          'bg-brand-terracotta/12 border-brand-terracotta text-brand-dark';
                      } else {
                        optionClasses +=
                          'opacity-45 bg-[#152A32]/2 border-[#152A32]/8 text-brand-dark/60';
                      }
                    } else {
                      optionClasses +=
                        'bg-white border-[#152A32]/12 text-brand-dark hover:border-brand-sage hover:bg-brand-cream/60 focus-visible:border-brand-sage';
                    }

                    return (
                      <button
                        key={idx}
                        ref={(el) => (optionsRefs.current[idx] = el)}
                        role="radio"
                        aria-checked={isChosen}
                        disabled={isAnswered}
                        tabIndex={focusedOptionIndex === idx ? 0 : -1}
                        onClick={() => handleSelectOption(opt)}
                        onKeyDown={(e) => handleKeyDown(e, idx)}
                        className={optionClasses}
                      >
                        <span className="leading-snug">{opt}</span>
                        {isAnswered && (
                          <span className="shrink-0">
                            {isCorrect && (
                              <CheckCircle2 size={18} className="text-brand-sage" />
                            )}
                            {isChosen && !isCorrect && (
                              <XCircle size={18} className="text-brand-terracotta" />
                            )}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Пояснення після відповіді */}
                <div
                  aria-live="polite"
                  aria-atomic="true"
                  className="transition-opacity duration-200"
                >
                  {selectedOption !== null && (
                    <div className="p-4 rounded-xl bg-[#152A32]/5 border border-[#152A32]/8 text-sm text-brand-dark/80 leading-relaxed animate-fade-in">
                      <span className="font-semibold text-brand-dark">Пояснення: </span>
                      {currentQ.explanation}
                    </div>
                  )}
                </div>

                {/* Кнопка далі */}
                {selectedOption !== null && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      className="btn-primary w-full sm:w-auto h-[48px] px-6 text-sm font-semibold"
                    >
                      <span>
                        {currentQuestionIndex < totalQuestions - 1
                          ? 'Далі'
                          : 'Подивитися результат'}
                      </span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Фінальний стан після 3 питань */
              <div className="text-center py-6 sm:py-8 space-y-5 animate-fade-in">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-sage/15 text-brand-dark mb-2">
                  <CheckCircle2 size={32} className="text-brand-sage" />
                </div>

                <div>
                  <div className="text-3xl sm:text-4xl font-bold text-brand-dark mb-2">
                    {score} з {totalQuestions}
                  </div>
                  <p className="text-sm sm:text-base text-brand-dark/70 font-normal max-w-md mx-auto">
                    {getMotivationText(score)}
                  </p>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleResetDemo}
                    className="btn-secondary w-full sm:w-auto h-[48px] px-6 text-sm"
                  >
                    <RotateCcw size={16} />
                    <span>Пройти ще раз</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/auth')}
                    className="btn-accent w-full sm:w-auto h-[48px] px-6 text-sm font-bold"
                  >
                    <span>Почати безкоштовно</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Підпис під демо-карткою */}
          <p className="text-center text-xs text-brand-dark/50 mt-4 leading-normal">
            Це демо. У повній версії ти можеш завантажити власні файли або згенерувати тести з AI
          </p>
        </section>

        {/* ФУНКЦІОНАЛ — 6 карток у 3 колонки (на великих екранах) */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-24 sm:mb-32">
          <div className="card-clean p-7 sm:p-8 bg-white border border-[#152A32]/10 rounded-[20px]">
            <h2 className="text-lg sm:text-xl font-semibold text-brand-dark mb-3">
              Класичний імпорт тестів
            </h2>
            <p className="text-brand-dark/70 font-normal leading-relaxed text-sm">
              Вже маєш готовий файл із тестами від викладача? Просто завантаж PDF, DOCX або TXT. Наш алгоритм миттєво розпізнає питання та варіанти відповідей, перетворивши їх на зручний тренажер.
            </p>
          </div>

          <div className="card-clean p-7 sm:p-8 bg-white border border-[#152A32]/10 rounded-[20px]">
            <h2 className="text-lg sm:text-xl font-semibold text-brand-dark mb-3">
              AI Генерація з нуля
            </h2>
            <p className="text-brand-dark/70 font-normal leading-relaxed text-sm">
              Немає готових тестів? Не проблема. Завантаж звичайний конспект чи лекцію, і штучний інтелект самостійно витягне ключові факти та згенерує повноцінний тестовий модуль для перевірки знань.
            </p>
          </div>

          <div className="card-clean p-7 sm:p-8 bg-white border border-[#152A32]/10 rounded-[20px]">
            <h2 className="text-lg sm:text-xl font-semibold text-brand-dark mb-3">
              Робота над помилками
            </h2>
            <p className="text-brand-dark/70 font-normal leading-relaxed text-sm">
              Алгоритм запам'ятовує твої слабкі місця. Переходь у спеціальний режим, щоб сфокусуватись лише на тих питаннях, які викликали труднощі, доки не засвоїш їх на 100%.
            </p>
          </div>

          <div className="card-clean p-7 sm:p-8 bg-white border border-[#152A32]/10 rounded-[20px]">
            <h2 className="text-lg sm:text-xl font-semibold text-brand-dark mb-3">
              Динамічне перемішування
            </h2>
            <p className="text-brand-dark/70 font-normal leading-relaxed text-sm">
              Уникай механічного звикання. При кожному новому проходженні система випадково перемішує як самі питання, так і розташування варіантів відповідей, змушуючи мозок справді аналізувати.
            </p>
          </div>

          <div className="card-clean p-7 sm:p-8 bg-white border border-[#152A32]/10 rounded-[20px]">
            <h2 className="text-lg sm:text-xl font-semibold text-brand-dark mb-3">
              Детальна аналітика
            </h2>
            <p className="text-brand-dark/70 font-normal leading-relaxed text-sm">
              Слідкуй за своїми результатами у реальному часі. Отримуй деталізовану статистику щодо кількості пройдених тестів, відсотка успішності та загального прогресу навчання.
            </p>
          </div>

          <div className="card-clean p-7 sm:p-8 bg-white border border-[#152A32]/10 rounded-[20px]">
            <h2 className="text-lg sm:text-xl font-semibold text-brand-dark mb-3">
              Глобальний Leaderboard
            </h2>
            <p className="text-brand-dark/70 font-normal leading-relaxed text-sm">
              Навчання — це теж змагання. Здобувай бали за правильні відповіді, підвищуй свій персональний рейтинг та змагайся з іншими студентами за першість на платформі.
            </p>
          </div>
        </section>

        {/* КОРОТКА ПЕРЕВАГА */}
        <section className="mb-24 sm:mb-32 py-16 sm:py-20 border-y border-[#152A32]/10 text-center max-w-3xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-brand-dark mb-5 tracking-tight">
            Тисячі тестів розпізнано та згенеровано
          </h2>
          <p className="text-brand-dark/70 font-normal leading-relaxed text-base max-w-xl mx-auto">
            Приєднуйся до студентів, які вже змінили свій підхід до навчання. UniQuiz — це твій персональний асистент у підготовці до іспитів будь-якої складності.
          </p>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-brand-cream border-t border-[#152A32]/10">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-xl font-bold tracking-tight text-brand-dark hover:opacity-90 transition-opacity focus:outline-none"
            >
              Uni<span className="text-brand-sage">Quiz</span>
            </button>
            <p className="text-xs font-medium text-brand-dark/50 uppercase tracking-wider">
              Smart Education Era
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-3">
            <div className="flex gap-6 text-xs font-semibold text-brand-dark/70">
              <a
                href="/privacy-policy"
                className="hover:text-brand-sage transition-colors tracking-wide"
              >
                Політика конфіденційності
              </a>
              <a
                href="/terms-of-service"
                className="hover:text-brand-sage transition-colors tracking-wide"
              >
                Умови використання
              </a>
            </div>
            <p className="text-[11px] font-medium text-brand-dark/40">
              © {new Date().getFullYear()} UniQuiz Platform. Всі права захищені.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

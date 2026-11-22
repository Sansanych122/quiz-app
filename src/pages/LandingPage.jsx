import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RotateCcw,
  Sparkles,
  FileText,
  BrainCircuit,
  Shuffle,
  BarChart3,
  Trophy,
  Play,
  Check
} from 'lucide-react';
import SEO from '../components/SEO';

const DEMO_QUIZZES = {
  medicine: {
    title: 'Медицина',
    icon: '🩺',
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
        explanation: 'Лівий шлуночок виштовхує кров в аорту під високим тиском.',
      },
      {
        question: 'Який орган виробляє інсулін?',
        options: ['Печінка', 'Підшлункова залоза', 'Нирки', 'Щитоподібна залоза'],
        correct: 'Підшлункова залоза',
        explanation: 'Інсулін виробляють бета-клітини острівців Лангерганса підшлункової залози.',
      },
    ],
  },
  history: {
    title: 'Історія України',
    icon: '🏛️',
    questions: [
      {
        question: 'У якому році Верховна Рада ухвалила Акт проголошення незалежності України?',
        options: ['1989', '1991', '1994', '1996'],
        correct: '1991',
        explanation: 'Акт проголошення незалежності України ухвалено 24 серпня 1991 року.',
      },
      {
        question: 'Хто став першим Президентом незалежної України?',
        options: ['Леонід Кучма', 'Віктор Ющенко', 'Леонід Кравчук', 'Михайло Грушевський'],
        correct: 'Леонід Кравчук',
        explanation: 'Леонід Кравчук був обраний Президентом 1 грудня 1991 року.',
      },
      {
        question: 'Хто очолив національно-визвольну війну українського народу 1648–1657 рр.?',
        options: ['Іван Мазепа', 'Богдан Хмельницький', 'Петро Сагайдачний', 'Іван Виговський'],
        correct: 'Богдан Хмельницький',
        explanation: 'Богдан Хмельницький очолив повстання 1648 року, що переросло у всенародну війну.',
      },
    ],
  },
  engineering: {
    title: 'Інженерія',
    icon: '⚙️',
    questions: [
      {
        question: 'В яких одиницях вимірюється електричний опір у системі СІ?',
        options: ['Вольт', 'Ампер', 'Ом', 'Ват'],
        correct: 'Ом',
        explanation: 'Одиниця електричного опору в системі СІ — ом (Ом); 1 Ом = 1 В / 1 А.',
      },
      {
        question: 'Який елемент є основою сталі?',
        options: ['Алюміній', 'Мідь', 'Залізо', 'Нікель'],
        correct: 'Залізо',
        explanation: 'Сталь — це деформівний сплав заліза з вуглецем (до 2,14%).',
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
        explanation: 'CAD — система автоматизованого проєктування (САПР).',
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

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
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

      {/* ШАПКА (Sticky з розмиттям фону) */}
      <header className="sticky top-0 z-40 w-full bg-brand-cream/85 backdrop-blur-md border-b border-[#152A32]/8 transition-colors">
        <div className="w-full max-w-6xl mx-auto px-6 h-16 sm:h-20 flex justify-between items-center">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="group flex items-center gap-2 focus:outline-none"
            aria-label="На початок сторінки"
          >
            <span className="text-2xl sm:text-[26px] font-bold tracking-tight text-brand-dark group-hover:opacity-90 transition-opacity">
              Uni<span className="text-brand-sage">Quiz</span>
            </span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-brand-sage/12 text-brand-sage border border-brand-sage/20">
              AI Edu
            </span>
          </button>

          <nav className="flex items-center gap-2 sm:gap-6">
            <button
              onClick={() => scrollToSection('demo-trainer')}
              className="hidden md:inline-flex text-sm font-semibold text-brand-dark/70 hover:text-brand-dark transition-colors px-3 py-2"
            >
              Демо-тренажер
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="hidden md:inline-flex text-sm font-semibold text-brand-dark/70 hover:text-brand-dark transition-colors px-3 py-2"
            >
              Можливості
            </button>
            
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => navigate('/auth')}
                className="btn-secondary h-[40px] sm:h-[44px] px-4 sm:px-5 text-sm font-semibold"
              >
                Увійти
              </button>
              <button
                onClick={() => navigate('/auth')}
                className="hidden sm:inline-flex btn-accent h-[40px] sm:h-[44px] px-5 text-sm font-bold shadow-soft"
              >
                <span>Почати</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* ОСНОВНИЙ КОНТЕНТ */}
      <main className="flex-grow w-full max-w-6xl mx-auto px-6 flex flex-col pt-12 sm:pt-16 md:pt-24">
        
        {/* HERO СЕКЦІЯ */}
        <section className="text-center max-w-3xl mx-auto mb-20 sm:mb-28">
          {/* Верхній бейдж-оголошення */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-sage/10 border border-brand-sage/20 text-brand-dark text-xs sm:text-sm font-semibold mb-8 animate-fade-in shadow-xs">
            <span className="w-2 h-2 rounded-full bg-brand-sage animate-pulse" />
            <span>Штучний інтелект для навчання та іспитів</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-[-0.025em] text-brand-dark leading-[1.08] mb-6">
            Навчайся розумніше, <br />
            <span className="text-brand-sage">не важче.</span>
          </h1>

          <p className="text-base sm:text-lg text-brand-dark/70 font-normal leading-relaxed mb-10 max-w-2xl mx-auto">
            UniQuiz перетворює твої лекції, конспекти та готові файли з тестами на інтерактивний тренажер. Використовуй розумний парсинг або довір створення тестів штучному інтелекту.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14">
            <button
              onClick={() => navigate('/auth')}
              className="btn-accent w-full sm:w-auto px-8 py-4 text-base sm:text-lg font-bold shadow-soft hover:shadow-soft-hover"
            >
              <span>Почати безкоштовно</span>
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => scrollToSection('demo-trainer')}
              className="btn-secondary w-full sm:w-auto px-6 py-4 text-base font-semibold"
            >
              <Play size={16} className="text-brand-sage fill-brand-sage" />
              <span>Спробувати демо</span>
            </button>
          </div>

          {/* Плашки переваг на hero */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/70 border border-[#152A32]/8 shadow-xs">
              <div className="w-7 h-7 rounded-lg bg-brand-sage/15 text-brand-sage flex items-center justify-center shrink-0">
                <FileText size={15} />
              </div>
              <span className="text-xs font-semibold text-brand-dark/80">PDF, DOCX, DOC, TXT</span>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/70 border border-[#152A32]/8 shadow-xs">
              <div className="w-7 h-7 rounded-lg bg-brand-sage/15 text-brand-sage flex items-center justify-center shrink-0">
                <Sparkles size={15} />
              </div>
              <span className="text-xs font-semibold text-brand-dark/80">AI генерація за секунди</span>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/70 border border-[#152A32]/8 shadow-xs">
              <div className="w-7 h-7 rounded-lg bg-brand-sage/15 text-brand-sage flex items-center justify-center shrink-0">
                <Check size={15} />
              </div>
              <span className="text-xs font-semibold text-brand-dark/80">100% безкоштовно</span>
            </div>
          </div>
        </section>

        {/* 10. ДЕМО-ТРЕНАЖЕР НА ЛЕНДІНГУ */}
        <section id="demo-trainer" className="max-w-[740px] w-full mx-auto mb-28 sm:mb-36 scroll-mt-28">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#152A32]/6 text-[#152A32]/70 text-xs font-bold uppercase tracking-wider mb-2.5">
              Інтерактивний тренажер
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-dark mb-2">
              Спробуй прямо зараз
            </h2>
            <p className="text-sm sm:text-base text-brand-dark/70 font-normal">
              Демо без реєстрації: обери тему та пройди 3 питання
            </p>
          </div>

          {/* Перемикач тем (pill-таби з іконками) */}
          <div className="flex items-center justify-center gap-2 mb-6 overflow-x-auto pb-2 px-1">
            {Object.entries(DEMO_QUIZZES).map(([key, item]) => {
              const isActive = activeCategory === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleCategoryChange(key)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap active:scale-[0.98] ${
                    isActive
                      ? 'bg-brand-dark text-brand-cream shadow-soft'
                      : 'bg-white/80 text-brand-dark/70 border border-[#152A32]/12 hover:border-[#152A32]/30 hover:text-brand-dark'
                  }`}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.title}</span>
                </button>
              );
            })}
          </div>

          {/* Картка тренажера */}
          <div className="card-clean p-6 sm:p-9 bg-white border border-[#152A32]/10 rounded-[24px] shadow-soft hover:shadow-soft-hover transition-shadow">
            {!isFinished ? (
              <div className="space-y-6">
                {/* Панель прогресу тренажера */}
                <div className="flex items-center justify-between gap-4 pb-1">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-brand-sage/15 text-brand-sage text-xs font-bold flex items-center justify-center">
                      {currentQuestionIndex + 1}
                    </span>
                    <span className="text-xs font-semibold text-brand-dark/60 tracking-wider uppercase">
                      Питання {currentQuestionIndex + 1} з {totalQuestions}
                    </span>
                  </div>
                  <span className="badge-pill bg-brand-sage/12 text-brand-dark border border-brand-sage/25 text-xs font-bold">
                    {progressPercent}%
                  </span>
                </div>

                {/* Тонка смуга прогресу */}
                <div className="w-full h-1.5 bg-[#152A32]/8 rounded-full overflow-hidden -mt-2">
                  <div
                    className="h-full bg-brand-sage transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Текст питання */}
                <h3 className="text-lg sm:text-xl font-bold text-brand-dark leading-snug pt-1">
                  {currentQ.question}
                </h3>

                {/* Варіанти відповідей */}
                <div
                  role="radiogroup"
                  aria-label={currentQ.question}
                  className="space-y-3"
                >
                  {currentQ.options.map((opt, idx) => {
                    const isAnswered = selectedOption !== null;
                    const isCorrect = opt === currentQ.correct;
                    const isChosen = opt === selectedOption;

                    let optionClasses =
                      'w-full min-h-[52px] px-4 py-3.5 rounded-xl border text-left text-sm sm:text-base font-medium flex items-center justify-between gap-3 transition-all outline-none ';

                    if (isAnswered) {
                      if (isCorrect) {
                        optionClasses +=
                          'bg-brand-sage/15 border-brand-sage text-brand-dark font-semibold shadow-xs';
                      } else if (isChosen) {
                        optionClasses +=
                          'bg-brand-terracotta/12 border-brand-terracotta text-brand-dark';
                      } else {
                        optionClasses +=
                          'opacity-45 bg-[#152A32]/2 border-[#152A32]/8 text-brand-dark/60';
                      }
                    } else {
                      optionClasses +=
                        'bg-white border-[#152A32]/12 text-brand-dark hover:border-brand-sage hover:bg-brand-cream/50 focus-visible:border-brand-sage';
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
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center shrink-0 ${
                            isAnswered && isCorrect 
                              ? 'border-brand-sage bg-brand-sage text-white' 
                              : isAnswered && isChosen && !isCorrect
                              ? 'border-brand-terracotta bg-brand-terracotta text-white'
                              : 'border-[#152A32]/20 text-[#152A32]/60'
                          }`}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="leading-snug">{opt}</span>
                        </div>
                        {isAnswered && (
                          <span className="shrink-0">
                            {isCorrect && (
                              <CheckCircle2 size={19} className="text-brand-sage" />
                            )}
                            {isChosen && !isCorrect && (
                              <XCircle size={19} className="text-brand-terracotta" />
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
                    <div className="p-4 rounded-xl bg-brand-cream-subtle border border-[#152A32]/10 text-sm text-brand-dark/80 leading-relaxed animate-fade-in flex items-start gap-3">
                      <div className="p-1 rounded bg-brand-sage/15 text-brand-sage shrink-0 mt-0.5">
                        <Check size={14} />
                      </div>
                      <div>
                        <span className="font-bold text-brand-dark">Пояснення: </span>
                        {currentQ.explanation}
                      </div>
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
              <div className="text-center py-6 sm:py-8 space-y-6 animate-fade-in">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-sage/15 text-brand-sage mb-2 shadow-xs">
                  <CheckCircle2 size={36} />
                </div>

                <div>
                  <div className="text-4xl sm:text-5xl font-bold text-brand-dark mb-2 tracking-tight">
                    {score} <span className="text-xl sm:text-2xl font-normal text-brand-dark/50">/ {totalQuestions}</span>
                  </div>
                  <p className="text-sm sm:text-base text-brand-dark/75 font-normal max-w-md mx-auto leading-relaxed">
                    {getMotivationText(score)}
                  </p>
                </div>

                <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
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
                    className="btn-accent w-full sm:w-auto h-[48px] px-6 text-sm font-bold shadow-soft"
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
        <section id="features" className="scroll-mt-28 mb-24 sm:mb-32">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-brand-dark mb-3">
              Все необхідне для легкого складання тестів
            </h2>
            <p className="text-brand-dark/70 text-sm sm:text-base font-normal">
              Шість потужних інструментів, об'єднаних в єдиній мінімалістичній платформі
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {/* 1 */}
            <div className="card-clean p-7 sm:p-8 bg-white border border-[#152A32]/10 rounded-[22px] flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-brand-sage/12 text-brand-sage flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FileText size={22} />
                  </div>
                  <span className="text-xs font-bold text-[#152A32]/25 tracking-widest">01</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-brand-dark mb-2.5 group-hover:text-brand-sage transition-colors">
                  Класичний імпорт тестів
                </h3>
                <p className="text-brand-dark/70 font-normal leading-relaxed text-sm">
                  Вже маєш готовий файл із тестами від викладача? Просто завантаж PDF, DOCX або TXT. Наш алгоритм миттєво розпізнає питання та варіанти відповідей, перетворивши їх на зручний тренажер.
                </p>
              </div>
            </div>

            {/* 2 */}
            <div className="card-clean p-7 sm:p-8 bg-white border border-[#152A32]/10 rounded-[22px] flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-brand-sage/12 text-brand-sage flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Sparkles size={22} />
                  </div>
                  <span className="text-xs font-bold text-[#152A32]/25 tracking-widest">02</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-brand-dark mb-2.5 group-hover:text-brand-sage transition-colors">
                  AI Генерація з нуля
                </h3>
                <p className="text-brand-dark/70 font-normal leading-relaxed text-sm">
                  Немає готових тестів? Не проблема. Завантаж звичайний конспект чи лекцію, і штучний інтелект самостійно витягне ключові факти та згенерує повноцінний тестовий модуль для перевірки знань.
                </p>
              </div>
            </div>

            {/* 3 */}
            <div className="card-clean p-7 sm:p-8 bg-white border border-[#152A32]/10 rounded-[22px] flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-brand-sage/12 text-brand-sage flex items-center justify-center group-hover:scale-105 transition-transform">
                    <RotateCcw size={22} />
                  </div>
                  <span className="text-xs font-bold text-[#152A32]/25 tracking-widest">03</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-brand-dark mb-2.5 group-hover:text-brand-sage transition-colors">
                  Робота над помилками
                </h3>
                <p className="text-brand-dark/70 font-normal leading-relaxed text-sm">
                  Алгоритм запам'ятовує твої слабкі місця. Переходь у спеціальний режим, щоб сфокусуватись лише на тих питаннях, які викликали труднощі, доки не засвоїш їх на 100%.
                </p>
              </div>
            </div>

            {/* 4 */}
            <div className="card-clean p-7 sm:p-8 bg-white border border-[#152A32]/10 rounded-[22px] flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-brand-sage/12 text-brand-sage flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Shuffle size={22} />
                  </div>
                  <span className="text-xs font-bold text-[#152A32]/25 tracking-widest">04</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-brand-dark mb-2.5 group-hover:text-brand-sage transition-colors">
                  Динамічне перемішування
                </h3>
                <p className="text-brand-dark/70 font-normal leading-relaxed text-sm">
                  Уникай механічного звикання. При кожному новому проходженні система випадково перемішує як самі питання, так і розташування варіантів відповідей, змушуючи мозок справді аналізувати.
                </p>
              </div>
            </div>

            {/* 5 */}
            <div className="card-clean p-7 sm:p-8 bg-white border border-[#152A32]/10 rounded-[22px] flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-brand-sage/12 text-brand-sage flex items-center justify-center group-hover:scale-105 transition-transform">
                    <BarChart3 size={22} />
                  </div>
                  <span className="text-xs font-bold text-[#152A32]/25 tracking-widest">05</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-brand-dark mb-2.5 group-hover:text-brand-sage transition-colors">
                  Детальна аналітика
                </h3>
                <p className="text-brand-dark/70 font-normal leading-relaxed text-sm">
                  Слідкуй за своїми результатами у реальному часі. Отримуй деталізовану статистику щодо кількості пройдених тестів, відсотка успішності та загального прогресу навчання.
                </p>
              </div>
            </div>

            {/* 6 */}
            <div className="card-clean p-7 sm:p-8 bg-white border border-[#152A32]/10 rounded-[22px] flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-brand-sage/12 text-brand-sage flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Trophy size={22} />
                  </div>
                  <span className="text-xs font-bold text-[#152A32]/25 tracking-widest">06</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-brand-dark mb-2.5 group-hover:text-brand-sage transition-colors">
                  Глобальний Leaderboard
                </h3>
                <p className="text-brand-dark/70 font-normal leading-relaxed text-sm">
                  Навчання — це теж змагання. Здобувай бали за правильні відповіді, підвищуй свій персональний рейтинг та змагайся з іншими студентами за першість на платформі.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* КОРОТКА ПЕРЕВАГА / СТАВКА НА ДІЮ */}
        <section className="mb-24 sm:mb-32 p-10 sm:p-16 rounded-[28px] bg-white border border-[#152A32]/10 shadow-soft text-center max-w-4xl mx-auto">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-brand-dark mb-4 tracking-tight">
              Тисячі тестів розпізнано та згенеровано
            </h2>
            <p className="text-brand-dark/70 font-normal leading-relaxed text-sm sm:text-base mb-8">
              Приєднуйся до студентів, які вже змінили свій підхід до навчання. UniQuiz — це твій персональний асистент у підготовці до іспитів будь-якої складності.
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="btn-accent px-8 py-4 text-base sm:text-lg font-bold shadow-soft hover:shadow-soft-hover"
            >
              <span>Почати безкоштовно</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-brand-cream border-t border-[#152A32]/10 mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-xl font-bold tracking-tight text-brand-dark hover:opacity-90 transition-opacity focus:outline-none"
            >
              Uni<span className="text-brand-sage">Quiz</span>
            </button>
            <p className="text-xs font-semibold text-brand-dark/50 uppercase tracking-wider">
              Smart Education Era
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-3">
            <div className="flex flex-wrap justify-center gap-6 text-xs font-semibold text-brand-dark/70">
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

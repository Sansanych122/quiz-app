import React, { useEffect, useState, useMemo, useCallback, useRef, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, RefreshCw, CheckCircle2, XCircle, 
  Loader2, Shuffle, RotateCcw, Eye, EyeOff, Undo2, Check,
  Trophy, Coffee, X, Sparkles, AlertCircle, ChevronUp
} from 'lucide-react';
import { QuizPageSkeleton } from '../components/Skeleton';
import SEO from '../components/SEO';
import { useToast } from '../components/Toast';

const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Мемоізована картка окремого питання (запобігає ре-рендеру всіх карток при виборі однієї відповіді)
const QuestionCard = memo(function QuestionCard({ 
  q, 
  qIndex, 
  userAnswer, 
  showAllCorrect, 
  onAnswer 
}) {
  const [aiStatus, setAiStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [aiStage, setAiStage] = useState('sending'); // 'sending' | 'analyzing'
  const [aiExplanation, setAiExplanation] = useState('');
  const [aiError, setAiError] = useState('');
  const [isAiOpen, setIsAiOpen] = useState(false);

  const abortControllerRef = useRef(null);
  const stageTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (stageTimerRef.current) clearTimeout(stageTimerRef.current);
    };
  }, []);

  const fetchExplanation = async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    if (stageTimerRef.current) clearTimeout(stageTimerRef.current);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 18000);

    setAiStatus('loading');
    setAiStage('sending');
    setAiError('');
    setIsAiOpen(true);

    stageTimerRef.current = setTimeout(() => {
      setAiStage('analyzing');
    }, 450);

    try {
      const response = await fetch('/api/ask-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          question: q.content,
          options: q.shuffledOptions,
          correctAnswer: q.correct_answer,
          chosenAnswer: userAnswer?.chosen_answer || '',
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        if (response.status === 404) {
          throw new Error('Ендпоінт /api/ask-ai недоступний локально без Wrangler. На Cloudflare Pages він працює автоматично.');
        }
        throw new Error('Сервер повернув неочікувану відповідь. Спробуйте пізніше.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Не вдалося отримати пояснення від AI.');
      }

      if (!data?.explanation) {
        throw new Error('AI повернув порожнє пояснення. Спробуйте ще раз.');
      }

      setAiExplanation(data.explanation);
      setAiStatus('success');
    } catch (err) {
      if (err?.name === 'AbortError') {
        setAiError('Час очікування відповіді від AI вичерпано. Перевірте інтернет та спробуйте ще раз.');
      } else {
        setAiError(err?.message || 'Виникла невідома помилка під час звернення до AI.');
      }
      setAiStatus('error');
    } finally {
      clearTimeout(timeoutId);
      if (stageTimerRef.current) {
        clearTimeout(stageTimerRef.current);
        stageTimerRef.current = null;
      }
    }
  };

  const handleAskAI = () => {
    if (aiStatus === 'loading') return;
    if (aiStatus === 'success') {
      setIsAiOpen((prev) => !prev);
      return;
    }
    fetchExplanation();
  };

  return (
    <div className="card-clean p-5 sm:p-7 bg-white rounded-[22px] border border-[#152A32]/10 shadow-soft">
      {/* Заголовок питання з номером */}
      <div className="flex items-start gap-3.5 mb-5">
        <span className="shrink-0 w-8 h-8 flex items-center justify-center bg-brand-sage/15 text-brand-dark text-xs font-bold rounded-[10px]">
          {qIndex}
        </span>
        <p className="font-bold text-brand-dark text-base sm:text-lg leading-snug pt-0.5">
          {q.content}
        </p>
      </div>

      {/* Варіанти відповідей */}
      <div className="space-y-2.5">
        {q.shuffledOptions.map((opt, oIdx) => {
          const isCorrect = opt === q.correct_answer;
          const isSelected = userAnswer?.chosen_answer === opt;
          
          let optionStyle = "w-full min-h-[50px] px-4 py-3.5 rounded-[14px] border text-left text-sm sm:text-base font-medium flex items-center justify-between gap-3 transition-all outline-none ";
          
          if (showAllCorrect && isCorrect) {
            optionStyle += "bg-brand-sage/15 border-brand-sage text-brand-dark font-semibold";
          } else if (userAnswer) {
            if (isCorrect) {
              optionStyle += "bg-brand-sage/15 border-brand-sage text-brand-dark font-semibold";
            } else if (isSelected) {
              optionStyle += "bg-brand-terracotta/12 border-brand-terracotta text-brand-dark font-medium animate-subtle-shake";
            } else {
              optionStyle += "opacity-45 bg-[#152A32]/2 border-[#152A32]/8 text-brand-dark/60";
            }
          } else {
            optionStyle += "bg-white border-[#152A32]/12 text-brand-dark hover:border-brand-sage hover:bg-brand-cream/60 focus-visible:border-brand-sage";
          }

          return (
            <button 
              key={oIdx} 
              disabled={!!userAnswer || showAllCorrect} 
              onClick={() => onAnswer(q.id, opt, q.correct_answer)} 
              className={optionStyle}
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center shrink-0 ${
                  showAllCorrect && isCorrect
                    ? 'border-brand-sage bg-brand-sage text-white'
                    : userAnswer && isCorrect
                    ? 'border-brand-sage bg-brand-sage text-white'
                    : userAnswer && isSelected && !isCorrect
                    ? 'border-brand-terracotta bg-brand-terracotta text-white'
                    : 'border-[#152A32]/20 text-[#152A32]/60'
                }`}>
                  {String.fromCharCode(65 + oIdx)}
                </span>
                <span className="leading-snug">{opt}</span>
              </div>
              
              {/* Семантичні іконки станів */}
              {showAllCorrect && isCorrect && (
                <span className="shrink-0">
                  <CheckCircle2 size={19} className="text-brand-sage" />
                </span>
              )}
              {!showAllCorrect && userAnswer && isCorrect && (
                <span className="shrink-0">
                  <CheckCircle2 size={19} className="text-brand-sage" />
                </span>
              )}
              {!showAllCorrect && userAnswer && isSelected && !isCorrect && (
                <span className="shrink-0">
                  <XCircle size={19} className="text-brand-terracotta" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Нижня панель з кнопкою Ask AI */}
      <div className="mt-4 pt-3.5 border-t border-[#152A32]/8 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleAskAI}
          disabled={aiStatus === 'loading'}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 focus-visible:outline-none ${
            isAiOpen && aiStatus === 'success'
              ? 'bg-brand-sage/15 border-brand-sage/40 text-brand-dark'
              : 'bg-brand-cream/70 border-[#152A32]/12 text-brand-dark/80 hover:border-brand-sage hover:bg-brand-sage/10 hover:text-brand-dark'
          } disabled:opacity-70 disabled:cursor-wait`}
        >
          {aiStatus === 'loading' ? (
            <Loader2 size={13} className="animate-spin text-brand-sage" />
          ) : (
            <Sparkles size={13} className="text-brand-sage" />
          )}
          <span>
            {aiStatus === 'loading'
              ? 'AI пояснює...'
              : isAiOpen && aiStatus === 'success'
              ? 'Сховати AI'
              : 'Ask AI'}
          </span>
          {aiStatus === 'success' && isAiOpen && (
            <ChevronUp size={13} className="text-brand-dark/50" />
          )}
        </button>

        {aiStatus === 'success' && !isAiOpen && (
          <span className="text-[11px] font-medium text-brand-sage">
            Пояснення збережено
          </span>
        )}
      </div>

      {/* Блок станів AI (прогрес по етапах, пояснення або зрозуміла помилка) */}
      {isAiOpen && (
        <div aria-live="polite" className="mt-3 animate-fade-in">
          {aiStatus === 'loading' && (
            <div className="p-3.5 rounded-[14px] bg-brand-cream-subtle border border-[#152A32]/10 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-brand-dark/80">
                <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-brand-sage shrink-0" />
                  {aiStage === 'sending'
                    ? 'Етап 1/2 • Надсилаємо питання до AI...'
                    : 'Етап 2/2 • Gemini формує коротке пояснення...'}
                </span>
                <span className="text-[11px] text-brand-sage font-bold">
                  {aiStage === 'sending' ? '40%' : '80%'}
                </span>
              </div>
              <div className="w-full h-1 bg-[#152A32]/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-sage transition-all duration-500 rounded-full"
                  style={{ width: aiStage === 'sending' ? '40%' : '80%' }}
                />
              </div>
            </div>
          )}

          {aiStatus === 'error' && (
            <div
              role="alert"
              className="p-3.5 rounded-[14px] bg-brand-terracotta/10 border border-brand-terracotta/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm"
            >
              <div className="flex items-start gap-2.5 text-brand-dark">
                <AlertCircle size={16} className="text-brand-terracotta shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium text-brand-dark/90">
                  {aiError}
                </span>
              </div>
              <button
                type="button"
                onClick={fetchExplanation}
                className="self-start sm:self-center shrink-0 px-3 py-1.5 rounded-[10px] bg-white border border-brand-terracotta/30 text-brand-terracotta hover:bg-brand-terracotta hover:text-white text-xs font-semibold transition-colors"
              >
                Повторити
              </button>
            </div>
          )}

          {aiStatus === 'success' && (
            <div className="p-4 rounded-[14px] bg-brand-cream-subtle border border-[#152A32]/10 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-sage">
                <Sparkles size={12} />
                <span>Пояснення AI</span>
              </div>
              <p className="text-xs sm:text-sm text-brand-dark/90 leading-relaxed font-normal">
                {aiExplanation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default function QuizPage() {
  const { courseId, sectionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [quizTitle, setQuizTitle] = useState('Завантаження...');
  const [returnCourseId, setReturnCourseId] = useState(null);
  
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); 
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [saveStatus, setSaveStatus] = useState('synced'); // 'synced' | 'saving'
  
  const [showAllCorrect, setShowAllCorrect] = useState(false);
  const [mistakesOnlyMode, setMistakesOnlyMode] = useState(false);
  const [targetMistakeIds, setTargetMistakeIds] = useState([]);
  
  // Стан для модального вікна привітання та донату
  const [dismissedModal, setDismissedModal] = useState(false);

  useEffect(() => {
    fetchQuizData();
  }, [courseId, sectionId, user.id]);

  const fetchQuizData = async () => {
    setLoading(true);
    try {
      let fetchedQuestions = [];
      let headerTitle = '';
      let backId = '';

      if (sectionId) {
        const { data: secData } = await supabase
          .from('sections').select('title, course_id').eq('id', sectionId).single();
          
        headerTitle = secData?.title || 'Тест розділу';
        backId = secData?.course_id;

        const { data: qData } = await supabase
          .from('questions')
          .select('id, section_id, content, options, correct_answer')
          .eq('section_id', sectionId)
          .order('created_at', { ascending: true });
        
        fetchedQuestions = qData || [];
      } else if (courseId) {
        const { data: courseData } = await supabase
          .from('courses').select('title, id').eq('id', courseId).single();
          
        headerTitle = `${courseData?.title || 'Курс'} (Всі питання)`;
        backId = courseId;

        const { data: sectionsData } = await supabase
          .from('sections').select('id').eq('course_id', courseId);
          
        const sectionIds = sectionsData?.map(s => s.id) || [];
        
        if (sectionIds.length > 0) {
          const { data: qData } = await supabase
            .from('questions')
            .select('id, section_id, content, options, correct_answer')
            .in('section_id', sectionIds)
            .order('created_at', { ascending: true });
          fetchedQuestions = qData || [];
        }
      }

      setQuizTitle(headerTitle);
      setReturnCourseId(backId);

      const prepared = fetchedQuestions.map(q => ({
        ...q,
        shuffledOptions: shuffleArray(q.options)
      }));
      
      setQuestions(prepared);

      const qIds = fetchedQuestions.map(q => q.id);
      const answersMap = {};

      if (qIds.length > 0) {
        const chunkSize = 500;
        for (let i = 0; i < qIds.length; i += chunkSize) {
          const chunk = qIds.slice(i, i + chunkSize);
          const { data: aData } = await supabase
            .from('user_answers')
            .select('question_id, is_correct, chosen_answer')
            .eq('user_id', user.id)
            .in('question_id', chunk);

          aData?.forEach(ans => {
            answersMap[ans.question_id] = {
              is_correct: ans.is_correct,
              chosen_answer: ans.chosen_answer,
            };
          });
        }
      }

      setAnswers(answersMap);

    } catch (error) {
      console.error(error);
      addToast({ message: 'Помилка завантаження тесту', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleShuffleAll = () => {
    const shuffledQ = shuffleArray(questions).map(q => ({
      ...q,
      shuffledOptions: shuffleArray(q.options)
    }));
    setQuestions(shuffledQ);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Оптимістичний UI запис відповіді
  const handleAnswer = useCallback(async (questionId, option, correctAnswer) => {
    if (answers[questionId] || showAllCorrect) return; 

    const isCorrect = option === correctAnswer;
    setAnswers(prev => ({ ...prev, [questionId]: { is_correct: isCorrect, chosen_answer: option } }));
    setSaveStatus('saving');

    try {
      await supabase.from('user_answers').upsert(
        {
          user_id: user.id,
          question_id: questionId,
          is_correct: isCorrect,
          chosen_answer: option,
        },
        { onConflict: 'user_id,question_id' }
      );
      setSaveStatus('synced');
    } catch (err) {
      console.error('Помилка синхронізації відповіді:', err);
      setSaveStatus('synced');
    }
  }, [answers, showAllCorrect, user.id]);

  const resetProgress = async () => {
    if (!window.confirm('Очистити весь прогрес цього тестування?')) return;
    setResetting(true);
    const qIds = questions.map(q => q.id);
    
    const chunkSize = 500;
    for (let i = 0; i < qIds.length; i += chunkSize) {
      const chunk = qIds.slice(i, i + chunkSize);
      await supabase.from('user_answers').delete().eq('user_id', user.id).in('question_id', chunk);
    }
    
    setAnswers({});
    setMistakesOnlyMode(false);
    setShowAllCorrect(false);
    setResetting(false);
    setDismissedModal(false);
    addToast({ message: 'Прогрес тестування очищено', type: 'info' });
  };

  const toggleMistakesMode = async () => {
    if (mistakesOnlyMode) {
      setMistakesOnlyMode(false);
      return;
    }

    const incorrectIds = Object.entries(answers)
      .filter(([id, ans]) => !ans.is_correct && questions.some(q => q.id === id))
      .map(([id]) => id);

    if (incorrectIds.length === 0) {
      return alert('У вас немає завалених тестів!');
    }
    
    if (!window.confirm('Розпочати роботу над помилками? Завалені тести будуть очищені, щоб ви могли пройти їх знову.')) return;
    
    setResetting(true);
    
    const chunkSize = 500;
    for (let i = 0; i < incorrectIds.length; i += chunkSize) {
      const chunk = incorrectIds.slice(i, i + chunkSize);
      await supabase.from('user_answers').delete().eq('user_id', user.id).in('question_id', chunk);
    }
    
    setAnswers(prev => {
      const next = { ...prev };
      incorrectIds.forEach(id => delete next[id]);
      return next;
    });
    
    setTargetMistakeIds(incorrectIds); 
    setMistakesOnlyMode(true);
    setShowAllCorrect(false);
    setResetting(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const visibleQuestions = useMemo(() => {
    if (mistakesOnlyMode) {
      return questions.filter(q => targetMistakeIds.includes(q.id));
    }
    return questions;
  }, [questions, mistakesOnlyMode, targetMistakeIds]);

  // O(N) розрахунок статистики
  const { answeredCount, correctCount } = useMemo(() => {
    let answered = 0;
    let correct = 0;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const a = answers[q.id];
      if (a) {
        answered++;
        if (a.is_correct) correct++;
      }
    }
    return { answeredCount: answered, correctCount: correct };
  }, [questions, answers]);

  const progressPercent = Math.round((answeredCount / (questions.length || 1)) * 100) || 0;
  const correctPercent = answeredCount ? Math.round((correctCount / answeredCount) * 100) : 0;

  // Визначення повного завершення тесту
  const isCourseFullyCompleted = questions.length > 0 && answeredCount === questions.length;
  const showCompletionModal = isCourseFullyCompleted && !dismissedModal && !loading && !resetting;

  if (loading || resetting) {
    return (
      <div className="min-h-screen bg-brand-cream pb-24 font-sans">
        <SEO title="Завантаження тесту — UniQuiz" noindex={true} />
        <QuizPageSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream text-brand-dark pb-24 font-sans selection:bg-brand-sage/20 selection:text-brand-dark relative">
      <SEO 
        title={`${quizTitle} — Тест | UniQuiz`}
        description="Проходження інтерактивного тестування з підтримкою перемішування та роботи над помилками."
        canonical="https://uniquiz.pages.dev/test"
        noindex={true}
      />
      
      {/* ПАНЕЛЬ КЕРУВАННЯ — Тонка, sticky, фон #FFFCEE з розмиттям */}
      <div className="sticky top-0 z-30 bg-brand-cream/95 backdrop-blur-md border-b border-[#152A32]/10 shadow-[0_2px_12px_rgba(21,42,50,0.03)]">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
          
          <div className="flex items-center justify-between w-full gap-2">
            
            {/* ЛІВА ЧАСТИНА: Назад + Статистика + Індикатор збереження */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 pr-2 sm:pr-3 border-r border-[#152A32]/10">
              <button 
                onClick={() => navigate(`/course/${returnCourseId}`)} 
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-brand-dark/70 hover:text-brand-dark hover:bg-[#152A32]/8 rounded-[10px] transition-colors focus-visible:outline-none"
                title="Повернутися до курсу"
                aria-label="Повернутися до курсу"
              >
                <ArrowLeft size={18} />
              </button>
              
              <div className="flex flex-col items-start justify-center min-w-[50px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] sm:text-xs font-bold text-brand-dark leading-tight">
                    {answeredCount}/{questions.length}
                  </span>
                  {saveStatus === 'saving' ? (
                    <span className="text-[9px] text-brand-dark/50 flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-sage animate-ping" />
                    </span>
                  ) : answeredCount > 0 ? (
                    <span className="text-[9px] text-brand-sage flex items-center" title="Збережено">
                      <Check size={10} />
                    </span>
                  ) : null}
                </div>
                <span className={`text-[11px] sm:text-xs font-bold leading-tight ${correctPercent >= 70 ? 'text-brand-sage' : 'text-brand-terracotta'}`}>
                  {correctPercent}%
                </span>
              </div>
            </div>

            {/* ПРАВА ЧАСТИНА: Кнопки «Змішати / Відповіді / Помилки / Скинути» */}
            <div className="flex items-center justify-end gap-1.5 sm:gap-2 flex-1">
              
              {/* Змішати */}
              <button 
                onClick={handleShuffleAll} 
                className="h-[38px] px-2.5 sm:px-3 bg-white border border-[#152A32]/15 text-brand-dark hover:border-[#152A32]/30 hover:bg-[#152A32]/5 rounded-[12px] text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 focus-visible:outline-none"
              >
                <Shuffle size={14} className="text-brand-sage shrink-0" />
                <span className="hidden xs:inline">Змішати</span>
              </button>

              {/* Відповіді */}
              <button 
                onClick={() => setShowAllCorrect(!showAllCorrect)} 
                className={`h-[38px] px-2.5 sm:px-3 rounded-[12px] text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 focus-visible:outline-none border ${
                  showAllCorrect 
                    ? 'bg-brand-sage text-brand-cream border-brand-sage' 
                    : 'bg-white border-[#152A32]/15 text-brand-dark hover:border-[#152A32]/30 hover:bg-[#152A32]/5'
                }`}
              >
                {showAllCorrect ? (
                  <>
                    <EyeOff size={14} className="shrink-0" />
                    <span className="hidden xs:inline">Сховати</span>
                  </>
                ) : (
                  <>
                    <Eye size={14} className="text-brand-sage shrink-0" />
                    <span className="hidden xs:inline">Відповіді</span>
                  </>
                )}
              </button>

              {/* Помилки / Повернутись */}
              {mistakesOnlyMode ? (
                <button 
                  onClick={toggleMistakesMode} 
                  className="h-[38px] px-2.5 sm:px-3 bg-brand-sage text-brand-cream border border-brand-sage rounded-[12px] text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 focus-visible:outline-none"
                >
                  <Undo2 size={14} className="shrink-0" />
                  <span className="hidden xs:inline">Назад</span>
                </button>
              ) : (
                <button 
                  onClick={toggleMistakesMode} 
                  className="h-[38px] px-2.5 sm:px-3 bg-white border border-[#152A32]/15 text-brand-dark hover:border-[#152A32]/30 hover:bg-[#152A32]/5 rounded-[12px] text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 focus-visible:outline-none"
                >
                  <RotateCcw size={14} className="text-brand-sage shrink-0" />
                  <span className="hidden xs:inline">Помилки</span>
                </button>
              )}

              {/* Скинути */}
              <button 
                onClick={resetProgress} 
                className="h-[38px] px-2.5 sm:px-3 bg-white border border-[#152A32]/15 text-brand-dark hover:border-brand-terracotta hover:text-brand-terracotta hover:bg-brand-terracotta/10 rounded-[12px] text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 focus-visible:outline-none group"
              >
                <RefreshCw size={14} className="text-brand-dark/60 group-hover:text-brand-terracotta transition-colors shrink-0" />
                <span className="hidden xs:inline">Скинути</span>
              </button>

            </div>

          </div>

          {/* Смужка прогресу — висотою 4px */}
          <div 
            role="progressbar" 
            aria-valuenow={progressPercent} 
            aria-valuemin={0} 
            aria-valuemax={100}
            className="w-full h-1 bg-[#152A32]/8 rounded-full mt-2.5 overflow-hidden"
          >
            <div 
              className="h-full bg-brand-sage transition-all duration-300 rounded-full" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          
        </div>
      </div>

      {/* ОСНОВНА КОЛОНКА ТЕСТУ */}
      <div className="max-w-[720px] mx-auto px-4 mt-6 sm:mt-8">
        <h1 className="text-center text-xs sm:text-sm font-semibold text-brand-dark/60 mb-4 tracking-wide uppercase">
          {quizTitle}
        </h1>
        
        {/* ІНДИКАТОР РЕЖИМУ РОБОТИ НАД ПОМИЛКАМИ */}
        {mistakesOnlyMode && (
          <div className="text-center mb-6">
             <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-sage/15 text-brand-dark text-xs sm:text-sm font-semibold rounded-full border border-brand-sage/30 shadow-xs">
               🚧 Робота над помилками ({visibleQuestions.length} питань)
             </span>
          </div>
        )}

        {/* СПИСОК ПИТАНЬ (Повний рендеринг без батчингу) */}
        <div className="space-y-6">
          {visibleQuestions.map((q) => {
            const userAnswer = answers[q.id];
            const qIndex = questions.indexOf(q) + 1;

            return (
              <QuestionCard
                key={q.id}
                q={q}
                qIndex={qIndex}
                userAnswer={userAnswer}
                showAllCorrect={showAllCorrect}
                onAnswer={handleAnswer}
              />
            );
          })}
        </div>
      </div>

      {/* ПОПАП ПРИВІТАННЯ ТА ПІДТРИМКИ (По центру екрана при повному проходженні курсу) */}
      {showCompletionModal && (
        <div 
          className="fixed inset-0 z-50 bg-[#152A32]/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-completion-title"
          onClick={() => setDismissedModal(true)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[26px] border border-[#152A32]/10 shadow-2xl max-w-md w-full p-6 sm:p-8 relative text-center animate-fade-in"
          >
            {/* Хрестик для закриття */}
            <button
              onClick={() => setDismissedModal(true)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-brand-dark/40 hover:text-brand-dark hover:bg-[#152A32]/5 transition-colors focus-visible:outline-none"
              aria-label="Закрити вікно"
            >
              <X size={18} />
            </button>

            {/* Іконка кубка */}
            <div className="w-16 h-16 rounded-2xl bg-brand-sage/15 text-brand-sage flex items-center justify-center mx-auto mb-4 shadow-xs">
              <Trophy size={32} />
            </div>

            {/* Заголовок */}
            <h2 id="modal-completion-title" className="text-xl sm:text-2xl font-bold text-brand-dark mb-1.5 tracking-tight">
              Курс успішно пройдено! 🎉
            </h2>

            {/* Статистика */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cream border border-[#152A32]/10 text-xs font-semibold text-brand-dark mb-5">
              <span>Результат: <strong>{correctCount}</strong> з <strong>{questions.length}</strong></span>
              <span className="text-brand-dark/30">•</span>
              <span className={correctPercent >= 70 ? 'text-brand-sage font-bold' : 'text-brand-terracotta font-bold'}>
                {correctPercent}%
              </span>
            </div>

            {/* Запитання та текст про підтримку розробника */}
            <div className="space-y-2.5 text-xs sm:text-sm text-brand-dark/75 leading-relaxed mb-6">
              <p className="font-semibold text-brand-dark">
                Вам подобається платформа UniQuiz?
              </p>
              <p className="text-brand-dark/70 font-normal">
                Ми розробляємо сервіс абсолютно безкоштовним для кожного студента. Якщо тренажер став вам у пригоді, ви можете підтримати розробника проєкту донатом на каву ☕ — будь-яка сума допомагає розвивати UniQuiz далі!
              </p>
            </div>

            {/* Кнопки дії */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={() => setDismissedModal(true)}
                className="w-full sm:flex-1 h-[46px] rounded-[12px] border border-[#152A32]/15 hover:bg-[#152A32]/5 text-brand-dark text-sm font-semibold transition-all"
              >
                Не зараз
              </button>
              
              <a
                href="https://www.privat24.ua/send/jlhil"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setDismissedModal(true)}
                className="w-full sm:flex-1 btn-accent h-[46px] text-sm font-bold shadow-soft flex items-center justify-center gap-2"
              >
                <Coffee size={16} />
                <span>Задонатити</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState, useMemo, useCallback, useRef, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, RefreshCw, CheckCircle2, XCircle, 
  Loader2, Shuffle, RotateCcw, Eye, EyeOff, Undo2, Check
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

// Мемоізована картка окремого питання (запобігає ре-рендеру 400+ карток при кожній відповіді)
const QuestionCard = memo(function QuestionCard({ 
  q, 
  qIndex, 
  userAnswer, 
  showAllCorrect, 
  onAnswer 
}) {
  return (
    <div className="card-clean p-5 sm:p-7 bg-white rounded-[20px] border border-[#152A32]/10 shadow-soft">
      {/* Заголовок питання з номером */}
      <div className="flex items-start gap-3.5 mb-5">
        <span className="shrink-0 w-8 h-8 flex items-center justify-center bg-brand-sage/15 text-brand-dark text-xs font-bold rounded-[10px]">
          {qIndex}
        </span>
        <p className="font-semibold text-brand-dark text-base sm:text-lg leading-snug pt-0.5">
          {q.content}
        </p>
      </div>

      {/* Варіанти відповідей */}
      <div className="space-y-2.5">
        {q.shuffledOptions.map((opt, oIdx) => {
          const isCorrect = opt === q.correct_answer;
          const isSelected = userAnswer?.chosen_answer === opt;
          
          let optionStyle = "w-full min-h-[48px] px-4 py-3.5 rounded-[12px] border text-left text-sm sm:text-base font-medium flex items-center justify-between gap-3 transition-all outline-none ";
          
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
              <span className="leading-snug">{opt}</span>
              
              {/* Семантичні іконки станів */}
              {showAllCorrect && isCorrect && (
                <span className="shrink-0">
                  <CheckCircle2 size={18} className="text-brand-sage" />
                </span>
              )}
              {!showAllCorrect && userAnswer && isCorrect && (
                <span className="shrink-0">
                  <CheckCircle2 size={18} className="text-brand-sage" />
                </span>
              )}
              {!showAllCorrect && userAnswer && isSelected && !isCorrect && (
                <span className="shrink-0">
                  <XCircle size={18} className="text-brand-terracotta" />
                </span>
              )}
            </button>
          );
        })}
      </div>
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

  // Оптимістичний UI запис відповіді з відкладеним збереженням
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

  // O(N) розрахунок статистики замість старого O(N^3)
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

  if (loading || resetting) {
    return (
      <div className="min-h-screen bg-brand-cream pb-24 font-sans">
        <SEO title="Завантаження тесту — UniQuiz" noindex={true} />
        <QuizPageSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream text-brand-dark pb-24 font-sans selection:bg-brand-sage/20 selection:text-brand-dark">
      <SEO 
        title={`${quizTitle} — Тест | UniQuiz`}
        description="Проходження інтерактивного тестування з підтримкою перемішування та роботи над помилками."
        canonical="https://uniquiz.pages.dev/test"
        noindex={true}
      />
      
      {/* ПАНЕЛЬ КЕРУВАННЯ — Тонка, sticky, фон #FFFCEE з легким blur */}
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
                className="h-[38px] px-2.5 sm:px-3 bg-white border border-[#152A32]/15 text-brand-dark hover:border-[#152A32]/30 hover:bg-[#152A32]/5 rounded-[12px] text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 focus-visible:outline-none"
              >
                <Shuffle size={14} className="text-brand-sage shrink-0" />
                <span className="hidden xs:inline">Змішати</span>
              </button>

              {/* Відповіді */}
              <button 
                onClick={() => setShowAllCorrect(!showAllCorrect)} 
                className={`h-[38px] px-2.5 sm:px-3 rounded-[12px] text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 focus-visible:outline-none border ${
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
                  className="h-[38px] px-2.5 sm:px-3 bg-brand-sage text-brand-cream border border-brand-sage rounded-[12px] text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 focus-visible:outline-none"
                >
                  <Undo2 size={14} className="shrink-0" />
                  <span className="hidden xs:inline">Назад</span>
                </button>
              ) : (
                <button 
                  onClick={toggleMistakesMode} 
                  className="h-[38px] px-2.5 sm:px-3 bg-white border border-[#152A32]/15 text-brand-dark hover:border-[#152A32]/30 hover:bg-[#152A32]/5 rounded-[12px] text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 focus-visible:outline-none"
                >
                  <RotateCcw size={14} className="text-brand-sage shrink-0" />
                  <span className="hidden xs:inline">Помилки</span>
                </button>
              )}

              {/* Скинути — із терракотовим акцентом лише на hover */}
              <button 
                onClick={resetProgress} 
                className="h-[38px] px-2.5 sm:px-3 bg-white border border-[#152A32]/15 text-brand-dark hover:border-brand-terracotta hover:text-brand-terracotta hover:bg-brand-terracotta/10 rounded-[12px] text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 focus-visible:outline-none group"
              >
                <RefreshCw size={14} className="text-brand-dark/60 group-hover:text-brand-terracotta transition-colors shrink-0" />
                <span className="hidden xs:inline">Скинути</span>
              </button>

            </div>

          </div>

          {/* Смужка прогресу — висотою 4px, заливка #6E825E */}
          <div 
            role="progressbar" 
            aria-valuenow={progressPercent} 
            aria-valuemin={0} 
            aria-valuemax={100}
            className="w-full h-1 bg-[#152A32]/8 rounded-full mt-2.5 overflow-hidden"
          >
            <div 
              className="h-full bg-brand-sage transition-all duration-300" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          
        </div>
      </div>

      {/* ОСНОВНА КОЛОНКА ТЕСТУ — вужча колонка ~720px */}
      <div className="max-w-[720px] mx-auto px-4 mt-6 sm:mt-8">
        <h1 className="text-center text-xs sm:text-sm font-semibold text-brand-dark/60 mb-4 tracking-wide uppercase">
          {quizTitle}
        </h1>
        
        {/* ІНДИКАТОР РЕЖИМУ РОБОТИ НАД ПОМИЛКАМИ */}
        {mistakesOnlyMode && (
          <div className="text-center mb-6">
             <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-sage/15 text-brand-dark text-xs sm:text-sm font-semibold rounded-full border border-brand-sage/30 shadow-sm">
               🚧 Робота над помилками
             </span>
          </div>
        )}

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
    </div>
  );
}

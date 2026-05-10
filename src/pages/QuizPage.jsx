import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, RefreshCw, CheckCircle2, XCircle, 
  Loader2, Shuffle, RotateCcw, Eye, EyeOff, Undo2 
} from 'lucide-react';

const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export default function QuizPage() {
  // ТЕПЕР МИ ОТРИМУЄМО ОБИДВА ПАРАМЕТРИ З URL
  const { courseId, sectionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Замість section зберігаємо універсальні дані для шапки та кнопки "Назад"
  const [quizTitle, setQuizTitle] = useState('Завантаження...');
  const [returnCourseId, setReturnCourseId] = useState(null);
  
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); 
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  
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

      // СЦЕНАРІЙ 1: Тестуємо КОНКРЕТНИЙ РОЗДІЛ
      if (sectionId) {
        const { data: secData } = await supabase
          .from('sections').select('title, course_id').eq('id', sectionId).single();
          
        headerTitle = secData?.title || 'Тест розділу';
        backId = secData?.course_id;

        const { data: qData } = await supabase
          .from('questions').select('*').eq('section_id', sectionId).order('created_at', { ascending: true });
        
        fetchedQuestions = qData || [];
      } 
      // СЦЕНАРІЙ 2: Тестуємо ВЕСЬ КУРС
      else if (courseId) {
        const { data: courseData } = await supabase
          .from('courses').select('title, id').eq('id', courseId).single();
          
        headerTitle = `${courseData?.title || 'Курс'} (Всі питання)`;
        backId = courseId;

        // Спочатку знаходимо всі розділи цього курсу
        const { data: sectionsData } = await supabase
          .from('sections').select('id').eq('course_id', courseId);
          
        const sectionIds = sectionsData?.map(s => s.id) || [];
        
        if (sectionIds.length > 0) {
          // Підтягуємо питання з УСІХ розділів
          const { data: qData } = await supabase
            .from('questions').select('*').in('section_id', sectionIds).order('created_at', { ascending: true });
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

      // Завантажуємо відповіді користувача
      const { data: aData } = await supabase
        .from('user_answers').select('question_id, is_correct, chosen_answer').eq('user_id', user.id);
      
      const answersMap = {};
      aData?.forEach(ans => {
        answersMap[ans.question_id] = { is_correct: ans.is_correct, chosen_answer: ans.chosen_answer };
      });
      setAnswers(answersMap);

    } catch (error) {
      console.error(error);
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

  const handleAnswer = async (questionId, option, correctAnswer) => {
    if (answers[questionId] || showAllCorrect) return; 

    const isCorrect = option === correctAnswer;
    setAnswers(prev => ({ ...prev, [questionId]: { is_correct: isCorrect, chosen_answer: option } }));

    await supabase.from('user_answers').upsert({
      user_id: user.id, question_id: questionId, is_correct: isCorrect, chosen_answer: option
    });
  };

  const resetProgress = async () => {
    if (!window.confirm('Очистити весь прогрес цього тестування?')) return;
    setResetting(true);
    const qIds = questions.map(q => q.id);
    
    // Щоб не перевищити ліміти бази даних на довгі запити, розбиваємо масив ID (якщо питань дуже багато)
    const chunkSize = 500;
    for (let i = 0; i < qIds.length; i += chunkSize) {
      const chunk = qIds.slice(i, i + chunkSize);
      await supabase.from('user_answers').delete().eq('user_id', user.id).in('question_id', chunk);
    }
    
    setAnswers({});
    setMistakesOnlyMode(false);
    setShowAllCorrect(false);
    setResetting(false);
  };

  const toggleMistakesMode = async () => {
    if (mistakesOnlyMode) {
      setMistakesOnlyMode(false);
      return;
    }

    const incorrectIds = Object.entries(answers)
      .filter(([id, ans]) => !ans.is_correct && questions.some(q => q.id === id))
      .map(([id]) => id);

    if (incorrectIds.length === 0) return alert('У вас немає завалених тестів!');
    
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

  if (loading || resetting) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  const answeredCount = Object.keys(answers).filter(id => questions.some(q => q.id === id)).length;
  const correctCount = Object.values(answers).filter(a => a.is_correct && questions.some(q => q.id === Object.keys(answers).find(k => answers[k] === a))).length;
  const progressPercent = Math.round((answeredCount / questions.length) * 100) || 0;
  const correctPercent = answeredCount ? Math.round((correctCount / answeredCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      
      {/* ПАНЕЛЬ КЕРУВАННЯ */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-2 py-2">
          
          <div className="flex items-center justify-between w-full">
            
            {/* ЛІВА ЧАСТИНА: Назад + Статистика */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 pr-1.5 sm:pr-2 border-r border-gray-200">
              <button onClick={() => navigate(`/course/${returnCourseId}`)} className="p-1 sm:p-1.5 text-textMuted hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft size={18} />
              </button>
              
              <div className="flex flex-col items-start justify-center min-w-[35px]">
                <span className="text-[10px] sm:text-[11px] font-bold text-textMain leading-tight">{answeredCount}/{questions.length}</span>
                <span className={`text-[10px] sm:text-[11px] font-bold leading-tight ${correctPercent >= 70 ? 'text-emerald-600' : 'text-orange-500'}`}>
                  {correctPercent}%
                </span>
              </div>
            </div>

            {/* ПРАВА ЧАСТИНА */}
            <div className="flex items-center justify-end gap-1 sm:gap-1.5 flex-1">
              
              {/* Змішати */}
              <button onClick={handleShuffleAll} className="flex flex-col items-center justify-center gap-0.5 sm:gap-1 min-w-[50px] sm:min-w-[70px] p-1.5 bg-white border border-gray-200 rounded-lg text-[9px] sm:text-[11px] font-bold hover:border-primary transition-all shadow-sm active:scale-95">
                <Shuffle size={14} className="text-primary" />
                <span>Змішати</span>
              </button>

              {/* Відповіді */}
              <button onClick={() => setShowAllCorrect(!showAllCorrect)} className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 min-w-[50px] sm:min-w-[70px] p-1.5 border rounded-lg text-[9px] sm:text-[11px] font-bold transition-all shadow-sm active:scale-95 ${showAllCorrect ? 'bg-primary text-white border-primary' : 'bg-white border-gray-100'}`}>
                {showAllCorrect ? <EyeOff size={14} /> : <Eye size={14} className="text-primary" />}
                <span>{showAllCorrect ? 'Сховати' : 'Відповіді'}</span>
              </button>

              {/* Помилки / Повернутись */}
              {mistakesOnlyMode ? (
                <button onClick={toggleMistakesMode} className="flex flex-col items-center justify-center gap-0.5 sm:gap-1 min-w-[50px] sm:min-w-[70px] p-1.5 bg-blue-50 border border-blue-100 rounded-lg text-[9px] sm:text-[11px] font-bold text-blue-700 hover:bg-blue-100 shadow-sm active:scale-95">
                  <Undo2 size={14} />
                  <span>Назад</span>
                </button>
              ) : (
                <button onClick={toggleMistakesMode} className="flex flex-col items-center justify-center gap-0.5 sm:gap-1 min-w-[50px] sm:min-w-[70px] p-1.5 bg-yellow-50 border border-yellow-100 rounded-lg text-[9px] sm:text-[11px] font-bold text-yellow-700 hover:bg-yellow-100 shadow-sm active:scale-95">
                  <RotateCcw size={14} />
                  <span>Помилки</span>
                </button>
              )}

              {/* Скинути */}
              <button onClick={resetProgress} className="flex flex-col items-center justify-center gap-0.5 sm:gap-1 min-w-[50px] sm:min-w-[70px] p-1.5 bg-red-50 border border-red-100 rounded-lg text-[9px] sm:text-[11px] font-bold text-red-600 hover:bg-red-100 shadow-sm active:scale-95">
                <RefreshCw size={14} />
                <span>Скинути</span>
              </button>

            </div>

          </div>

          {/* Смужка прогресу */}
          <div className="w-full h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
          </div>
          
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-3 sm:px-4 mt-4 sm:mt-6">
        <h1 className="text-center text-sm font-bold text-textMuted mb-2 sm:mb-3">{quizTitle}</h1>
        
        {/* ІНДИКАТОР РЕЖИМУ РОБОТИ НАД ПОМИЛКАМИ */}
        {mistakesOnlyMode && (
          <div className="text-center mb-4 sm:mb-6">
             <span className="inline-block px-4 py-1.5 bg-yellow-100 text-yellow-700 text-xs sm:text-sm font-bold rounded-xl border border-yellow-200 shadow-sm">
               🚧 Робота над помилками
             </span>
          </div>
        )}

        <div className="space-y-4">
          {visibleQuestions.map((q) => {
            const userAnswer = answers[q.id];
            return (
              <div key={q.id} className="glass-panel p-4 shadow-sm border border-white/60">
                <div className="flex gap-3 mb-4">
                  <span className="shrink-0 w-7 h-7 flex items-center justify-center bg-primary/10 text-primary text-[11px] font-bold rounded-lg">
                    {questions.indexOf(q) + 1}
                  </span>
                  <p className="font-semibold text-textMain text-sm leading-snug">{q.content}</p>
                </div>

                <div className="space-y-2">
                  {q.shuffledOptions.map((opt, oIdx) => {
                    const isCorrect = opt === q.correct_answer;
                    const isSelected = userAnswer?.chosen_answer === opt;
                    
                    let style = "w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all ";
                    if (showAllCorrect && isCorrect) {
                      style += "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold ring-1 ring-emerald-500";
                    } else if (userAnswer) {
                      if (isCorrect) style += "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold";
                      else if (isSelected) style += "bg-red-50 border-red-500 text-red-700";
                      else style += "opacity-50 border-gray-100 bg-gray-50";
                    } else {
                      style += "bg-white border-gray-100 hover:border-primary active:bg-gray-50";
                    }

                    return (
                      <button 
                        key={oIdx} 
                        disabled={!!userAnswer || showAllCorrect} 
                        onClick={() => handleAnswer(q.id, opt, q.correct_answer)} 
                        className={style}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
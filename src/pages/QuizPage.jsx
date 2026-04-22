import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, RefreshCw, CheckCircle2, XCircle, Loader2, Shuffle, RotateCcw, Eye, EyeOff } from 'lucide-react';

const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export default function QuizPage() {
  const { sectionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [section, setSection] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); 
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  
  // Новий стейт для режиму "фокусу на помилках"
  const [hideCorrect, setHideCorrect] = useState(false);

  useEffect(() => {
    fetchQuizData();
  }, [sectionId, user.id]);

  const fetchQuizData = async () => {
    setLoading(true);
    try {
      const { data: secData } = await supabase
        .from('sections')
        .select('title, course_id')
        .eq('id', sectionId)
        .single();
      setSection(secData);

      const { data: qData } = await supabase
        .from('questions')
        .select('*')
        .eq('section_id', sectionId)
        .order('created_at', { ascending: true });

      const questionsWithShuffledOptions = (qData || []).map(q => ({
        ...q,
        shuffledOptions: shuffleArray(q.options)
      }));
      
      setQuestions(questionsWithShuffledOptions);

      const { data: aData } = await supabase
        .from('user_answers')
        .select('question_id, is_correct, chosen_answer')
        .eq('user_id', user.id);
      
      const answersMap = {};
      aData?.forEach(ans => {
        answersMap[ans.question_id] = {
          is_correct: ans.is_correct,
          chosen_answer: ans.chosen_answer
        };
      });
      setAnswers(answersMap);

    } catch (error) {
      console.error('Помилка завантаження тесту:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShuffleQuestions = () => {
    setQuestions(prev => shuffleArray(prev));
  };

  const handleAnswer = async (questionId, option, correctAnswer) => {
    if (answers[questionId]) return; 

    const isCorrect = option === correctAnswer;
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: { is_correct: isCorrect, chosen_answer: option }
    }));

    const { error } = await supabase
      .from('user_answers')
      .upsert({
        user_id: user.id,
        question_id: questionId,
        is_correct: isCorrect,
        chosen_answer: option
      });

    if (error) console.error('Помилка збереження відповіді:', error);
  };

  // Скидання всього прогресу
  const resetProgress = async () => {
    if (!window.confirm('Скинути весь прогрес цього розділу?')) return;
    
    setResetting(true);
    try {
      const qIds = questions.map(q => q.id);
      
      const { error } = await supabase
        .from('user_answers')
        .delete()
        .eq('user_id', user.id)
        .in('question_id', qIds);

      if (error) throw error;
      
      setAnswers({});
      setHideCorrect(false); // Вимикаємо фільтр при повному скиданні
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      alert('Помилка при скиданні прогресу');
    } finally {
      setResetting(false);
    }
  };

  // НОВЕ: Скидання ТІЛЬКИ неправильних відповідей
  const resetIncorrectProgress = async () => {
    const incorrectIds = Object.entries(answers)
      .filter(([id, ans]) => !ans.is_correct && questions.some(q => q.id === id))
      .map(([id]) => id);

    if (incorrectIds.length === 0) {
      alert('У вас немає неправильних відповідей у цьому розділі!');
      return;
    }

    if (!window.confirm('Скинути неправильні відповіді, щоб пройти їх знову?')) return;
    
    setResetting(true);
    try {
      const { error } = await supabase
        .from('user_answers')
        .delete()
        .eq('user_id', user.id)
        .in('question_id', incorrectIds);

      if (error) throw error;
      
      // Оновлюємо локальний стейт
      setAnswers(prev => {
        const newAnswers = { ...prev };
        incorrectIds.forEach(id => delete newAnswers[id]);
        return newAnswers;
      });
      
      // Автоматично вмикаємо приховування правильних відповідей для зручності
      setHideCorrect(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      alert('Помилка при скиданні помилок');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-primary">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  const answeredCount = Object.keys(answers).filter(id => questions.some(q => q.id === id)).length;
  const correctCount = Object.values(answers).filter(a => a.is_correct && questions.some(q => q.id === Object.keys(answers).find(key => answers[key] === a))).length;
  
  const progressPercent = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
  const correctPercent = answeredCount ? Math.round((correctCount / answeredCount) * 100) : 0;

  // Фільтруємо питання для відображення
  const visibleQuestions = hideCorrect 
    ? questions.filter(q => !answers[q.id] || !answers[q.id].is_correct)
    : questions;

  return (
    <div className="min-h-screen bg-background pb-20">
      
      {/* Фіксована панель прогресу */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center mb-3">
            
            <button 
              onClick={() => navigate(`/course/${section?.course_id}`)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-textMuted hover:text-textMain"
              title="Повернутися до розділів"
            >
              <ArrowLeft size={20} />
            </button>
            
            <div className="flex flex-col items-center">
              <span className="text-sm font-bold text-textMain tracking-wide">
                Прогрес: {answeredCount} / {questions.length}
              </span>
              {answeredCount > 0 && (
                <span className={`text-xs font-semibold ${correctPercent >= 70 ? 'text-emerald-600' : correctPercent >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                  Правильно: {correctPercent}% ({correctCount})
                </span>
              )}
            </div>

            {/* Оновлений блок кнопок керування */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button 
                onClick={() => setHideCorrect(!hideCorrect)}
                className={`p-2 transition-colors rounded-lg ${hideCorrect ? 'bg-primary/10 text-primary' : 'text-textMuted hover:text-primary hover:bg-primary/5'}`}
                title={hideCorrect ? "Показати всі питання" : "Приховати правильні відповіді"}
              >
                {hideCorrect ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <button 
                onClick={handleShuffleQuestions}
                className="p-2 text-textMuted hover:text-primary transition-colors rounded-lg hover:bg-primary/5 hidden sm:block"
                title="Перемішати порядок питань"
              >
                <Shuffle size={18} />
              </button>
              <button 
                onClick={resetIncorrectProgress}
                disabled={resetting}
                className="p-2 text-textMuted hover:text-yellow-600 transition-colors rounded-lg hover:bg-yellow-50"
                title="Скинути тільки помилки"
              >
                <RotateCcw size={18} className={resetting ? "animate-spin" : ""} />
              </button>
              <button 
                onClick={resetProgress}
                disabled={resetting}
                className="p-2 text-textMuted hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 hidden sm:block"
                title="Очистити весь прогрес розділу"
              >
                <RefreshCw size={18} className={resetting ? "animate-spin" : ""} />
              </button>
            </div>
            
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-8">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-textMain">{section?.title}</h1>
          {hideCorrect && (
            <span className="inline-block mt-2 px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
              Режим роботи над помилками
            </span>
          )}
        </div>

        <div className="space-y-6">
          {visibleQuestions.length === 0 ? (
            <div className="text-center p-8 glass-panel text-textMuted">
              Тут поки немає питань для відображення.
            </div>
          ) : (
            visibleQuestions.map((q, idx) => {
              const userAnswer = answers[q.id];
              // Зберігаємо оригінальний номер питання для відображення
              const originalIdx = questions.findIndex(orig => orig.id === q.id) + 1;
              
              return (
                <div key={q.id} className="glass-panel p-6 sm:p-8">
                  <div className="flex gap-4 mb-6">
                    <span className="text-sm font-bold text-primary bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" title={`Питання №${originalIdx}`}>
                      {originalIdx}
                    </span>
                    <p className="text-textMain font-medium leading-relaxed">{q.content}</p>
                  </div>

                  <div className="grid gap-3">
                    {q.shuffledOptions.map((option, oIdx) => {
                      const isSelected = userAnswer?.chosen_answer === option;
                      const isCorrect = option === q.correct_answer;
                      const showSuccess = (userAnswer && isCorrect);
                      const showError = (isSelected && !userAnswer.is_correct);

                      let btnClass = "w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 flex justify-between items-center ";
                      
                      if (!userAnswer) {
                        btnClass += "bg-white border-gray-100 hover:border-primary hover:shadow-sm";
                      } else if (showSuccess) {
                        btnClass += "bg-emerald-50 border-emerald-200 text-emerald-700 font-medium";
                      } else if (showError) {
                        btnClass += "bg-red-50 border-red-200 text-red-700";
                      } else {
                        btnClass += "bg-gray-50 border-gray-100 text-gray-400 opacity-60";
                      }

                      return (
                        <button
                          key={oIdx}
                          disabled={!!userAnswer}
                          onClick={() => handleAnswer(q.id, option, q.correct_answer)}
                          className={btnClass}
                        >
                          <span className="flex-grow">{option}</span>
                          {showSuccess && <CheckCircle2 size={18} />}
                          {showError && <XCircle size={18} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Фінальний екран результатів */}
        {progressPercent === 100 && (
          <div className="mt-12 text-center p-8 sm:p-12 glass-panel border border-primary/20 shadow-lg relative overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl"></div>
            
            <div className="relative z-10">
              {correctPercent === 100 ? (
                <>
                  <div className="w-20 h-20 bg-gradient-to-tr from-green-400 to-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
                    <Trophy size={40} />
                  </div>
                  <h2 className="text-3xl font-bold text-textMain mb-3">Ідеально!</h2>
                  <p className="text-textMuted mb-8 text-lg">Ви пройшли всі тести без жодної помилки.</p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-gradient-to-tr from-yellow-400 to-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-200">
                    <CheckCircle2 size={40} />
                  </div>
                  <h2 className="text-3xl font-bold text-textMain mb-3">Розділ завершено!</h2>
                  <p className="text-textMuted mb-8 text-lg">Ваш результат: <span className="font-bold text-textMain">{correctPercent}%</span> правильних відповідей.</p>
                </>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {correctPercent < 100 && (
                  <button 
                    onClick={resetIncorrectProgress}
                    className="px-8 py-3.5 bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={18} /> Виправити помилки
                  </button>
                )}
                <button 
                  onClick={() => navigate(`/course/${section?.course_id}`)}
                  className="px-8 py-3.5 bg-primary text-white rounded-xl font-medium shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  До списку розділів
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Додаємо імпорт Trophy для красивого фінального екрану
import { Trophy } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  Trash2, 
  Loader2, 
  BookOpen, 
  PlayCircle,
  AlertTriangle,
  ListChecks
} from 'lucide-react';

export default function CoursePage() {
  // Витягуємо всі параметри і беремо той, що існує (id або courseId)
  const params = useParams();
  const actualId = params.id || params.courseId; 

  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchCourseData = async () => {
      // Захист від пустих запитів
      if (!actualId || actualId === 'undefined') {
        setLoading(false);
        return; 
      }

      try {
        // 1. Завантажуємо інформацію про курс
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', actualId)
          .single();
          
        if (courseError) throw courseError;
        setCourse(courseData);

        // 2. Завантажуємо питання для цього курсу
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('course_id', actualId);
          
        if (questionsError) throw questionsError;
        setQuestions(questionsData);

      } catch (error) {
        console.error("Помилка завантаження курсу:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [actualId]);

  // Функція видалення курсу
  const handleDeleteCourse = async () => {
    if (!window.confirm("Ви впевнені, що хочете назавжди видалити цей курс? Цю дію неможливо скасувати.")) {
      return;
    }

    setIsDeleting(true);
    try {
      // Крок 1: Видаляємо всі питання, прив'язані до курсу
      const { error: questionsError } = await supabase
        .from('questions')
        .delete()
        .eq('course_id', course.id);
        
      if (questionsError) throw questionsError;

      // Крок 2: Видаляємо сам курс
      const { error: courseError } = await supabase
        .from('courses')
        .delete()
        .eq('id', course.id);
        
      if (courseError) throw courseError;

      // Крок 3: Повертаємось на головну сторінку
      navigate('/');
    } catch (error) {
      console.error('Помилка видалення:', error);
      alert('Не вдалося видалити курс. Можливо, у вас немає прав.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="animate-pulse flex flex-col items-center gap-4 text-blue-600">
          <Loader2 size={32} className="animate-spin" />
          <span className="font-medium">Завантаження курсу...</span>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-4 text-center">
        <AlertTriangle size={48} className="text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Курс не знайдено</h2>
        <p className="text-slate-500 mb-6">Можливо, він був видалений або посилання недійсне.</p>
        <button onClick={() => navigate('/')} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold transition-transform hover:scale-105">
          На головну
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans relative overflow-hidden">
      {/* Декоративні фони */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-400/10 rounded-full mix-blend-multiply filter blur-[80px] pointer-events-none"></div>
      
      {/* Навігація */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate('/')} 
            className="p-2.5 hover:bg-slate-100 rounded-2xl transition-all text-slate-500 active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Назад до курсів</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8 relative z-10">
        
        {/* ШАПКА КУРСУ */}
        <div className="bg-white/90 backdrop-blur-sm p-8 sm:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                  <BookOpen size={24} />
                </div>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wide">
                  Тестовий модуль
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-800 leading-tight">
                {course.title}
              </h1>
              {course.description && (
                <p className="text-slate-500 mt-3 font-medium text-lg">{course.description}</p>
              )}
            </div>

            {/* Кнопка видалення ТІЛЬКИ для автора курсу */}
            {user && user.id === course.creator_id && (
              <button 
                onClick={handleDeleteCourse}
                disabled={isDeleting}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-2xl text-sm font-bold transition-all duration-300 shadow-sm hover:shadow-red-200 border border-red-100 disabled:opacity-50 w-full sm:w-auto shrink-0 group"
              >
                {isDeleting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                )}
                <span>{isDeleting ? 'Видалення...' : 'Видалити курс'}</span>
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => navigate(`/test/${course.id}`)}
              disabled={questions.length === 0}
              className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold transition-all duration-300 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlayCircle size={22} />
              Почати тренування
            </button>
            
            <div className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-bold">
              <ListChecks size={22} className="text-slate-400" />
              {questions.length} питань
            </div>
          </div>
        </div>

        {/* СПИСОК ПИТАНЬ (Попередній перегляд) */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-700 ml-2 mb-4">Попередній перегляд (перші 10 питань)</h3>
          
          {questions.slice(0, 10).map((q, index) => (
            <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <p className="font-bold text-slate-800 mb-4">
                <span className="text-blue-500 mr-2">{index + 1}.</span> 
                {q.content}
              </p>
              <div className="space-y-2 pl-6">
                {q.options.map((opt, i) => (
                  <div key={i} className={`p-3 rounded-xl text-sm font-medium border ${opt === q.correct_answer ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {questions.length > 10 && (
            <div className="text-center py-6 text-slate-400 font-medium text-sm">
              Та ще {questions.length - 10} питань...
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
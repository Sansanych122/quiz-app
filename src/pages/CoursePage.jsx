import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  Trash2, 
  Loader2, 
  PlayCircle,
  AlertTriangle,
  ListChecks,
  Layers,
  Lock,
  Globe
} from 'lucide-react';

export default function CoursePage() {
  const params = useParams();
  const actualId = params.id || params.courseId; 

  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [allQuestionsCount, setAllQuestionsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!actualId || actualId === 'undefined') {
        setLoading(false);
        return; 
      }

      try {
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select(`
            *,
            sections (
              *,
              questions (*)
            )
          `)
          .eq('id', actualId)
          .single();
          
        if (courseError) throw courseError;
        
        if (courseData.sections) {
          courseData.sections.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        }
        
        setCourse(courseData);

        // Рахуємо загальну кількість питань без збереження їх усіх у пам'ять
        const totalCount = courseData.sections?.reduce((sum, section) => sum + (section.questions?.length || 0), 0) || 0;
        setAllQuestionsCount(totalCount);

      } catch (error) {
        console.error("Помилка завантаження курсу:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [actualId]);

  const handleDeleteCourse = async () => {
    if (!window.confirm("Ви впевнені, що хочете назавжди видалити цей курс разом з усіма розділами та питаннями?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const sectionIds = course.sections?.map(s => s.id) || [];

      if (sectionIds.length > 0) {
        const { error: qError } = await supabase
          .from('questions')
          .delete()
          .in('section_id', sectionIds);
        if (qError) throw qError;

        const { error: sError } = await supabase
          .from('sections')
          .delete()
          .eq('course_id', course.id);
        if (sError) throw sError;
      }

      const { error: cError } = await supabase
        .from('courses')
        .delete()
        .eq('id', course.id);
      if (cError) throw cError;

      navigate('/');
    } catch (error) {
      console.error('Помилка видалення:', error);
      alert('Не вдалося видалити курс. Перевірте консоль для деталей.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 size={28} className="animate-spin text-slate-800" />
          <span className="text-sm font-medium">Завантаження курсу...</span>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Курс не знайдено</h2>
        <p className="text-sm text-slate-500 mb-6 max-w-sm">Можливо, він був видалений власником або посилання більше недійсне.</p>
        <button 
          onClick={() => navigate('/')} 
          className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Повернутися на головну
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      
      {/* Навігація */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate('/')} 
            className="text-slate-400 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-sm font-semibold text-slate-800">Перегляд курсу</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8">
        
        {/* Головна картка курсу */}
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                {course.is_public ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-xs font-bold uppercase tracking-wide">
                    <Globe size={14} /> Публічний
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold uppercase tracking-wide">
                    <Lock size={14} /> Приватний
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                {course.title}
              </h1>
              {course.description && (
                <p className="text-slate-500 mt-3 text-sm leading-relaxed">{course.description}</p>
              )}
            </div>

            {user && user.id === course.creator_id && (
              <button 
                onClick={handleDeleteCourse}
                disabled={isDeleting}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-sm font-medium transition-colors border border-red-100 disabled:opacity-50 shrink-0"
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                <span className="hidden sm:inline">{isDeleting ? 'Видалення...' : 'Видалити курс'}</span>
              </button>
            )}
          </div>

          {/* Панель дій */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100">
            <button 
              onClick={() => navigate(`/test/${course.id}`)}
              disabled={allQuestionsCount === 0}
              className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlayCircle size={18} />
              Почати весь курс
            </button>
            
            <div className="flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-sm font-medium">
              <ListChecks size={18} className="text-slate-400" />
              Всього {allQuestionsCount} {allQuestionsCount === 1 ? 'питання' : (allQuestionsCount > 1 && allQuestionsCount < 5) ? 'питання' : 'питань'}
            </div>
          </div>
        </div>

        {/* Список розділів */}
        <div className="mb-10">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <Layers className="text-slate-400" size={20} /> 
            Розділи курсу ({course.sections?.length || 0})
          </h3>
          
          <div className="space-y-3">
            {course.sections?.length > 0 ? (
              course.sections.map((section, idx) => (
                <div key={section.id} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center text-sm font-semibold">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-base leading-snug">{section.title}</h4>
                      <p className="text-slate-500 text-xs mt-1">Кількість питань: {section.questions?.length || 0}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => navigate(`/test/section/${section.id}`)}
                    disabled={!section.questions || section.questions.length === 0}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 w-full sm:w-auto shrink-0"
                  >
                    <PlayCircle size={16} className="text-slate-400" />
                    Тестування
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 bg-white border border-dashed border-slate-200 rounded-2xl text-center">
                <p className="text-slate-500 text-sm">У цьому курсі ще немає жодного розділу.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
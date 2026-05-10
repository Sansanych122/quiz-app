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
  ListChecks,
  Layers
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
        <button onClick={() => navigate('/')} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold">
          На головну
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-400/10 rounded-full mix-blend-multiply filter blur-[80px] pointer-events-none"></div>
      
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
        
        <div className="bg-white/90 backdrop-blur-sm p-8 sm:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                  <BookOpen size={24} />
                </div>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wide">
                  {course.is_public ? 'Публічний курс' : 'Приватний курс'}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-800 leading-tight">
                {course.title}
              </h1>
              {course.description && (
                <p className="text-slate-500 mt-3 font-medium text-lg">{course.description}</p>
              )}
            </div>

            {user && user.id === course.creator_id && (
              <button 
                onClick={handleDeleteCourse}
                disabled={isDeleting}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-2xl text-sm font-bold transition-all duration-300 shadow-sm hover:shadow-red-200 border border-red-100 disabled:opacity-50 shrink-0 group"
              >
                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} className="group-hover:scale-110 transition-transform" />}
                <span className="hidden sm:inline">{isDeleting ? 'Видалення...' : 'Видалити курс'}</span>
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => navigate(`/test/${course.id}`)}
              disabled={allQuestionsCount === 0}
              className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold transition-all duration-300 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlayCircle size={22} />
              Почати весь курс
            </button>
            
            <div className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-bold">
              <ListChecks size={22} className="text-slate-400" />
              Всього {allQuestionsCount} питань
            </div>
          </div>
        </div>

        <div className="mb-10">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4 ml-2">
            <Layers className="text-blue-500" size={24} /> 
            Розділи курсу ({course.sections?.length || 0})
          </h3>
          
          <div className="space-y-4">
            {course.sections?.length > 0 ? (
              course.sections.map((section, idx) => (
                <div key={section.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">{section.title}</h4>
                      <p className="text-slate-500 text-sm">Кількість питань: {section.questions?.length || 0}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => navigate(`/test/section/${section.id}`)}
                    disabled={!section.questions || section.questions.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 text-slate-600 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                  >
                    <PlayCircle size={16} />
                    Почати тести
                  </button>
                </div>
              ))
            ) : (
              <div className="text-slate-400 p-6 bg-white border border-dashed border-slate-200 rounded-2xl text-center">
                У цьому курсі ще немає жодного розділу.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
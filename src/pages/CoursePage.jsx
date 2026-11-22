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
import SEO from '../components/SEO';

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
      <div className="min-h-screen flex items-center justify-center bg-brand-cream">
        <div className="flex flex-col items-center gap-3 text-brand-sage">
          <Loader2 size={28} className="animate-spin" />
          <span className="text-sm font-medium text-brand-dark/70">Завантаження курсу...</span>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-cream p-6 text-center">
        <div className="w-16 h-16 bg-white border border-[#152A32]/10 rounded-[20px] flex items-center justify-center mb-4 text-brand-dark/40 shadow-soft">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-bold text-brand-dark mb-2">Курс не знайдено</h2>
        <p className="text-sm text-brand-dark/70 mb-6 max-w-sm">Можливо, він був видалений власником або посилання більше недійсне.</p>
        <button 
          onClick={() => navigate('/')} 
          className="btn-primary"
        >
          Повернутися на головну
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream text-brand-dark pb-20 font-sans selection:bg-brand-sage/20 selection:text-brand-dark">
      <SEO 
        title={`${course.title} — UniQuiz`}
        description={course.description || "Перегляд навчального курсу та проходження модульних тестів."}
        canonical={`https://uniquiz.pages.dev/course/${course.id}`}
        noindex={true}
      />
      {/* Навігація */}
      <div className="bg-brand-cream/95 backdrop-blur-md border-b border-[#152A32]/10 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate('/')} 
            className="w-9 h-9 flex items-center justify-center text-brand-dark/70 hover:text-brand-dark hover:bg-[#152A32]/5 rounded-[10px] transition-colors focus-visible:outline-none"
            aria-label="Повернутися на головну"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="text-sm font-bold text-brand-dark">Перегляд курсу</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8">
        
        {/* Головна картка курсу */}
        <div className="bg-white p-7 sm:p-10 rounded-[20px] border border-[#152A32]/10 shadow-soft mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                {course.is_public ? (
                  <span className="badge-pill bg-brand-sage/15 text-brand-dark border border-brand-sage/30 text-xs font-semibold flex items-center gap-1.5">
                    <Globe size={14} /> Публічний
                  </span>
                ) : (
                  <span className="badge-pill bg-[#152A32]/8 text-brand-dark border border-[#152A32]/10 text-xs font-semibold flex items-center gap-1.5">
                    <Lock size={14} /> Приватний
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark leading-tight">
                {course.title}
              </h1>
              {course.description && (
                <p className="text-brand-dark/70 mt-3 text-sm leading-relaxed">{course.description}</p>
              )}
            </div>

            {user && user.id === course.creator_id && (
              <button 
                onClick={handleDeleteCourse}
                disabled={isDeleting}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-brand-terracotta border border-brand-terracotta/30 hover:bg-brand-terracotta/10 rounded-[12px] text-sm font-semibold transition-colors disabled:opacity-50 shrink-0"
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                <span className="hidden sm:inline">{isDeleting ? 'Видалення...' : 'Видалити курс'}</span>
              </button>
            )}
          </div>

          {/* Панель дій */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-[#152A32]/10">
            <button 
              onClick={() => navigate(`/test/${course.id}`)}
              disabled={allQuestionsCount === 0}
              className="btn-accent flex-1 h-[48px] text-sm font-bold"
            >
              <PlayCircle size={18} />
              Почати весь курс
            </button>
            
            <div className="flex items-center justify-center gap-2 px-6 py-3 bg-[#152A32]/5 border border-[#152A32]/10 rounded-[12px] text-brand-dark text-sm font-medium">
              <ListChecks size={18} className="text-brand-dark/50" />
              Всього {allQuestionsCount} {allQuestionsCount === 1 ? 'питання' : (allQuestionsCount > 1 && allQuestionsCount < 5) ? 'питання' : 'питань'}
            </div>
          </div>
        </div>

        {/* Список розділів */}
        <div className="mb-10">
          <h3 className="text-lg font-bold text-brand-dark flex items-center gap-2 mb-4">
            <Layers className="text-brand-sage" size={20} /> 
            Розділи курсу ({course.sections?.length || 0})
          </h3>
          
          <div className="space-y-3">
            {course.sections?.length > 0 ? (
              course.sections.map((section, idx) => (
                <div key={section.id} className="bg-white p-4 sm:p-5 rounded-[16px] border border-[#152A32]/10 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-brand-sage/40 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 shrink-0 rounded-[10px] bg-brand-sage/15 text-brand-dark flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-brand-dark text-base leading-snug">{section.title}</h4>
                      <p className="text-brand-dark/60 text-xs mt-0.5">Кількість питань: {section.questions?.length || 0}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => navigate(`/test/section/${section.id}`)}
                    disabled={!section.questions || section.questions.length === 0}
                    className="btn-secondary h-[42px] px-4 py-2 text-xs sm:text-sm font-semibold rounded-[10px] disabled:opacity-50 w-full sm:w-auto shrink-0"
                  >
                    <PlayCircle size={16} className="text-brand-sage" />
                    Тестування
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 bg-white border border-dashed border-[#152A32]/15 rounded-[20px] text-center">
                <p className="text-brand-dark/60 text-sm">У цьому курсі ще немає жодного розділу.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

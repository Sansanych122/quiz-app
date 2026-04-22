import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Layers, PlayCircle, Activity } from 'lucide-react';

export default function CoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        // 1. Отримуємо інформацію про сам курс
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();

        if (courseError) throw courseError;
        setCourse(courseData);

        // 2. Отримуємо всі розділи цього курсу та одразу рахуємо кількість питань у кожному
        const { data: sectionsData, error: sectionsError } = await supabase
          .from('sections')
          .select('id, title, created_at, questions(count)')
          .eq('course_id', courseId)
          .order('created_at', { ascending: true }); // Сортуємо за часом створення

        if (sectionsError) throw sectionsError;
        setSections(sectionsData);

      } catch (error) {
        console.error('Помилка завантаження курсу:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4 text-primary">
          <Activity size={32} className="animate-spin" />
          <span className="font-medium">Завантаження курсу...</span>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
        <p className="text-xl font-semibold text-textMain mb-4">Курс не знайдено або він недоступний</p>
        <button 
          onClick={() => navigate('/')} 
          className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-blue-600 transition-colors"
        >
          Повернутися на головну
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative pb-20">
      {/* Декоративний фон */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-4 pt-8 relative z-10">
        
        {/* Кнопка назад */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-textMuted hover:text-primary transition-colors mb-6 group w-fit"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Назад до курсів</span>
        </button>

        {/* Шапка курсу */}
        <div className="glass-panel p-8 mb-8">
          <h1 className="text-3xl font-bold text-textMain mb-3">{course.title}</h1>
          <p className="text-textMuted">{course.description}</p>
        </div>

        {/* Список розділів */}
        <div className="flex items-center gap-2 mb-6">
          <Layers className="text-primary" size={24} />
          <h2 className="text-xl font-semibold text-textMain">Розділи курсу ({sections.length})</h2>
        </div>

        <div className="space-y-4">
          {sections.length === 0 ? (
            <div className="glass-panel p-8 text-center text-textMuted">
              У цьому курсі ще немає доданих тестів.
            </div>
          ) : (
            sections.map((section, index) => {
              // Supabase повертає count у вигляді масиву об'єктів для пов'язаних таблиць
              const questionsCount = section.questions[0]?.count || 0;

              return (
                <div key={section.id} className="glass-panel p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:shadow-md transition-shadow">
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-textMain">{section.title}</h3>
                      <p className="text-sm text-textMuted mt-1">
                        Кількість питань: {questionsCount}
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate(`/section/${section.id}`)}
                    className="w-full sm:w-auto px-6 py-2.5 bg-white border border-gray-200 text-textMain hover:border-primary hover:text-primary rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-sm group-hover:bg-primary group-hover:text-white group-hover:border-primary"
                  >
                    <PlayCircle size={18} /> Почати тести
                  </button>
                  
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  LogOut, 
  BookOpen, 
  Trophy, 
  Send, 
  Coffee, 
  ChevronRight, 
  PlusCircle, 
  Medal,
  User as UserIcon,
  Globe
} from 'lucide-react';
import { CourseCardSkeleton, LeaderboardSkeleton } from '../components/Skeleton';
import SEO from '../components/SEO';
import { useToast } from '../components/Toast';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        // Одночасне завантаження через Promise.all усуває послідовний waterfall
        const [profileRes, coursesRes, leaderboardRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('nickname')
            .eq('id', user.id)
            .single(),
          supabase
            .from('courses')
            .select('id, title, description, is_public, creator_id, created_at')
            .or(`is_public.eq.true,creator_id.eq.${user.id}`)
            .order('created_at', { ascending: false }),
          supabase
            .from('profiles')
            .select('nickname, correct_answers, total_answers')
            .order('correct_answers', { ascending: false })
            .order('total_answers', { ascending: false })
            .limit(10),
        ]);

        if (!isMounted) return;

        if (profileRes.data) setProfile(profileRes.data);
        if (coursesRes.data) setCourses(coursesRes.data);
        if (leaderboardRes.data) setLeaderboard(leaderboardRes.data);

      } catch (error) {
        console.error('Помилка завантаження даних:', error);
        addToast({ message: 'Не вдалося оновити дані дашборду', type: 'error' });
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }

    return () => {
      isMounted = false;
    };
  }, [user, addToast]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      addToast({ message: 'Ви вийшли з акаунту', type: 'info' });
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  // Prefetch сторінки курсу при наведенні для миттєвого переходу
  const handleCourseHover = () => {
    import('./CoursePage');
  };

  return (
    <div className="min-h-screen bg-brand-cream text-brand-dark relative pb-20 font-sans selection:bg-brand-sage/20 selection:text-brand-dark">
      <SEO 
        title="Мої курси та тренажери — UniQuiz" 
        description="Особистий простір для проходження навчальних курсів, тестів та рейтингу студентів."
        canonical="https://uniquiz.pages.dev/dashboard"
        noindex={true}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 relative z-10">
        
        {/* ВЕРХНЯ ПАНЕЛЬ (Header) — Чиста, без великої «плаваючої» картки */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 pb-6 mb-8 border-b border-[#152A32]/10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-dark">
              Uni<span className="text-brand-sage">Quiz</span>
            </h1>
            <p className="text-xs sm:text-sm text-brand-dark/70 font-normal mt-0.5">
              Твій розумний простір для навчання з підтримкою AI
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-5 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">
            {/* Текстові посилання */}
            <a 
              href="https://t.me/smyk_oleksandr" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm font-semibold text-brand-dark/70 hover:text-brand-sage transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:text-brand-sage"
            >
              <Send size={15} />
              <span>Contact us</span>
            </a>
            
            <a 
              href="https://www.privat24.ua/send/jlhil" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm font-semibold text-brand-dark/70 hover:text-brand-sage transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:text-brand-sage"
            >
              <Coffee size={15} />
              <span>Donate</span>
            </a>
            
            {/* Вертикальний розділювач */}
            <div className="w-px h-5 bg-[#152A32]/10 hidden sm:block"></div>
            
            {/* Кнопка виходу */}
            <button 
              onClick={handleLogout} 
              className="w-9 h-9 flex items-center justify-center text-brand-dark/60 hover:text-brand-terracotta hover:bg-brand-terracotta/10 rounded-full transition-colors border border-[#152A32]/10 focus-visible:outline-none" 
              title="Вийти"
              aria-label="Вийти з акаунту"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* СІТКА КОНТЕНТУ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ЛІВА ЧАСТИНА (Курси) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* КНОПКА СТВОРЕННЯ */}
            <section>
              <div 
                onClick={() => navigate('/add-course')} 
                className="group relative bg-white p-6 sm:p-8 rounded-[20px] border border-[#152A32]/10 hover:border-brand-sage/40 shadow-soft hover:shadow-soft-hover transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center active:scale-[0.99]"
              >
                <div className="w-14 h-14 rounded-2xl bg-brand-sage/15 text-brand-sage flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform duration-200">
                  <PlusCircle size={28} />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-brand-dark group-hover:text-brand-sage transition-colors">
                  Створити розумний курс
                </h2>
                <p className="text-sm text-brand-dark/70 mt-1 font-normal max-w-sm mx-auto leading-relaxed">
                  Завантажте свій конспект чи лекцію, а наш AI автоматично згенерує з нього тести
                </p>
              </div>
            </section>

            {/* СПИСОК КУРСІВ */}
            <section>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="p-2 bg-brand-sage/15 text-brand-sage rounded-xl">
                  <BookOpen size={18} />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-brand-dark tracking-tight">Доступні курси</h2>
              </div>
              
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <CourseCardSkeleton />
                  <CourseCardSkeleton />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {courses.length === 0 ? (
                    <div className="col-span-full bg-white p-8 rounded-[20px] border border-[#152A32]/10 text-center text-brand-dark/70 font-normal shadow-soft">
                      <p className="mb-4">Курсів поки немає. Створіть свій перший курс за допомогою файлу або AI!</p>
                      <button
                        onClick={() => navigate('/add-course')}
                        className="btn-primary text-sm h-[44px]"
                      >
                        Створити перший курс
                      </button>
                    </div>
                  ) : (
                    courses.map((course) => (
                      <div 
                        key={course.id} 
                        onMouseEnter={handleCourseHover}
                        className="bg-white p-6 rounded-[20px] border border-[#152A32]/10 shadow-soft hover:shadow-soft-hover hover:-translate-y-0.5 transition-all duration-200 flex flex-col group"
                      >
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-3">
                            {course.creator_id === user.id ? (
                              <span className="badge-pill bg-[#152A32]/8 text-brand-dark border border-[#152A32]/10 text-[11px] font-semibold flex items-center gap-1">
                                <UserIcon size={12} /> Мій курс
                              </span>
                            ) : (
                              <span className="badge-pill bg-brand-sage/15 text-brand-dark border border-brand-sage/30 text-[11px] font-semibold flex items-center gap-1">
                                <Globe size={12} /> Публічний
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-lg text-brand-dark mb-1.5 leading-snug group-hover:text-brand-sage transition-colors">
                            {course.title}
                          </h3>
                          <p className="text-sm text-brand-dark/70 mb-5 line-clamp-2 leading-relaxed">
                            {course.description || 'Немає додаткового опису'}
                          </p>
                        </div>
                        
                        <button 
                          onClick={() => navigate(`/course/${course.id}`)} 
                          className="w-full h-[44px] bg-transparent hover:bg-brand-dark text-brand-dark hover:text-brand-cream rounded-[12px] text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 border border-[#152A32]/15 hover:border-brand-dark active:scale-[0.98] group/btn"
                        >
                          Відкрити курс <ChevronRight size={16} className="group-hover/btn:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </section>
          </div>

          {/* ПРАВА ЧАСТИНА (Рейтинг) — На мобільних переноситься під курси */}
          <div className="lg:col-span-1">
            <section className="sticky top-6">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="p-2 bg-brand-sage/15 text-brand-sage rounded-xl">
                  <Trophy size={18} />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-brand-dark tracking-tight">Топ студентів</h2>
              </div>
              
              {loading ? (
                <LeaderboardSkeleton />
              ) : (
                <div className="bg-white rounded-[20px] border border-[#152A32]/10 shadow-soft overflow-hidden">
                  {leaderboard.length === 0 ? (
                    <div className="p-6 text-center text-brand-dark/60 text-sm font-normal">Поки немає статистики.</div>
                  ) : (
                    <ul className="divide-y divide-[#152A32]/8">
                      {leaderboard.map((u, index) => {
                        const percent = u.total_answers > 0 ? Math.round((u.correct_answers / u.total_answers) * 100) : 0;
                        const isTop1 = index === 0;
                        const isTop2 = index === 1;
                        const isTop3 = index === 2;
                        
                        return (
                          <li 
                            key={index} 
                            style={{ animationDelay: `${index * 35}ms` }}
                            className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-[#152A32]/[0.02] transition-colors animate-fade-in"
                          >
                            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 pr-2">
                              {isTop1 ? (
                                <div className="w-7 h-7 flex items-center justify-center bg-brand-dark text-brand-cream rounded-full shrink-0 shadow-sm" title="1 місце">
                                  <Medal size={14} />
                                </div>
                              ) : isTop2 ? (
                                <div className="w-7 h-7 flex items-center justify-center bg-brand-sage text-brand-cream rounded-full shrink-0 shadow-sm" title="2 місце">
                                  <Medal size={14} />
                                </div>
                              ) : isTop3 ? (
                                <div className="w-7 h-7 flex items-center justify-center bg-brand-sage/25 text-brand-dark rounded-full shrink-0 shadow-sm" title="3 місце">
                                  <Medal size={14} />
                                </div>
                              ) : (
                                <div className="w-7 h-7 flex items-center justify-center bg-[#152A32]/6 text-brand-dark/70 rounded-full text-xs font-semibold shrink-0 border border-[#152A32]/10">
                                  {index + 1}
                                </div>
                              )}
                              
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-brand-dark truncate">{u.nickname}</p>
                                <p className="text-[11px] text-brand-dark/60 font-medium">Пройдено: {u.total_answers}</p>
                              </div>
                            </div>
                            
                            <div className="badge-pill bg-brand-sage/15 text-brand-dark border border-brand-sage/30 text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0">
                              {percent}%
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}

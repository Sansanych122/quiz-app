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
  Globe,
  Sparkles,
  ArrowRight
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
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'my' | 'public'

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
      // Спочатку переходимо на лендінг, щоб після очищення сесії не спрацьовував редирект на /auth
      navigate('/', { replace: true });
      await supabase.auth.signOut();
      addToast({ message: 'Ви вийшли з акаунту', type: 'info' });
    } catch (err) {
      console.error('Помилка при виході:', err);
    }
  };

  // Prefetch сторінки курсу при наведенні для миттєвого переходу
  const handleCourseHover = () => {
    import('./CoursePage');
  };

  const filteredCourses = courses.filter((c) => {
    if (activeFilter === 'my') return c.creator_id === user?.id;
    if (activeFilter === 'public') return c.is_public;
    return true;
  });

  const myCoursesCount = courses.filter((c) => c.creator_id === user?.id).length;
  const publicCoursesCount = courses.filter((c) => c.is_public).length;

  return (
    <div className="min-h-screen bg-brand-cream text-brand-dark flex flex-col font-sans selection:bg-brand-sage/20 selection:text-brand-dark">
      <SEO 
        title="Мої курси та тренажери — UniQuiz" 
        description="Особистий простір для проходження навчальних курсів, тестів та рейтингу студентів."
        canonical="https://uniquiz.pages.dev/dashboard"
        noindex={true}
      />

      {/* ШАПКА (Sticky з розмиттям фону) */}
      <header className="sticky top-0 z-40 w-full bg-brand-cream/85 backdrop-blur-md border-b border-[#152A32]/10 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="group flex items-center gap-2 focus:outline-none"
              aria-label="UniQuiz Дашборд"
            >
              <span className="text-2xl font-bold tracking-tight text-brand-dark group-hover:opacity-90 transition-opacity">
                Uni<span className="text-brand-sage">Quiz</span>
              </span>
            </button>
            <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#152A32]/6 text-[#152A32]/70 border border-[#152A32]/10">
              Кабінет студента
            </span>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Текстові посилання */}
            <a 
              href="https://t.me/smyk_oleksandr" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs sm:text-sm font-semibold text-brand-dark/70 hover:text-brand-dark transition-colors flex items-center gap-1.5 focus-visible:outline-none"
            >
              <Send size={15} className="text-brand-sage" />
              <span className="hidden sm:inline">Contact us</span>
            </a>
            
            <a 
              href="https://www.privat24.ua/send/jlhil" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs sm:text-sm font-semibold text-brand-dark/70 hover:text-brand-dark transition-colors flex items-center gap-1.5 focus-visible:outline-none"
            >
              <Coffee size={15} className="text-brand-sage" />
              <span className="hidden sm:inline">Donate</span>
            </a>
            
            {/* Вертикальний розділювач */}
            <div className="w-px h-5 bg-[#152A32]/10 hidden sm:block"></div>
            
            {/* Кнопка виходу */}
            <button 
              onClick={handleLogout} 
              className="h-9 px-3 sm:px-3.5 flex items-center gap-1.5 text-xs font-semibold text-brand-dark/70 hover:text-brand-terracotta hover:bg-brand-terracotta/10 rounded-full transition-colors border border-[#152A32]/12 focus-visible:outline-none" 
              title="Вийти на головну"
              aria-label="Вийти з акаунту"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Вийти</span>
            </button>
          </div>
        </div>
      </header>

      {/* ОСНОВНИЙ КОНТЕНТ */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-20">
        
        {/* ПРИВІТАННЯ */}
        <section className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-dark">
                {profile?.nickname ? `Привіт, ${profile.nickname}! 👋` : 'Привіт, Студенте! 👋'}
              </h1>
              <p className="text-xs sm:text-sm text-brand-dark/70 font-normal mt-0.5">
                Твій розумний простір для навчання з підтримкою AI
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="badge-pill bg-white text-brand-dark/80 border border-[#152A32]/10 text-xs font-medium shadow-xs">
                Всього курсів: <strong className="text-brand-dark ml-1">{courses.length}</strong>
              </span>
            </div>
          </div>
        </section>

        {/* СІТКА КОНТЕНТУ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* ЛІВА ЧАСТИНА (Курси) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* КНОПКА СТВОРЕННЯ КУРСУ */}
            <section>
              <div 
                onClick={() => navigate('/add-course')} 
                className="group relative bg-white p-6 sm:p-8 rounded-[22px] border border-[#152A32]/10 hover:border-brand-sage/40 shadow-soft hover:shadow-soft-hover transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 active:scale-[0.99]"
              >
                <div className="flex items-start sm:items-center gap-4 sm:gap-5">
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-brand-sage/15 text-brand-sage flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
                    <PlusCircle size={28} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-bold text-brand-dark group-hover:text-brand-sage transition-colors">
                        Створити розумний курс
                      </h2>
                      <span className="badge-pill bg-brand-sage/12 text-brand-sage border border-brand-sage/20 text-[10px] font-bold uppercase tracking-wide">
                        AI Ready
                      </span>
                    </div>
                    <p className="text-sm text-brand-dark/70 mt-1 font-normal leading-relaxed max-w-md">
                      Завантажте свій конспект чи лекцію, а наш AI автоматично згенерує з нього тести
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-[#152A32]/5 group-hover:bg-brand-sage group-hover:text-white transition-colors shrink-0">
                  <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </section>

            {/* СПИСОК КУРСІВ */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-brand-sage/15 text-brand-sage rounded-xl">
                    <BookOpen size={18} />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-brand-dark tracking-tight">Доступні курси</h2>
                </div>

                {/* Фільтр таби */}
                {courses.length > 0 && (
                  <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-[#152A32]/10 self-start sm:self-auto text-xs font-semibold">
                    <button
                      onClick={() => setActiveFilter('all')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        activeFilter === 'all'
                          ? 'bg-brand-dark text-brand-cream shadow-xs'
                          : 'text-brand-dark/70 hover:text-brand-dark'
                      }`}
                    >
                      Всі ({courses.length})
                    </button>
                    <button
                      onClick={() => setActiveFilter('my')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        activeFilter === 'my'
                          ? 'bg-brand-dark text-brand-cream shadow-xs'
                          : 'text-brand-dark/70 hover:text-brand-dark'
                      }`}
                    >
                      Мої ({myCoursesCount})
                    </button>
                    <button
                      onClick={() => setActiveFilter('public')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        activeFilter === 'public'
                          ? 'bg-brand-dark text-brand-cream shadow-xs'
                          : 'text-brand-dark/70 hover:text-brand-dark'
                      }`}
                    >
                      Публічні ({publicCoursesCount})
                    </button>
                  </div>
                )}
              </div>
              
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <CourseCardSkeleton />
                  <CourseCardSkeleton />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {filteredCourses.length === 0 ? (
                    <div className="col-span-full bg-white p-8 sm:p-10 rounded-[22px] border border-[#152A32]/10 text-center text-brand-dark/70 font-normal shadow-soft">
                      <div className="w-12 h-12 rounded-full bg-brand-sage/15 text-brand-sage flex items-center justify-center mx-auto mb-3">
                        <BookOpen size={22} />
                      </div>
                      <p className="font-semibold text-brand-dark text-base mb-1">
                        {activeFilter === 'all' 
                          ? 'Курсів поки немає' 
                          : activeFilter === 'my' 
                          ? 'У вас ще немає створених курсів' 
                          : 'Публічних курсів наразі немає'}
                      </p>
                      <p className="text-sm text-brand-dark/60 mb-5 max-w-sm mx-auto">
                        Створіть свій перший курс за допомогою файлу або скористайтеся AI-генератором!
                      </p>
                      <button
                        onClick={() => navigate('/add-course')}
                        className="btn-primary text-sm h-[44px]"
                      >
                        Створити перший курс
                      </button>
                    </div>
                  ) : (
                    filteredCourses.map((course) => (
                      <div 
                        key={course.id} 
                        onMouseEnter={handleCourseHover}
                        className="bg-white p-6 rounded-[22px] border border-[#152A32]/10 shadow-soft hover:shadow-soft-hover hover:-translate-y-0.5 transition-all duration-200 flex flex-col group justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            {course.creator_id === user.id ? (
                              <span className="badge-pill bg-[#152A32]/8 text-brand-dark border border-[#152A32]/10 text-[11px] font-semibold flex items-center gap-1">
                                <UserIcon size={12} /> Мій курс
                              </span>
                            ) : (
                              <span className="badge-pill bg-brand-sage/15 text-brand-dark border border-brand-sage/30 text-[11px] font-semibold flex items-center gap-1">
                                <Globe size={12} /> Публічний
                              </span>
                            )}

                            {course.created_at && (
                              <span className="text-[11px] text-brand-dark/45 font-medium">
                                {new Date(course.created_at).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                          </div>

                          <h3 className="font-bold text-lg text-brand-dark mb-2 leading-snug group-hover:text-brand-sage transition-colors">
                            {course.title}
                          </h3>
                          <p className="text-sm text-brand-dark/70 mb-5 line-clamp-2 leading-relaxed">
                            {course.description || 'Навчальний тестовий модуль для перевірки знань.'}
                          </p>
                        </div>
                        
                        <button 
                          onClick={() => navigate(`/course/${course.id}`)} 
                          className="w-full h-[44px] bg-transparent hover:bg-brand-dark text-brand-dark hover:text-brand-cream rounded-[12px] text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 border border-[#152A32]/15 hover:border-brand-dark active:scale-[0.98] group/btn"
                        >
                          <span>Відкрити курс</span>
                          <ChevronRight size={16} className="group-hover/btn:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </section>
          </div>

          {/* ПРАВА ЧАСТИНА (Рейтинг + віджети) */}
          <div className="lg:col-span-1 space-y-6">
            <section className="sticky top-24">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="p-2 bg-brand-sage/15 text-brand-sage rounded-xl">
                  <Trophy size={18} />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-brand-dark tracking-tight">Топ студентів</h2>
              </div>
              
              {loading ? (
                <LeaderboardSkeleton />
              ) : (
                <div className="bg-white rounded-[22px] border border-[#152A32]/10 shadow-soft overflow-hidden">
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
                                <div className="w-7 h-7 flex items-center justify-center bg-brand-dark text-brand-cream rounded-full shrink-0 shadow-xs" title="1 місце">
                                  <Medal size={14} />
                                </div>
                              ) : isTop2 ? (
                                <div className="w-7 h-7 flex items-center justify-center bg-brand-sage text-brand-cream rounded-full shrink-0 shadow-xs" title="2 місце">
                                  <Medal size={14} />
                                </div>
                              ) : isTop3 ? (
                                <div className="w-7 h-7 flex items-center justify-center bg-brand-sage/25 text-brand-dark rounded-full shrink-0 shadow-xs" title="3 місце">
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

              {/* Міні-віджет зв'язку */}
              <div className="mt-5 p-4 rounded-2xl bg-white/70 border border-[#152A32]/8 flex items-center justify-between text-xs font-medium text-brand-dark/70">
                <span>Маєте ідею чи запитання?</span>
                <a 
                  href="https://t.me/smyk_oleksandr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-brand-sage hover:underline"
                >
                  Написати в TG
                </a>
              </div>
            </section>
          </div>

        </div>
      </main>
    </div>
  );
}

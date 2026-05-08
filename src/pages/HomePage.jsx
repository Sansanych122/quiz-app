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
  Activity, 
  PlusCircle, 
  Medal,
  User as UserIcon,
  Globe
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Отримуємо профіль користувача
        const { data: profileData } = await supabase
          .from('profiles')
          .select('nickname')
          .eq('id', user.id)
          .single();
        if (profileData) setProfile(profileData);

        // 2. Отримуємо курси: Публічні АБО створені поточним користувачем
        const { data: coursesData } = await supabase
          .from('courses')
          .select('*')
          .or(`is_public.eq.true,creator_id.eq.${user.id}`)
          .order('created_at', { ascending: false });
        
        if (coursesData) setCourses(coursesData);

        // 3. Отримуємо топ-10 лідерів
        const { data: leaderboardData } = await supabase
          .from('profiles')
          .select('nickname, correct_answers, total_answers')
          .order('correct_answers', { ascending: false })
          .order('total_answers', { ascending: false })
          .limit(10);
        
        if (leaderboardData) setLeaderboard(leaderboardData);

      } catch (error) {
        console.error('Помилка завантаження даних:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="animate-pulse flex flex-col items-center gap-4 text-primary">
        <Activity size={32} className="animate-spin" />
        <span className="font-medium tracking-wide">Завантаження простору...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] relative overflow-hidden pb-16 font-sans">
      {/* Декоративні фонові елементи */}
      <div className="absolute top-[-5%] right-[-5%] w-[500px] h-[500px] bg-blue-400/10 rounded-full mix-blend-multiply filter blur-[80px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-400/10 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none"></div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 relative z-10">
        
        {/* ВЕРХНЯ ПАНЕЛЬ */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 bg-white/70 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] border border-white shadow-sm transition-all hover:shadow-md">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 mb-2">
              Привіт, {profile?.nickname || 'Студент'}! <span className="text-black inline-block animate-wave">👋</span>
            </h1>
            <p className="text-slate-500 font-medium">Твій особистий простір для ефективного навчання</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <a href="https://t.me/smyk_oleksandr" target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-full text-sm font-bold transition-all duration-300 shadow-sm hover:shadow-blue-200">
              <Send size={16} /> <span className="hidden sm:inline">Розробник</span>
            </a>
            <a href="https://send.monobank.ua/jlhil" target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-50 text-orange-500 hover:bg-orange-500 hover:text-white rounded-full text-sm font-bold transition-all duration-300 shadow-sm hover:shadow-orange-200">
              <Coffee size={16} /> <span className="hidden sm:inline">Підтримати</span>
            </a>
            <button onClick={handleLogout} className="p-3 text-slate-400 hover:text-white hover:bg-red-500 rounded-full transition-all duration-300 shadow-sm bg-white border border-slate-100" title="Вийти">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* СІТКА КОНТЕНТУ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ЛІВА ЧАСТИНА (Курси) */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* КНОПКА СТВОРЕННЯ */}
            <section>
              <div 
                onClick={() => navigate('/add-course')} 
                className="group relative overflow-hidden bg-gradient-to-br from-blue-50/50 to-indigo-50/50 p-8 rounded-[2rem] border-2 border-dashed border-blue-200 hover:border-blue-500 hover:bg-blue-50/80 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md"
              >
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 border border-blue-100">
                  <PlusCircle size={32} />
                </div>
                <h2 className="text-lg font-bold text-slate-800 group-hover:text-blue-700 transition-colors">Створити новий курс</h2>
                <p className="text-sm text-slate-500 mt-2 font-medium">Завантажте свій файл з тестами (.txt, .pdf, .docx)</p>
              </div>
            </section>

            {/* СПИСОК КУРСІВ */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                  <BookOpen size={20} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Доступні курси</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {courses.length === 0 ? (
                  <div className="col-span-full bg-white/60 backdrop-blur-md p-10 rounded-[2rem] border border-white text-center text-slate-500 font-medium shadow-sm">
                    Курсів поки немає. Створіть свій перший курс!
                  </div>
                ) : (
                  courses.map((course) => (
                    <div key={course.id} className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white/80 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col group relative overflow-hidden">
                      <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                      
                      <div className="relative z-10 flex-grow">
                        <div className="flex items-center gap-2 mb-3">
                          {course.creator_id === user.id ? (
                            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                              <UserIcon size={10} /> Мій курс
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                              <Globe size={10} /> Публічний
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-lg text-slate-800 mb-2 leading-tight group-hover:text-blue-600 transition-colors">{course.title}</h3>
                        <p className="text-sm text-slate-500 mb-6 line-clamp-2">{course.description}</p>
                      </div>
                      
                      <button onClick={() => navigate(`/course/${course.id}`)} className="relative z-10 w-full py-3 bg-slate-50 hover:bg-blue-600 text-slate-700 hover:text-white rounded-xl text-sm font-bold transition-colors duration-300 flex items-center justify-center gap-2 border border-slate-100 hover:border-blue-600">
                        Відкрити курс <ChevronRight size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* ПРАВА ЧАСТИНА (Рейтинг) */}
          <div className="lg:col-span-1">
            <section className="sticky top-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-yellow-100 text-yellow-600 rounded-xl">
                  <Trophy size={20} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Топ студентів</h2>
              </div>
              
              <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/80 shadow-lg overflow-hidden">
                {leaderboard.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm font-medium">Поки немає статистики.</div>
                ) : (
                  <ul className="divide-y divide-slate-100/80">
                    {leaderboard.map((u, index) => {
                      const percent = u.total_answers > 0 ? Math.round((u.correct_answers / u.total_answers) * 100) : 0;
                      const isTop1 = index === 0;
                      const isTop2 = index === 1;
                      const isTop3 = index === 2;
                      
                      return (
                        <li key={index} className={`p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors ${isTop1 ? 'bg-gradient-to-r from-yellow-50/50 to-transparent' : ''}`}>
                          <div className="flex items-center gap-4">
                            {isTop1 ? (
                               <div className="w-8 h-8 flex items-center justify-center bg-yellow-100 text-yellow-600 rounded-full shadow-sm border border-yellow-200"><Medal size={18} /></div>
                            ) : isTop2 ? (
                               <div className="w-8 h-8 flex items-center justify-center bg-slate-200 text-slate-600 rounded-full shadow-sm border border-slate-300"><Medal size={18} /></div>
                            ) : isTop3 ? (
                               <div className="w-8 h-8 flex items-center justify-center bg-orange-100 text-orange-600 rounded-full shadow-sm border border-orange-200"><Medal size={18} /></div>
                            ) : (
                               <div className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 rounded-full text-xs font-bold border border-slate-100">{index + 1}</div>
                            )}
                            
                            <div>
                              <p className={`text-sm ${isTop1 ? 'font-extrabold text-slate-900' : 'font-bold text-slate-700'}`}>{u.nickname}</p>
                              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Пройдено: {u.total_answers}</p>
                            </div>
                          </div>
                          
                          <div className={`px-3 py-1 rounded-lg text-xs font-extrabold border ${percent >= 70 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : percent >= 40 ? 'bg-yellow-50 text-yellow-600 border-yellow-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
                            {percent}%
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
          </div>

        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-15deg); }
          75% { transform: rotate(15deg); }
        }
        .animate-wave {
          animation: wave 2s infinite;
          transform-origin: 70% 70%;
        }
      `}} />
    </div>
  );
}
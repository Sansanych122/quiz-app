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
        const { data: profileData } = await supabase
          .from('profiles')
          .select('nickname')
          .eq('id', user.id)
          .single();
        if (profileData) setProfile(profileData);

        const { data: coursesData } = await supabase
          .from('courses')
          .select('*')
          .or(`is_public.eq.true,creator_id.eq.${user.id}`)
          .order('created_at', { ascending: false });
        
        if (coursesData) setCourses(coursesData);

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
      <div className="animate-pulse flex flex-col items-center gap-4 text-blue-500">
        <Activity size={32} className="animate-spin" />
        <span className="font-medium tracking-wide">Завантаження простору...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] relative overflow-hidden pb-16 font-sans">
      {/* Декоративні фонові елементи */}
      <div className="absolute top-[-5%] right-[-5%] w-[500px] h-[500px] bg-blue-400/10 rounded-full mix-blend-multiply filter blur-[80px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-400/10 rounded-full mix-blend-multiply filter blur-[100px] pointer-events-none"></div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 relative z-10">
        
        {/* ВЕРХНЯ ПАНЕЛЬ (Header) */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 bg-white/70 backdrop-blur-xl p-6 sm:p-8 rounded-[2rem] border border-white shadow-sm transition-all hover:shadow-md">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-800 mb-2">
              Uni<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">Quiz</span>
            </h1>
            <p className="text-slate-500 font-medium">
              Твій розумний простір для навчання з підтримкою AI
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-6 w-full sm:w-auto">
            {/* Текстові посилання з анімацією підкреслення */}
            <a href="https://t.me/smyk_oleksandr" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 relative group">
              <Send size={16} />
              <span>Contact us</span>
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
            </a>
            
            <a href="https://www.privat24.ua/send/jlhil" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-slate-500 hover:text-orange-500 transition-colors flex items-center gap-1.5 relative group">
              <Coffee size={16} />
              <span>Donate</span>
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
            </a>
            
            {/* Вертикальний розділювач */}
            <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>
            
            {/* Кнопка виходу */}
            <button onClick={handleLogout} className="p-2.5 text-slate-400 hover:text-red-500 bg-white hover:bg-red-50 rounded-full transition-all duration-300 border border-slate-100 shadow-sm" title="Вийти">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* СІТКА КОНТЕНТУ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ЛІВА ЧАСТИНА (Курси) */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* КНОПКА СТВОРЕННЯ (Оновлена під AI) */}
            <section>
              <div 
                onClick={() => navigate('/add-course')} 
                className="group relative overflow-hidden bg-white p-8 rounded-[2rem] border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-inner border border-blue-100/50">
                  <PlusCircle size={32} />
                </div>
                <h2 className="relative z-10 text-xl font-extrabold text-slate-800 group-hover:text-blue-600 transition-colors">Створити розумний курс</h2>
                <p className="relative z-10 text-sm text-slate-500 mt-2 font-medium max-w-sm mx-auto">Завантажте свій конспект чи лекцію, а наш AI автоматично згенерує з нього тести</p>
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
                    <div key={course.id} className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col group relative overflow-hidden">
                      <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full opacity-0 group-hover:opacity-50 group-hover:scale-150 transition-all duration-500"></div>
                      
                      <div className="relative z-10 flex-grow">
                        <div className="flex items-center gap-2 mb-4">
                          {course.creator_id === user.id ? (
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 border border-blue-100">
                              <UserIcon size={12} /> Мій курс
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 border border-emerald-100">
                              <Globe size={12} /> Публічний
                            </span>
                          )}
                        </div>
                        <h3 className="font-extrabold text-lg text-slate-800 mb-2 leading-tight group-hover:text-blue-600 transition-colors">{course.title}</h3>
                        <p className="text-sm text-slate-500 mb-6 line-clamp-2">{course.description}</p>
                      </div>
                      
                      <button onClick={() => navigate(`/course/${course.id}`)} className="relative z-10 w-full py-3 bg-slate-50 hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 text-slate-700 hover:text-white rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 border border-slate-200 hover:border-transparent group/btn">
                        Відкрити курс <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
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
              
              <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white shadow-lg overflow-hidden">
                {leaderboard.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm font-medium">Поки немає статистики.</div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {leaderboard.map((u, index) => {
                      const percent = u.total_answers > 0 ? Math.round((u.correct_answers / u.total_answers) * 100) : 0;
                      const isTop1 = index === 0;
                      const isTop2 = index === 1;
                      const isTop3 = index === 2;
                      
                      return (
                        <li key={index} className={`p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors ${isTop1 ? 'bg-gradient-to-r from-yellow-50/50 to-transparent' : ''}`}>
                          <div className="flex items-center gap-4">
                            {isTop1 ? (
                               <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-700 rounded-full shadow-sm border border-yellow-300"><Medal size={16} /></div>
                            ) : isTop2 ? (
                               <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 rounded-full shadow-sm border border-slate-300"><Medal size={16} /></div>
                            ) : isTop3 ? (
                               <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700 rounded-full shadow-sm border border-orange-300"><Medal size={16} /></div>
                            ) : (
                               <div className="w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 rounded-full text-xs font-bold border border-slate-200">{index + 1}</div>
                            )}
                            
                            <div>
                              <p className={`text-sm ${isTop1 ? 'font-extrabold text-slate-900' : 'font-bold text-slate-700'}`}>{u.nickname}</p>
                              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Пройдено: {u.total_answers}</p>
                            </div>
                          </div>
                          
                          <div className={`px-3 py-1 rounded-lg text-xs font-extrabold border ${percent >= 70 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : percent >= 40 ? 'bg-yellow-50 text-yellow-600 border-yellow-200' : 'bg-red-50 text-red-500 border-red-200'}`}>
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
    </div>
  );
}
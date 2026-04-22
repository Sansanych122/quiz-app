import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, BookOpen, Trophy, Send, Coffee, ChevronRight, Activity, FilePlus } from 'lucide-react';

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
          .eq('is_public', true)
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

    fetchData();
  }, [user.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4 text-primary">
          <Activity size={32} className="animate-spin" />
          <span className="font-medium">Завантаження даних...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-12">
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
      
      <div className="max-w-6xl mx-auto px-4 pt-8 relative z-10">
        
        <header className="flex justify-between items-center mb-10 bg-surface backdrop-blur-md p-4 rounded-2xl border border-white/40 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-textMain tracking-tight">
              Привіт, {profile?.nickname || 'Студент'}! 👋
            </h1>
            <p className="text-sm text-textMuted">Готовий до нових тестів?</p>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-textMuted hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="Вийти"
          >
            <LogOut size={20} />
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="text-primary" size={24} />
              <h2 className="text-xl font-semibold text-textMain">Доступні курси</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {courses.length === 0 ? (
                <div className="col-span-full glass-panel p-8 text-center text-textMuted">
                  Курсів поки немає.
                </div>
              ) : (
                courses.map((course) => (
                  <div key={course.id} className="glass-panel p-6 group hover:shadow-lg transition-all duration-300 flex flex-col">
                    <h3 className="font-semibold text-lg text-textMain mb-2 line-clamp-2">{course.title}</h3>
                    <p className="text-sm text-textMuted mb-6 flex-grow">{course.description}</p>
                    <button 
                      onClick={() => navigate(`/course/${course.id}`)}
                      className="w-full py-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      Відкрити тести <ChevronRight size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="text-yellow-500" size={24} />
              <h2 className="text-xl font-semibold text-textMain">Топ користувачів</h2>
            </div>
            
            <div className="glass-panel p-1">
              {leaderboard.length === 0 ? (
                <div className="p-6 text-center text-textMuted text-sm">Поки немає статистики.</div>
              ) : (
                <ul className="divide-y divide-gray-100/50">
                  {leaderboard.map((u, index) => {
                    const percent = u.total_answers > 0 
                      ? Math.round((u.correct_answers / u.total_answers) * 100) 
                      : 0;
                    
                    return (
                      <li key={index} className="p-4 flex items-center justify-between hover:bg-white/40 transition-colors first:rounded-t-xl last:rounded-b-xl">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-700' :
                            index === 1 ? 'bg-gray-200 text-gray-700' :
                            index === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium text-textMain text-sm">{u.nickname}</p>
                            <p className="text-xs text-textMuted">Пройдено: {u.total_answers}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">
                            {percent}%
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

        </div>

        <div className="mt-10 glass-panel p-6 sm:p-8 border border-primary/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full pointer-events-none"></div>
          
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8 relative z-10">
            
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <FilePlus size={28} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-textMain mb-1">Додати новий курс</h2>
                <p className="text-textMuted text-sm mb-3 max-w-md">
                  Незабаром ви зможете самостійно завантажувати власні файли з тестами у форматі <span className="font-mono bg-gray-100 px-1 rounded text-primary">.docs, .pdf, .txt</span>
                </p>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-lg border border-yellow-200 uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                  Функція в розробці
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto shrink-0">
              <a 
                href="https://t.me/smyk_oleksandr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white/60 hover:bg-white border border-gray-200 hover:border-blue-200 hover:shadow-md hover:scale-[1.02] transition-all duration-300 rounded-xl text-textMain font-medium text-sm sm:text-base"
              >
                <Send size={20} className="text-blue-500" /> Розробник
              </a>
              <a 
                href="https://www.privat24.ua/send/jlhil" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white/60 hover:bg-white border border-gray-200 hover:border-orange-200 hover:shadow-md hover:scale-[1.02] transition-all duration-300 rounded-xl text-textMain font-medium text-sm sm:text-base"
              >
                <Coffee size={20} className="text-orange-500" /> Підтримати проєкт
              </a>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
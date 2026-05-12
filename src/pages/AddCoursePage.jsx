import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, UploadCloud, FileText, CheckCircle, 
  AlertCircle, Loader2, Save, 
  Sparkles, BrainCircuit, FileUp, 
  Zap, Info, Lock, ChevronDown, Type, XCircle
} from 'lucide-react';

export default function AddCoursePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [mode, setStepMode] = useState('classic'); 
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [optionsCount, setOptionsCount] = useState("");
  const [useAIParser, setUseAIParser] = useState(false);

  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileChange = (e, type) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (type === 'test') setFile(selectedFile);
      setError(null);
    }
  };

  const handleParse = async () => {
    // Валідація назви перед парсингом
    if (!title.trim()) {
      setError("Будь ласка, введіть назву курсу перед тим, як розпочати парсинг.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!file) return setError("Будь ласка, оберіть файл із тестами.");
    if (useAIParser) return alert("AI Smart Parser буде доступний у наступному оновленні!");

    setIsParsing(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    if (optionsCount) formData.append('options_count', optionsCount);

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiUrl}/api/parse-file`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Помилка при парсингу файлу. Переконайтесь, що бекенд запущено.');
      const data = await response.json();
      
      if (!data.questions?.length) throw new Error('Не вдалося знайти тести. Спробуйте вказати кількість варіантів.');
      setParsedData(data.questions);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsParsing(false);
    }
  };

const handleSaveCourse = async () => {
    if (!title.trim()) return setError("Назва курсу не може бути порожньою.");
    if (!parsedData || parsedData.length === 0) return setError("Дані для збереження відсутні.");

    setIsSaving(true);
    setError(null);

    try {
      // 1. Створюємо курс (прибрали .single(), щоб уникнути помилок з масивами/RLS)
      const { data: courseData, error: cErr } = await supabase
        .from('courses')
        .insert({ 
          title, 
          creator_id: user.id, 
          is_public: false 
        })
        .select(); 

      if (cErr) throw cErr;

      // БРОНЕБІЙНИЙ ПОШУК ID (працює і з масивом, і з об'єктом)
      const insertedCourse = Array.isArray(courseData) ? courseData[0] : courseData;
      const courseId = insertedCourse?.id || insertedCourse?.course_id;

      if (!courseId) {
        console.error("Відповідь Supabase після створення курсу:", courseData);
        throw new Error("Курс створено, але база не повернула його ID. Зайдіть у Supabase -> Policies -> таблиця 'courses' і створіть політику 'Enable read access for all users' (SELECT).");
      }

      // 2. Створюємо автоматичний розділ для курсу
      const { data: sectionData, error: sErr } = await supabase
        .from('sections')
        .insert({ 
          course_id: courseId, // Тепер тут 100% є правильний ID
          title: "Основний модуль", 
          order_index: 1 
        })
        .select();

      if (sErr) throw sErr;

      const insertedSection = Array.isArray(sectionData) ? sectionData[0] : sectionData;
      const sectionId = insertedSection?.id || insertedSection?.section_id;

      if (!sectionId) {
        throw new Error("Розділ створено, але база не повернула його ID. Увімкніть політику SELECT для таблиці 'sections'.");
      }

      // 3. Готуємо масив питань для вставки
      const questionsToInsert = parsedData.map(q => ({
        section_id: sectionId,
        content: q.content,
        options: q.options,
        correct_answer: q.correct_answer
      }));

      // 4. Масове завантаження питань
      const { error: qErr } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (qErr) throw qErr;

      // Успіх - перенаправляємо на сторінку курсу
      navigate(`/course/${courseId}`);
    } catch (err) {
      console.error("Деталі помилки збереження:", err);
      setError("Помилка бази даних: " + err.message);
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Скасувати створення курсу? Всі незбережені дані будуть втрачені.')) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-12 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-xl transition-all active:scale-95 text-slate-500">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-base font-black text-slate-800 tracking-tight">Новий курс</h1>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-slate-500 text-[10px] font-bold border border-slate-200 uppercase">
            <Lock size={12} /> Приватний
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-6 relative z-10">
        
        {/* Назва курсу */}
        <div className="mb-6 group">
          <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-blue-500 transition-colors">
            <Type size={12} /> Назва курсу <span className="text-red-500 ml-1">*</span>
          </label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Напр. Офтальмологія (Залік)..."
            className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-3.5 text-lg font-bold text-slate-800 placeholder:text-slate-200 outline-none focus:border-blue-500 shadow-sm transition-all"
          />
        </div>

        {/* Таби режимів */}
        <div className="flex p-1 bg-slate-200/50 rounded-2xl mb-6 border border-slate-200/50 shadow-inner">
          <button 
            onClick={() => setStepMode('classic')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all ${mode === 'classic' ? 'bg-white text-blue-600 shadow-sm scale-[1.01]' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <FileText size={16} /> Класичний імпорт
          </button>
          <button 
            onClick={() => setStepMode('ai-gen')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all ${mode === 'ai-gen' ? 'bg-white text-purple-600 shadow-sm scale-[1.01]' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Sparkles size={16} fill="currentColor" /> AI Генерація
          </button>
        </div>

        <div className="space-y-6">
          {mode === 'classic' ? (
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <UploadCloud size={20} />
                  </div>
                  Завантаження файлу
                </h3>
                
                <button 
                  onClick={() => setUseAIParser(!useAIParser)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 transition-all ${useAIParser ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200'}`}
                >
                  <BrainCircuit size={14} />
                  <span className="text-[9px] font-black uppercase tracking-widest">AI Smart Mode</span>
                </button>
              </div>

              {/* Зона завантаження */}
              <label className="relative flex flex-col items-center justify-center w-full h-44 border-[2px] border-dashed border-slate-300 rounded-[2rem] hover:bg-blue-50/40 hover:border-blue-400 transition-all cursor-pointer group mb-6 overflow-hidden">
                {!file ? (
                  <div className="text-center px-6">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-300 group-hover:scale-110 group-hover:text-blue-500 group-hover:bg-white transition-all shadow-sm border border-slate-100">
                      <FileUp size={28} />
                    </div>
                    <p className="text-base font-bold text-slate-700">Перетягніть файл сюди</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">PDF, DOCX або TXT</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 text-white mb-3">
                      <FileText size={32} />
                    </div>
                    <span className="font-bold text-slate-800 text-center max-w-[250px] px-4 truncate text-sm">{file.name}</span>
                    <div className="mt-2 px-3 py-1 bg-blue-50 text-blue-600 text-[9px] font-black rounded-md uppercase">Файл завантажено</div>
                  </div>
                )}
                <input type="file" className="hidden" accept=".pdf,.docx,.doc,.txt" onChange={(e) => handleFileChange(e, 'test')} />
              </label>

              {/* Налаштування варіантів */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="relative group">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-2 group-focus-within:text-blue-500">Кількість варіантів</label>
                  <div className="relative">
                    <select 
                      value={optionsCount} onChange={(e) => setOptionsCount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none appearance-none cursor-pointer focus:bg-white focus:border-blue-500 transition-all pr-10"
                    >
                      <option value="">Авто-визначення</option>
                      {[2,3,4,5,6].map(v => <option key={v} value={v}>Рівно {v} варіантів</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-amber-50/50 rounded-xl border border-amber-100/80">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-amber-500"><Info size={16} /></div>
                  <p className="text-[10px] leading-tight text-amber-800 font-medium">Для складних файлів обов'язково вказуйте кількість варіантів.</p>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-xs font-bold animate-shake">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" /> 
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              <button 
                onClick={handleParse} disabled={!file || isParsing}
                className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 shadow-lg shadow-slate-200 uppercase"
              >
                {isParsing ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} fill="currentColor" />}
                {isParsing ? 'Триває обробка...' : 'Розпочати парсинг'}
              </button>
            </div>
          ) : (
            /* AI Stub */
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-purple-100 border border-slate-100 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity">
                <BrainCircuit size={180} />
              </div>
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3.5 bg-purple-600 text-white rounded-2xl shadow-md">
                  <Sparkles size={24} fill="currentColor" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">AI Generator</h3>
                  <div className="mt-1 inline-block px-2.5 py-0.5 bg-purple-50 text-purple-600 text-[9px] font-black rounded-md uppercase">Скоро у доступі</div>
                </div>
              </div>
              <div className="space-y-6">
                <label className="relative flex flex-col items-center justify-center w-full h-40 border-[2px] border-dashed border-purple-200 rounded-[2rem] bg-purple-50/20 cursor-not-allowed">
                    <FileUp size={28} className="text-purple-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-400">Генерація за лекцією</p>
                </label>
                <button disabled className="w-full py-4 bg-purple-50 text-purple-200 rounded-2xl font-black text-[11px] tracking-widest uppercase cursor-not-allowed">
                  Генерувати тести
                </button>
              </div>
            </div>
          )}

          {/* Результати парсингу */}
          {parsedData && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-100 border border-emerald-50 animate-in fade-in slide-in-from-bottom-8 duration-500">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-md">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800">Аналіз завершено</h3>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{parsedData.length} тестів готово</p>
                  </div>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-3 mb-6 pr-2 custom-scrollbar">
                {parsedData.slice(0, 10).map((q, idx) => (
                  <div key={idx} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-800 leading-snug mb-3">{idx+1}. {q.content}</p>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg w-fit border border-emerald-100/50">
                      <CheckCircle size={12} /> {q.correct_answer}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={handleSaveCourse} disabled={isSaving}
                  className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-[11px] tracking-widest shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 active:scale-95 uppercase"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                  {isSaving ? 'Збереження...' : 'Підтвердити та зберегти'}
                </button>
                <button 
                  onClick={handleCancel} disabled={isSaving}
                  className="flex-1 py-4 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl font-bold text-[11px] tracking-widest transition-all uppercase"
                >
                  <XCircle size={18} className="mr-2 inline" /> Скасувати
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }
        .animate-shake { animation: shake 0.3s ease-in-out infinite; animation-iteration-count: 2; }
      `}</style>
    </div>
  );
}
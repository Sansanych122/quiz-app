import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, UploadCloud, FileText, CheckCircle, 
  AlertCircle, Loader2, Save, 
  Sparkles, BrainCircuit, FileUp, 
  Zap, Info, Lock, ChevronDown, Type, XCircle, MessageSquare
} from 'lucide-react';

export default function AddCoursePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [mode, setStepMode] = useState('classic'); 
  const [title, setTitle] = useState('');
  
  // Стейт для класичного режиму
  const [file, setFile] = useState(null);
  const [optionsCount, setOptionsCount] = useState("");
  const [useAIParser, setUseAIParser] = useState(false);

  // Стейт для AI режиму
  const [aiFile, setAiFile] = useState(null);
  const [aiQuestionsCount, setAiQuestionsCount] = useState("5");
  const [aiPrompt, setAiPrompt] = useState('');

  // Загальний стейт результатів
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileChange = (e, type) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (type === 'classic') setFile(selectedFile);
      if (type === 'ai') setAiFile(selectedFile);
      setError(null);
    }
  };

  // Класичний парсинг регулярками
  const handleParse = async () => {
    if (!title.trim()) {
      setError("Будь ласка, введіть назву курсу перед тим, як розпочати парсинг.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!file) return setError("Будь ласка, оберіть файл із тестами.");
    if (useAIParser) return alert("AI Smart Mode у класичному парсері закритий, переходьте на сусідню вкладку AI Генерації!");

    setIsParsing(true);
    setError(null);
    setParsedData(null);

    const formData = new FormData();
    formData.append('file', file);
    if (optionsCount) formData.append('options_count', optionsCount);

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiUrl}/api/parse-file`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Помилка при класичному парсингу файлу.');
      const data = await response.json();
      
      if (!data.questions?.length) throw new Error('Не вдалося знайти тести автоматично.');
      setParsedData(data.questions);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsParsing(false);
    }
  };

  // ГЕНЕРАЦІЯ ТЕСТІВ ЧЕРЕЗ GEMINI API
  const handleAIGenerate = async () => {
    if (!title.trim()) {
      setError("Будь ласка, введіть назву курсу перед тим, як активувати генерацію ШІ.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!aiFile) return setError("Будь ласка, завантажте лекцію або конспект для штучного інтелекту.");

    setIsParsing(true);
    setError(null);
    setParsedData(null);

    const formData = new FormData();
    formData.append('file', aiFile);
    formData.append('questions_count', aiQuestionsCount);
    formData.append('ai_prompt', aiPrompt);

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiUrl}/api/generate-ai-tests`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Нейромережа втомилася або сталася помилка API.');
      }
      
      const data = await response.json();
      setParsedData(data.questions);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsParsing(false);
    }
  };

  // Пряме збереження в Supabase
  const handleSaveCourse = async () => {
    if (!title.trim()) return setError("Назва курсу не може бути порожньою.");
    if (!parsedData || parsedData.length === 0) return setError("Дані для збереження відсутні.");

    setIsSaving(true);
    setError(null);

    try {
      const { data: courseData, error: cErr } = await supabase
        .from('courses')
        .insert({ title, creator_id: user.id, is_public: false })
        .select(); 

      if (cErr) throw cErr;
      const insertedCourse = Array.isArray(courseData) ? courseData[0] : courseData;
      const courseId = insertedCourse?.id || insertedCourse?.course_id;

      if (!courseId) throw new Error("Курс створено, але база не повернула його ID. Перевірте RLS.");

      const { data: sectionData, error: sErr } = await supabase
        .from('sections')
        .insert({ course_id: courseId, title: "Основний модуль ШІ", order_index: 1 })
        .select();

      if (sErr) throw sErr;
      const insertedSection = Array.isArray(sectionData) ? sectionData[0] : sectionData;
      const sectionId = insertedSection?.id || insertedSection?.section_id;

      const questionsToInsert = parsedData.map(q => ({
        section_id: sectionId,
        content: q.content,
        options: q.options,
        correct_answer: q.correct_answer
      }));

      const { error: qErr } = await supabase.from('questions').insert(questionsToInsert);
      if (qErr) throw qErr;

      navigate(`/course/${courseId}`);
    } catch (err) {
      setError("Помилка бази даних: " + err.message);
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Скасувати створення курсу? Всі дані будуть втрачені.')) {
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
            placeholder="Напр. Внутрішня медицина (Екзамен)..."
            className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-3.5 text-lg font-bold text-slate-800 placeholder:text-slate-200 outline-none focus:border-blue-500 shadow-sm transition-all"
          />
        </div>

        {/* Таби перемикання режимів */}
        <div className="flex p-1 bg-slate-200/50 rounded-2xl mb-6 border border-slate-200/50 shadow-inner">
          <button 
            onClick={() => { setStepMode('classic'); setParsedData(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all ${mode === 'classic' ? 'bg-white text-blue-600 shadow-sm scale-[1.01]' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <FileText size={16} /> Класичний імпорт
          </button>
          <button 
            onClick={() => { setStepMode('ai-gen'); setParsedData(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all ${mode === 'ai-gen' ? 'bg-white text-purple-600 shadow-sm scale-[1.01]' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Sparkles size={16} fill="currentColor" /> AI Генерація
          </button>
        </div>

        <div className="space-y-6">
          {/* КЛАСИЧНИЙ РЕЖИМ */}
          {mode === 'classic' ? (
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <UploadCloud size={20} />
                  </div>
                  Завантаження готових тестів
                </h3>
              </div>

              <label className="relative flex flex-col items-center justify-center w-full h-44 border-[2px] border-dashed border-slate-300 rounded-[2rem] hover:bg-blue-50/40 hover:border-blue-400 transition-all cursor-pointer group mb-6">
                {!file ? (
                  <div className="text-center px-6">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-300 group-hover:scale-110 group-hover:text-blue-500 transition-all border border-slate-100">
                      <FileUp size={28} />
                    </div>
                    <p className="text-base font-bold text-slate-700">Перетягніть файл сюди</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">PDF, DOCX або TXT</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg text-white mb-3">
                      <FileText size={32} />
                    </div>
                    <span className="font-bold text-slate-800 text-center max-w-[250px] px-4 truncate text-sm">{file.name}</span>
                    <div className="mt-2 px-3 py-1 bg-blue-50 text-blue-600 text-[9px] font-black rounded-md uppercase">Файл готовий</div>
                  </div>
                )}
                <input type="file" className="hidden" accept=".pdf,.docx,.doc,.txt" onChange={(e) => handleFileChange(e, 'classic')} />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="relative group">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-2">Кількість варіантів</label>
                  <div className="relative">
                    <select 
                      value={optionsCount} onChange={(e) => setOptionsCount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none appearance-none cursor-pointer pr-10"
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
                  <div className="p-2 bg-white rounded-lg text-amber-500"><Info size={16} /></div>
                  <p className="text-[10px] leading-tight text-amber-800 font-medium">Для монолітних файлів без літер обов'язково обирайте кількість варіантів.</p>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-xs font-bold">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" /> 
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              <button 
                onClick={handleParse} disabled={!file || isParsing}
                className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 uppercase"
              >
                {isParsing ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} fill="currentColor" />}
                {isParsing ? 'Триває аналіз структури...' : 'Розпочати парсинг'}
              </button>
            </div>
          ) : (
            /* РЕЖИМ AI ГЕНЕРАЦІЇ З ЛЕКЦІЙ */
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-purple-100 border border-slate-100 animate-in fade-in duration-150">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-md">
                  <Sparkles size={22} fill="currentColor" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">AI Генератор тестів</h3>
                  <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">Робота на базі Google Gemini 1.5 Flash</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                {/* Зона завантаження лекції */}
                <label className="relative flex flex-col items-center justify-center w-full h-40 border-[2px] border-dashed border-purple-300 rounded-[2rem] hover:bg-purple-50/30 transition-all cursor-pointer group">
                  {!aiFile ? (
                    <div className="text-center px-6">
                      <div className="w-12 h-12 bg-purple-50 text-purple-400 rounded-xl flex items-center justify-center mx-auto mb-2 border border-purple-100">
                        <FileUp size={24} />
                      </div>
                      <p className="text-sm font-bold text-slate-700">Завантажте сюди матеріал лекції</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-0.5 uppercase">PDF, DOCX або TXT</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 bg-purple-600 text-white rounded-xl flex items-center justify-center shadow-lg mb-2">
                        <BrainCircuit size={28} />
                      </div>
                      <span className="font-bold text-slate-800 text-sm max-w-[250px] px-4 truncate">{aiFile.name}</span>
                      <div className="mt-1 px-2.5 py-0.5 bg-purple-100 text-purple-700 text-[9px] font-black rounded-md uppercase">Матеріал завантажено</div>
                    </div>
                  )}
                  <input type="file" className="hidden" accept=".pdf,.docx,.doc,.txt" onChange={(e) => handleFileChange(e, 'ai')} />
                </label>

                {/* Налаштування кількості питань та промпту */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative group">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Скільки питань створити?</label>
                    <div className="relative">
                      <select 
                        value={aiQuestionsCount} onChange={(e) => setAiQuestionsCount(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none appearance-none cursor-pointer pr-10"
                      >
                        {['10', '15', '20', '30', '50'].map(v => <option key={v} value={v}>{v} унікальних тестів</option>)}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown size={16} /></div>
                    </div>
                  </div>

                  <div className="md:col-span-2 relative group">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">
                      <div className="flex items-center gap-1"><MessageSquare size={12} /> Побажання або фокус для ШІ (Необов'язково)</div>
                    </label>
                    <input 
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Напр.: Зроби фокус на ускладненнях, ігноруй дозування ліків..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-purple-500 transition-all shadow-inner"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-xs font-bold">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" /> 
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              <button 
                onClick={handleAIGenerate} disabled={!aiFile || isParsing}
                className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-xs tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 uppercase shadow-lg shadow-purple-100"
              >
                {isParsing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} fill="currentColor" />}
                {isParsing ? 'Генерація тестів за допомогою ШІ (може зайняти до 15 сек)...' : 'Активувати ШІ Генерацію'}
              </button>
            </div>
          )}

          {/* КОМПАКТНЕ ПРЕВ'Ю РЕЗУЛЬТАТІВ */}
          {parsedData && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-100 border border-emerald-50 animate-in fade-in slide-in-from-bottom-8 duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-md">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800">Обробка завершена</h3>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{parsedData.length} тестів повністю готові до імпорту</p>
                  </div>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-3 mb-6 pr-2 custom-scrollbar">
                {parsedData.map((q, idx) => (
                  <div key={idx} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-800 leading-snug mb-3">{idx+1}. {q.content}</p>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 Jews-emerald-700 text-[10px] font-bold rounded-lg w-fit border border-emerald-100/50">
                      <CheckCircle size={12} /> {q.correct_answer}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={handleSaveCourse} disabled={isSaving}
                  className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-11px tracking-widest shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 active:scale-95 uppercase"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                  {isSaving ? 'Збереження в базу даних...' : 'Підтвердити та зберегти курс'}
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
      `}</style>
    </div>
  );
}
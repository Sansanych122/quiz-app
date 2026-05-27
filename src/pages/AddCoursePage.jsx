import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, UploadCloud, FileText, CheckCircle, 
  AlertCircle, Loader2, Save, 
  Sparkles, BrainCircuit, FileUp, 
  Info, ChevronDown, XCircle, MessageSquare, Settings2
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

  const handleParse = async () => {
    if (!title.trim()) {
      setError("Введіть назву курсу перед тим, як розпочати.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!file) return setError("Оберіть файл із тестами.");
    if (useAIParser) return alert("Перейдіть на вкладку AI Генерації для цього режиму.");

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

      if (!response.ok) throw new Error('Помилка при обробці файлу.');
      const data = await response.json();
      
      if (!data.questions?.length) throw new Error('Не вдалося знайти тести у файлі.');
      setParsedData(data.questions);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!title.trim()) {
      setError("Введіть назву курсу перед генерацією.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!aiFile) return setError("Завантажте матеріал для штучного інтелекту.");

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
        throw new Error(errorData.detail || 'Помилка генерації AI.');
      }
      
      const data = await response.json();
      setParsedData(data.questions);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveCourse = async () => {
    if (!title.trim()) return setError("Назва курсу не може бути порожньою.");
    if (!parsedData || parsedData.length === 0) return setError("Немає даних для збереження.");

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

      if (!courseId) throw new Error("Помилка створення курсу.");

      const { data: sectionData, error: sErr } = await supabase
        .from('sections')
        .insert({ course_id: courseId, title: mode === 'ai-gen' ? "Модуль AI" : "Основний модуль", order_index: 1 })
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
      setError(err.message);
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Скасувати створення курсу? Всі дані будуть втрачені.')) {
      navigate('/');
    }
  };

  const activeFile = mode === 'classic' ? file : aiFile;

  return (
    <div className="min-h-screen bg-slate-50 pb-16 font-sans">
      
      {/* Навігація */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')} 
              className="text-slate-400 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-semibold text-slate-800">Новий курс</h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 mt-8 space-y-8">
        
        {/* Головна картка налаштувань */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          
          {/* Назва курсу */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-700 mb-2">Назва курсу</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Наприклад: Внутрішня медицина, Бази даних..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
            />
          </div>

          {/* Перемикач режимів */}
          <div className="flex p-1 bg-slate-100/80 rounded-xl mb-8">
            <button 
              onClick={() => { setStepMode('classic'); setParsedData(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'classic' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <FileText size={16} /> Класичний імпорт
            </button>
            <button 
              onClick={() => { setStepMode('ai-gen'); setParsedData(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'ai-gen' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Sparkles size={16} /> Розумна генерація
            </button>
          </div>

          {/* Зона завантаження файлу */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {mode === 'classic' ? 'Файл з тестами' : 'Матеріал для аналізу (лекція, конспект)'}
            </label>
            <label className="relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer group">
              {!activeFile ? (
                <div className="text-center">
                  <div className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-slate-400 group-hover:text-slate-600 transition-colors shadow-sm">
                    <UploadCloud size={24} />
                  </div>
                  <p className="text-sm font-medium text-slate-600">Натисніть або перетягніть файл</p>
                  <p className="text-xs text-slate-400 mt-1">PDF, DOCX або TXT</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-slate-800 text-white rounded-xl flex items-center justify-center shadow-sm mb-3">
                    {mode === 'classic' ? <FileText size={24} /> : <BrainCircuit size={24} />}
                  </div>
                  <span className="font-medium text-slate-800 text-sm max-w-[250px] truncate">{activeFile.name}</span>
                  <span className="text-xs text-slate-500 mt-1">Натисніть, щоб змінити файл</span>
                </div>
              )}
              {/* key={mode} забезпечує перестворення інпуту при зміні режиму */}
              <input 
                key={mode}
                type="file" 
                className="hidden" 
                accept=".pdf,.docx,.doc,.txt" 
                onChange={(e) => handleFileChange(e, mode)} 
              />
            </label>
          </div>

          {/* Налаштування в залежності від режиму */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-800 mb-4 pb-2 border-b border-slate-100">
              <Settings2 size={16} className="text-slate-400" /> 
              Налаштування {mode === 'classic' ? 'парсингу' : 'генерації'}
            </div>
            
            {mode === 'classic' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Кількість варіантів</label>
                  <div className="relative">
                    <select 
                      value={optionsCount} onChange={(e) => setOptionsCount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none appearance-none focus:bg-white focus:border-slate-400 transition-colors"
                    >
                      <option value="">Авто-визначення</option>
                      {[2,3,4,5,6].map(v => <option key={v} value={v}>Рівно {v} варіантів</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Для монолітних файлів (де варіанти відповідей не марковані літерами) обов'язково вкажіть точну кількість варіантів.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Кількість питань</label>
                  <div className="relative">
                    <select 
                      value={aiQuestionsCount} onChange={(e) => setAiQuestionsCount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none appearance-none focus:bg-white focus:border-slate-400 transition-colors"
                    >
                      {['10', '15', '20', '30', '50', '75'].map(v => <option key={v} value={v}>{v} тестів</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Додаткові інструкції (опціонально)</label>
                  <div className="relative">
                    <MessageSquare size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Напр.: Сфокусуйся на класифікаціях..."
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Вивід помилок */}
          {error && (
            <div className="mb-6 p-4 bg-red-50/50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm">
              <AlertCircle size={18} className="shrink-0" /> 
              <span>{error}</span>
            </div>
          )}

          {/* Головна кнопка дії */}
          <button 
            onClick={mode === 'classic' ? handleParse : handleAIGenerate} 
            disabled={!activeFile || isParsing}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isParsing ? <Loader2 size={18} className="animate-spin" /> : mode === 'classic' ? <FileText size={18} /> : <Sparkles size={18} />}
            {isParsing ? 'Обробка документа...' : mode === 'classic' ? 'Обробити тести' : 'Згенерувати тести'}
          </button>
        </div>

        {/* ПРЕВ'Ю РЕЗУЛЬТАТІВ */}
        {parsedData && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <CheckCircle size={20} className="text-emerald-500" /> Успішно розпізнано
                </h3>
                <p className="text-sm text-slate-500 mt-1">Готово до імпорту: {parsedData.length} тестів</p>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3 mb-8 pr-2 custom-scrollbar">
              {parsedData.map((q, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-sm font-medium text-slate-800 leading-relaxed mb-3">{idx + 1}. {q.content}</p>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-slate-400 font-medium">Відповідь:</span>
                    <span className="text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded">{q.correct_answer}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handleSaveCourse} disabled={isSaving}
                className="flex-[2] py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                {isSaving ? 'Збереження...' : 'Зберегти курс'}
              </button>
              <button 
                onClick={handleCancel} disabled={isSaving}
                className="flex-1 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
              >
                <XCircle size={18} className="text-slate-400" /> Скасувати
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, UploadCloud, FileText, CheckCircle, 
  AlertCircle, Loader2, Save, 
  Sparkles, BrainCircuit, 
  Info, ChevronDown, XCircle, MessageSquare, Settings2,
  Check, FileUp, Sparkle
} from 'lucide-react';
import SEO from '../components/SEO';

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
      if (type === 'classic') {
        setFile(selectedFile);
      } else {
        setAiFile(selectedFile);
      }
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
    <div className="min-h-screen bg-brand-cream text-brand-dark pb-24 font-sans selection:bg-brand-sage/20 selection:text-brand-dark">
      <SEO 
        title="Створити курс — UniQuiz"
        description="Імпортуйте файл або доручіть генерацію інтерактивних тестів штучному інтелекту."
        canonical="https://uniquiz.pages.dev/add-course"
        noindex={true}
      />
      
      {/* Навігація */}
      <header className="bg-brand-cream/85 backdrop-blur-md border-b border-[#152A32]/10 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="h-9 px-3 flex items-center gap-1.5 text-xs font-semibold text-brand-dark/70 hover:text-brand-dark hover:bg-[#152A32]/5 rounded-full border border-[#152A32]/10 transition-colors focus-visible:outline-none"
              aria-label="Повернутися до кабінету"
            >
              <ArrowLeft size={16} />
              <span>До курсів</span>
            </button>
            <div className="w-px h-4 bg-[#152A32]/10 hidden sm:block"></div>
            <span className="hidden sm:inline-flex text-sm font-bold text-brand-dark">
              Конструктор курсів
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="badge-pill bg-brand-sage/15 text-brand-dark border border-brand-sage/30 text-xs font-semibold">
              Новий тренажер
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 mt-8 sm:mt-10 space-y-8">
        
        {/* Заголовок сторінки */}
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-dark">
            Створити навчальний курс
          </h1>
          <p className="text-xs sm:text-sm text-brand-dark/70 font-normal mt-1 leading-relaxed">
            Оберіть класичний імпорт з готового файлу або згенеруйте тести за допомогою AI з вашої лекції чи конспекту.
          </p>
        </div>

        {/* Головна картка налаштувань */}
        <div className="bg-white p-6 sm:p-9 rounded-[24px] border border-[#152A32]/10 shadow-soft">
          
          {/* Крок 1: Назва курсу */}
          <div className="mb-8">
            <label className="block text-xs sm:text-sm font-bold text-brand-dark mb-2">
              Назва курсу <span className="text-brand-terracotta">*</span>
            </label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Наприклад: Внутрішня медицина, Бази даних, Історія..."
              className="w-full bg-white border border-[#152A32]/15 rounded-[14px] px-4 py-3.5 text-sm font-medium text-brand-dark placeholder:text-brand-dark/40 focus:outline-none focus:border-brand-sage focus:ring-4 focus:ring-brand-sage/20 transition-all shadow-xs"
            />
          </div>

          {/* Крок 2: Вибір режиму створення */}
          <div className="mb-8">
            <label className="block text-xs sm:text-sm font-bold text-brand-dark mb-3">
              Спосіб створення тесту
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Картка 1: Класичний */}
              <button
                type="button"
                onClick={() => { setStepMode('classic'); setParsedData(null); }}
                className={`p-4 sm:p-5 rounded-[18px] border text-left transition-all relative flex flex-col justify-between ${
                  mode === 'classic'
                    ? 'border-brand-dark bg-brand-cream/50 ring-2 ring-brand-dark/10 shadow-soft'
                    : 'border-[#152A32]/12 bg-white hover:border-[#152A32]/30 hover:bg-brand-cream/20'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-sage/15 text-brand-sage flex items-center justify-center">
                    <FileText size={20} />
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    mode === 'classic' ? 'border-brand-dark bg-brand-dark text-white' : 'border-[#152A32]/20'
                  }`}>
                    {mode === 'classic' && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-brand-dark mb-1">
                    Класичний імпорт
                  </h3>
                  <p className="text-xs text-brand-dark/65 leading-relaxed">
                    Розпізнавання готових питань та відповідей з файлу
                  </p>
                </div>
              </button>

              {/* Картка 2: AI Генерація */}
              <button
                type="button"
                onClick={() => { setStepMode('ai-gen'); setParsedData(null); }}
                className={`p-4 sm:p-5 rounded-[18px] border text-left transition-all relative flex flex-col justify-between ${
                  mode === 'ai-gen'
                    ? 'border-brand-dark bg-brand-cream/50 ring-2 ring-brand-dark/10 shadow-soft'
                    : 'border-[#152A32]/12 bg-white hover:border-[#152A32]/30 hover:bg-brand-cream/20'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-sage/15 text-brand-sage flex items-center justify-center">
                    <Sparkles size={20} />
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    mode === 'ai-gen' ? 'border-brand-dark bg-brand-dark text-white' : 'border-[#152A32]/20'
                  }`}>
                    {mode === 'ai-gen' && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <h3 className="font-bold text-sm sm:text-base text-brand-dark">
                      Розумна генерація
                    </h3>
                    <span className="badge-pill bg-brand-sage/15 text-brand-sage text-[10px] font-bold px-1.5 py-0.2">
                      AI
                    </span>
                  </div>
                  <p className="text-xs text-brand-dark/65 leading-relaxed">
                    Штучний інтелект витягне факти та згенерує тести з конспекту
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Крок 3: Зона завантаження файлу */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs sm:text-sm font-bold text-brand-dark">
                {mode === 'classic' ? 'Файл з тестами' : 'Матеріал для аналізу (лекція, конспект)'}
              </label>
              <span className="text-[11px] font-semibold text-brand-dark/50">Формати: PDF, DOCX, TXT</span>
            </div>

            <label className="relative flex flex-col items-center justify-center w-full min-h-[160px] p-6 border-2 border-dashed border-[#152A32]/15 hover:border-brand-sage rounded-[20px] bg-brand-cream/30 hover:bg-brand-cream/60 transition-all cursor-pointer group">
              {!activeFile ? (
                <div className="text-center">
                  <div className="w-13 h-13 bg-white border border-[#152A32]/10 rounded-2xl flex items-center justify-center mx-auto mb-3 text-brand-sage shadow-xs group-hover:scale-105 transition-transform">
                    <UploadCloud size={26} />
                  </div>
                  <p className="text-sm font-bold text-brand-dark group-hover:text-brand-sage transition-colors">
                    Натисніть або перетягніть файл сюди
                  </p>
                  <p className="text-xs text-brand-dark/50 mt-1 font-medium">
                    Максимальний розмір: до 15 МБ
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <div className="w-13 h-13 bg-brand-dark text-brand-cream rounded-2xl flex items-center justify-center shadow-xs mb-3">
                    {mode === 'classic' ? <FileText size={24} /> : <BrainCircuit size={24} />}
                  </div>
                  <span className="font-bold text-brand-dark text-sm max-w-[280px] sm:max-w-md truncate">
                    {activeFile.name}
                  </span>
                  <span className="text-xs text-brand-sage font-semibold mt-1">
                    Файл обрано • Натисніть, щоб замінити
                  </span>
                </div>
              )}
              <input 
                key={mode}
                type="file" 
                className="hidden" 
                accept=".pdf,.docx,.doc,.txt" 
                onChange={(e) => handleFileChange(e, mode)} 
              />
            </label>
          </div>

          {/* Крок 4: Налаштування в залежності від режиму */}
          <div className="mb-8 p-5 rounded-[18px] bg-brand-cream-subtle border border-[#152A32]/10">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-dark mb-4 pb-2 border-b border-[#152A32]/10">
              <Settings2 size={15} className="text-brand-sage" /> 
              <span>Налаштування {mode === 'classic' ? 'парсингу' : 'генерації'}</span>
            </div>
            
            {mode === 'classic' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-bold text-brand-dark/75 mb-1.5">
                    Кількість варіантів відповідей
                  </label>
                  <div className="relative">
                    <select 
                      value={optionsCount} onChange={(e) => setOptionsCount(e.target.value)}
                      className="w-full bg-white border border-[#152A32]/15 rounded-[12px] px-3.5 py-2.5 text-sm font-semibold text-brand-dark outline-none appearance-none focus:border-brand-sage focus:ring-4 focus:ring-brand-sage/20 transition-all shadow-xs"
                    >
                      <option value="">Авто-визначення</option>
                      {[2,3,4,5,6].map(v => <option key={v} value={v}>Рівно {v} варіантів</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-dark/40 pointer-events-none" />
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-3 bg-white rounded-[12px] border border-[#152A32]/8 text-xs text-brand-dark/70 leading-relaxed">
                  <Info size={16} className="text-brand-sage shrink-0 mt-0.5" />
                  <span>Для файлів, де варіанти не марковані літерами (А, Б...), обов'язково оберіть точну кількість варіантів.</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brand-dark/75 mb-1.5">
                    Кількість питань
                  </label>
                  <div className="relative">
                    <select 
                      value={aiQuestionsCount} onChange={(e) => setAiQuestionsCount(e.target.value)}
                      className="w-full bg-white border border-[#152A32]/15 rounded-[12px] px-3.5 py-2.5 text-sm font-semibold text-brand-dark outline-none appearance-none focus:border-brand-sage focus:ring-4 focus:ring-brand-sage/20 transition-all shadow-xs"
                    >
                      {['10', '15', '20', '30', '50', '75'].map(v => <option key={v} value={v}>{v} тестів</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-dark/40 pointer-events-none" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-brand-dark/75 mb-1.5">
                    Додаткові інструкції AI (опціонально)
                  </label>
                  <div className="relative">
                    <MessageSquare size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark/40" />
                    <input 
                      type="text" 
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Напр.: Сфокусуйся на класифікаціях та діагностиці..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#152A32]/15 rounded-[12px] text-sm font-medium text-brand-dark placeholder:text-brand-dark/40 focus:outline-none focus:border-brand-sage focus:ring-4 focus:ring-brand-sage/20 transition-all shadow-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Вивід помилок */}
          {error && (
            <div className="mb-6 p-4 bg-brand-terracotta/10 border border-brand-terracotta/20 rounded-[14px] flex items-start gap-3 text-brand-terracotta text-sm font-medium animate-fade-in">
              <AlertCircle size={18} className="shrink-0 mt-0.5" /> 
              <span>{error}</span>
            </div>
          )}

          {/* Головна кнопка дії */}
          <button 
            onClick={mode === 'classic' ? handleParse : handleAIGenerate} 
            disabled={!activeFile || isParsing}
            className="w-full btn-primary h-[52px] text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-soft"
          >
            {isParsing ? <Loader2 size={19} className="animate-spin" /> : mode === 'classic' ? <FileUp size={19} /> : <Sparkles size={19} />}
            <span>{isParsing ? 'Обробка документа...' : mode === 'classic' ? 'Обробити тести' : 'Згенерувати тести'}</span>
          </button>
        </div>

        {/* ПРЕВ'Ю РЕЗУЛЬТАТІВ */}
        {parsedData && (
          <div className="bg-white p-6 sm:p-9 rounded-[24px] border border-[#152A32]/10 shadow-soft animate-fade-in">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#152A32]/10">
              <div>
                <h3 className="text-lg font-bold text-brand-dark flex items-center gap-2">
                  <CheckCircle size={22} className="text-brand-sage" /> 
                  <span>Успішно розпізнано</span>
                </h3>
                <p className="text-xs sm:text-sm text-brand-dark/70 mt-1">
                  Готово до збереження в базу: <strong>{parsedData.length}</strong> тестів
                </p>
              </div>
              <span className="badge-pill bg-brand-sage/15 text-brand-dark border border-brand-sage/30 text-xs font-semibold">
                Попередній перегляд
              </span>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3 mb-8 pr-2">
              {parsedData.map((q, idx) => (
                <div key={idx} className="p-4 bg-brand-cream/50 rounded-[16px] border border-[#152A32]/10 hover:border-[#152A32]/20 transition-colors">
                  <p className="text-sm font-bold text-brand-dark leading-relaxed mb-3">
                    {idx + 1}. {q.content}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-brand-dark/60 font-semibold">Правильна відповідь:</span>
                    <span className="badge-pill bg-brand-sage/15 text-brand-dark border border-brand-sage/30 px-2.5 py-0.5 rounded-md font-bold">
                      {q.correct_answer}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handleSaveCourse} disabled={isSaving}
                className="btn-accent flex-[2] h-[50px] text-base font-bold shadow-soft"
              >
                {isSaving ? <Loader2 size={19} className="animate-spin" /> : <Save size={19} />} 
                <span>{isSaving ? 'Збереження...' : 'Зберегти курс'}</span>
              </button>
              <button 
                onClick={handleCancel} disabled={isSaving}
                className="btn-secondary flex-1 h-[50px] text-sm font-semibold"
              >
                <XCircle size={18} className="text-brand-dark/50" /> 
                <span>Скасувати</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

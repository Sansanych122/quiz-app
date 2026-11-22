import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, UploadCloud, FileText, CheckCircle, 
  AlertCircle, Loader2, Save, 
  Sparkles, BrainCircuit, 
  Info, ChevronDown, XCircle, MessageSquare, Settings2, Ban
} from 'lucide-react';
import SEO from '../components/SEO';
import { useToast } from '../components/Toast';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL !== 'http://127.0.0.1:8000'
  ? import.meta.env.VITE_API_BASE_URL
  : 'https://uniquiz-server.onrender.com';

export default function AddCoursePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [mode, setStepMode] = useState('classic'); 
  const [title, setTitle] = useState('');
  const [titleTouched, setTitleTouched] = useState(false);
  
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
  const [parsingStage, setParsingStage] = useState(0);
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const abortControllerRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const validateFile = (selectedFile) => {
    if (!selectedFile) return 'Файл не обрано';

    if (selectedFile.size > MAX_FILE_SIZE) {
      return `Розмір файлу (${(selectedFile.size / (1024 * 1024)).toFixed(1)} МБ) перевищує ліміт 15 МБ.`;
    }

    const ext = '.' + selectedFile.name.split('.').pop().toLowerCase();
    const isExtAllowed = ALLOWED_EXTENSIONS.includes(ext);
    const isMimeAllowed = ALLOWED_MIME_TYPES.includes(selectedFile.type) || selectedFile.type === '';

    if (!isExtAllowed || !isMimeAllowed) {
      return 'Непідтримуваний тип файлу. Дозволені формати: PDF, DOCX, DOC, TXT.';
    }

    return null;
  };

  const handleFileChange = (e, type) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validationError = validateFile(selectedFile);
      if (validationError) {
        setError(validationError);
        addToast({ message: 'Помилка файлу', description: validationError, type: 'error' });
        e.target.value = '';
        return;
      }

      if (type === 'classic') {
        setFile(selectedFile);
      } else {
        setAiFile(selectedFile);
      }
      setError(null);
    }
  };

  const startProgressSimulation = (stagesCount) => {
    setParsingStage(1);
    let stage = 1;
    timerRef.current = setInterval(() => {
      stage++;
      if (stage <= stagesCount) {
        setParsingStage(stage);
      }
    }, 4500);
  };

  const stopProgressSimulation = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleCancelOperation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    stopProgressSimulation();
    setIsParsing(false);
    setError('Обробку було скасовано користувачем.');
    addToast({ message: 'Операцію скасовано', type: 'info' });
  };

  const handleParse = async () => {
    if (!title.trim()) {
      setTitleTouched(true);
      setError("Введіть назву курсу перед тим, як розпочати.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!file) return setError("Оберіть файл із тестами.");
    if (useAIParser) return alert("Перейдіть на вкладку AI Генерації для цього режиму.");

    const validationErr = validateFile(file);
    if (validationErr) return setError(validationErr);

    setIsParsing(true);
    setError(null);
    setParsedData(null);
    startProgressSimulation(3);

    abortControllerRef.current = new AbortController();

    try {
      // Отримуємо JWT сесію користувача для безпечної авторизації запиту
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Сесія закінчилася. Будь ласка, увійдіть знову.');
      }

      const formData = new FormData();
      formData.append('file', file);
      if (optionsCount) formData.append('options_count', optionsCount);

      const response = await fetch(`${API_BASE_URL}/parse`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Не вдалося розпізнати файл.');
      }

      const data = await response.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error("Не знайдено жодного питання. Спробуйте змінити налаштування варіантів.");
      }

      setParsedData(data.questions);
      addToast({ message: `Успішно розпізнано ${data.questions.length} питань!`, type: 'success' });
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Помилка зв\'язку з сервером обробки.');
        addToast({ message: 'Помилка парсингу', description: err.message, type: 'error' });
      }
    } finally {
      stopProgressSimulation();
      setIsParsing(false);
      abortControllerRef.current = null;
    }
  };

  const handleAIGenerate = async () => {
    if (!title.trim()) {
      setTitleTouched(true);
      setError("Введіть назву курсу перед тим, як розпочати.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!aiFile) return setError("Оберіть файл для генерації.");

    const validationErr = validateFile(aiFile);
    if (validationErr) return setError(validationErr);

    setIsParsing(true);
    setError(null);
    setParsedData(null);
    startProgressSimulation(4);

    abortControllerRef.current = new AbortController();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Сесія закінчилася. Будь ласка, увійдіть знову.');
      }

      const formData = new FormData();
      formData.append('file', aiFile);
      formData.append('count', aiQuestionsCount);
      if (aiPrompt.trim()) formData.append('prompt', aiPrompt.trim());

      const response = await fetch(`${API_BASE_URL}/generate-from-doc`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Помилка генерації через AI.');
      }

      const data = await response.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error("Штучний інтелект не зміг створити тести з цього файлу.");
      }

      setParsedData(data.questions);
      addToast({ message: `ШІ успішно згенерував ${data.questions.length} тестів!`, type: 'success' });
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Помилка генерації тестів.');
        addToast({ message: 'Помилка AI-генерації', description: err.message, type: 'error' });
      }
    } finally {
      stopProgressSimulation();
      setIsParsing(false);
      abortControllerRef.current = null;
    }
  };

  const handleSaveCourse = async () => {
    if (!parsedData || parsedData.length === 0) return;
    setIsSaving(true);
    setError(null);

    try {
      const { data: courseData, error: cErr } = await supabase
        .from('courses')
        .insert({ title: title.trim(), creator_id: user.id, is_public: false })
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

      addToast({ message: 'Курс збережено!', type: 'success' });
      navigate(`/course/${courseId}`);
    } catch (err) {
      setError(err.message || 'Не вдалося зберегти курс.');
      addToast({ message: 'Помилка збереження', description: err.message, type: 'error' });
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Скасувати створення курсу? Всі дані будуть втрачені.')) {
      navigate('/dashboard');
    }
  };

  const activeFile = mode === 'classic' ? file : aiFile;

  return (
    <div className="min-h-screen bg-brand-cream text-brand-dark pb-20 font-sans selection:bg-brand-sage/20 selection:text-brand-dark">
      <SEO 
        title="Створити розумний курс — UniQuiz"
        description="Імпортуйте файл або доручіть генерацію інтерактивних тестів штучному інтелекту."
        canonical="https://uniquiz.pages.dev/add-course"
        noindex={true}
      />
      
      {/* Навігація */}
      <div className="bg-brand-cream/95 backdrop-blur-md border-b border-[#152A32]/10 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="w-9 h-9 flex items-center justify-center text-brand-dark/70 hover:text-brand-dark hover:bg-[#152A32]/5 rounded-[10px] transition-colors focus-visible:outline-none"
              aria-label="Повернутися на головну"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-base font-bold text-brand-dark">Новий курс</h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 mt-8 space-y-8">
        
        {/* Головна картка налаштувань */}
        <div className="bg-white p-7 sm:p-9 rounded-[20px] border border-[#152A32]/10 shadow-soft">
          
          {/* Назва курсу */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-brand-dark mb-2">Назва курсу</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setTitleTouched(true)}
              placeholder="Наприклад: Внутрішня медицина, Бази даних..."
              className={`w-full bg-white border rounded-[12px] px-4 py-3 text-sm font-medium text-brand-dark placeholder:text-brand-dark/40 outline-none transition-all ${
                titleTouched && !title.trim()
                  ? 'border-brand-terracotta focus:ring-4 focus:ring-brand-terracotta/20'
                  : 'border-[#152A32]/15 focus:border-brand-sage focus:ring-4 focus:ring-brand-sage/20'
              }`}
            />
            {titleTouched && !title.trim() && (
              <p className="text-xs text-brand-terracotta mt-1.5 ml-1">Будь ласка, вкажіть назву курсу</p>
            )}
          </div>

          {/* Перемикач режимів */}
          <div className="flex p-1 bg-[#152A32]/5 rounded-[12px] mb-8 border border-[#152A32]/10">
            <button 
              onClick={() => { setStepMode('classic'); setParsedData(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-sm font-semibold transition-all ${
                mode === 'classic' 
                  ? 'bg-brand-dark text-brand-cream shadow-sm' 
                  : 'text-brand-dark/70 hover:text-brand-dark'
              }`}
            >
              <FileText size={16} /> Класичний імпорт
            </button>
            <button 
              onClick={() => { setStepMode('ai-gen'); setParsedData(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-sm font-semibold transition-all ${
                mode === 'ai-gen' 
                  ? 'bg-brand-dark text-brand-cream shadow-sm' 
                  : 'text-brand-dark/70 hover:text-brand-dark'
              }`}
            >
              <Sparkles size={16} /> Розумна генерація
            </button>
          </div>

          {/* Зона завантаження файлу */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-brand-dark">
                {mode === 'classic' ? 'Файл з тестами' : 'Матеріал для аналізу (лекція, конспект)'}
              </label>
              <span className="text-xs text-brand-dark/50">Ліміт: 15 МБ</span>
            </div>
            <label className="relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-[#152A32]/15 rounded-[16px] hover:bg-brand-cream/40 hover:border-brand-sage/50 transition-all cursor-pointer group">
              {!activeFile ? (
                <div className="text-center">
                  <div className="w-12 h-12 bg-white border border-[#152A32]/10 rounded-[12px] flex items-center justify-center mx-auto mb-3 text-brand-sage shadow-sm">
                    <UploadCloud size={24} />
                  </div>
                  <p className="text-sm font-semibold text-brand-dark">Натисніть або перетягніть файл</p>
                  <p className="text-xs text-brand-dark/50 mt-1">PDF, DOCX або TXT (до 15 МБ)</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-brand-dark text-brand-cream rounded-[12px] flex items-center justify-center shadow-sm mb-2.5">
                    {mode === 'classic' ? <FileText size={22} /> : <BrainCircuit size={22} />}
                  </div>
                  <span className="font-semibold text-brand-dark text-sm max-w-[250px] truncate">{activeFile.name}</span>
                  <span className="text-xs text-brand-dark/60 mt-0.5">
                    {(activeFile.size / (1024 * 1024)).toFixed(2)} МБ • Натисніть, щоб змінити
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

          {/* Налаштування в залежності від режиму */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm font-bold text-brand-dark mb-4 pb-2 border-b border-[#152A32]/10">
              <Settings2 size={16} className="text-brand-sage" /> 
              Налаштування {mode === 'classic' ? 'парсингу' : 'генерації'}
            </div>
            
            {mode === 'classic' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-dark/70 mb-1.5">Кількість варіантів</label>
                  <div className="relative">
                    <select 
                      value={optionsCount} onChange={(e) => setOptionsCount(e.target.value)}
                      className="w-full bg-white border border-[#152A32]/15 rounded-[12px] px-4 py-2.5 text-sm font-medium text-brand-dark outline-none appearance-none focus:border-brand-sage focus:ring-4 focus:ring-brand-sage/20 transition-all"
                    >
                      <option value="">Авто-визначення</option>
                      {[2,3,4,5,6].map(v => <option key={v} value={v}>Рівно {v} варіантів</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-dark/40 pointer-events-none" />
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-3.5 bg-brand-cream/70 rounded-[12px] border border-[#152A32]/10">
                  <Info size={16} className="text-brand-sage shrink-0 mt-0.5" />
                  <p className="text-xs text-brand-dark/70 leading-relaxed">
                    Для монолітних файлів (де варіанти відповідей не марковані літерами) обов'язково вкажіть точну кількість варіантів.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-dark/70 mb-1.5">Кількість питань</label>
                  <div className="relative">
                    <select 
                      value={aiQuestionsCount} onChange={(e) => setAiQuestionsCount(e.target.value)}
                      className="w-full bg-white border border-[#152A32]/15 rounded-[12px] px-4 py-2.5 text-sm font-medium text-brand-dark outline-none appearance-none focus:border-brand-sage focus:ring-4 focus:ring-brand-sage/20 transition-all"
                    >
                      {['5', '10', '15', '20', '30', '50'].map(v => <option key={v} value={v}>{v} тестів</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-dark/40 pointer-events-none" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-brand-dark/70 mb-1.5">Додаткові інструкції (опціонально)</label>
                  <div className="relative">
                    <MessageSquare size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark/40" />
                    <input 
                      type="text" 
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Напр.: Сфокусуйся на класифікаціях..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#152A32]/15 rounded-[12px] text-sm font-medium text-brand-dark placeholder:text-brand-dark/40 focus:outline-none focus:border-brand-sage focus:ring-4 focus:ring-brand-sage/20 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Вивід помилок */}
          {error && (
            <div role="alert" className="mb-6 p-3.5 bg-brand-terracotta/10 border border-brand-terracotta/20 rounded-[12px] flex items-start gap-2.5 text-brand-terracotta text-sm font-medium animate-fade-in">
              <AlertCircle size={18} className="shrink-0 mt-0.5" /> 
              <span>{error}</span>
            </div>
          )}

          {/* Покроковий стан прогресу під час операції */}
          {isParsing && (
            <div className="mb-6 p-5 bg-brand-cream rounded-[16px] border border-[#152A32]/10 space-y-4 animate-fade-in">
              <div className="flex justify-between items-center text-sm font-bold text-brand-dark">
                <span>
                  {mode === 'classic'
                    ? parsingStage === 1
                      ? '1/3 Завантаження документа на сервер...'
                      : parsingStage === 2
                      ? '2/3 Розпізнавання та вилучення тестів...'
                      : '3/3 Валідація питань та варіантів...'
                    : parsingStage === 1
                    ? '1/4 Перевірка та завантаження матеріалів...'
                    : parsingStage === 2
                    ? '2/4 Аналіз лекцій та ключових фактів...'
                    : parsingStage === 3
                    ? '3/4 AI-генерація запитань та дистракторів...'
                    : '4/4 Фінальна збірка тестового модуля...'}
                </span>
                <span className="text-xs text-brand-sage font-bold">Орієнтовно ~15-30 сек</span>
              </div>

              {/* Смуга покрокового прогресу */}
              <div className="w-full h-2 bg-[#152A32]/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-sage transition-all duration-500 rounded-full"
                  style={{ width: `${mode === 'classic' ? (parsingStage / 3) * 100 : (parsingStage / 4) * 100}%` }}
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleCancelOperation}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-terracotta hover:text-brand-terracotta-hover transition-colors"
                >
                  <Ban size={14} /> Скасувати операцію
                </button>
              </div>
            </div>
          )}

          {/* Головна кнопка дії */}
          <button 
            onClick={mode === 'classic' ? handleParse : handleAIGenerate} 
            disabled={!activeFile || isParsing}
            className="w-full btn-primary h-[50px] text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isParsing ? (
              <div className="flex items-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                <span>Обробка документа...</span>
              </div>
            ) : mode === 'classic' ? (
              <>
                <FileText size={18} />
                <span>Обробити тести</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Згенерувати тести</span>
              </>
            )}
          </button>
        </div>

        {/* ПРЕВ'Ю РЕЗУЛЬТАТІВ */}
        {parsedData && (
          <div className="bg-white p-7 sm:p-9 rounded-[20px] border border-[#152A32]/10 shadow-soft animate-fade-in">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#152A32]/10">
              <div>
                <h3 className="text-lg font-bold text-brand-dark flex items-center gap-2">
                  <CheckCircle size={20} className="text-brand-sage" /> Успішно розпізнано
                </h3>
                <p className="text-sm text-brand-dark/70 mt-1">Готово до імпорту: {parsedData.length} тестів</p>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3 mb-8 pr-2">
              {parsedData.map((q, idx) => (
                <div key={idx} className="p-4 bg-brand-cream/60 rounded-[14px] border border-[#152A32]/10">
                  <p className="text-sm font-semibold text-brand-dark leading-relaxed mb-3">{idx + 1}. {q.content}</p>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-brand-dark/60 font-medium">Відповідь:</span>
                    <span className="badge-pill bg-brand-sage/15 text-brand-dark border border-brand-sage/30 px-2.5 py-0.5 rounded-md font-semibold">{q.correct_answer}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handleSaveCourse} disabled={isSaving}
                className="btn-accent flex-[2] h-[48px] text-sm font-bold disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                {isSaving ? 'Збереження...' : 'Зберегти курс'}
              </button>
              <button 
                onClick={handleCancel} disabled={isSaving}
                className="btn-secondary flex-1 h-[48px] text-sm font-semibold"
              >
                <XCircle size={18} className="text-brand-dark/50" /> Скасувати
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

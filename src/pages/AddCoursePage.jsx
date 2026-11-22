import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, UploadCloud, FileText, CheckCircle, 
  AlertCircle, Loader2, Save, 
  Sparkles, BrainCircuit, 
  Info, ChevronDown, XCircle, MessageSquare, Settings2
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

  // ВИПРАВЛЕНО: тепер умова коректно розрізняє 'classic' та 'ai-gen'
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
    <div className="min-h-screen bg-brand-cream text-brand-dark pb-20 font-sans selection:bg-brand-sage/20 selection:text-brand-dark">
      <SEO 
        title="Створити курс — UniQuiz"
        description="Імпортуйте файл або доручіть генерацію інтерактивних тестів штучному інтелекту."
        canonical="https://uniquiz.pages.dev/add-course"
        noindex={true}
      />
      
      {/* Навігація */}
      <div className="bg-brand-cream/95 backdrop-blur-md border-b border-[#152A32]/10 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')} 
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
              placeholder="Наприклад: Внутрішня медицина, Бази даних..."
              className="w-full bg-white border border-[#152A32]/15 rounded-[12px] px-4 py-3 text-sm font-medium text-brand-dark placeholder:text-brand-dark/40 focus:outline-none focus:border-brand-sage focus:ring-4 focus:ring-brand-sage/20 transition-all"
            />
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
            <label className="block text-sm font-semibold text-brand-dark mb-2">
              {mode === 'classic' ? 'Файл з тестами' : 'Матеріал для аналізу (лекція, конспект)'}
            </label>
            <label className="relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-[#152A32]/15 rounded-[16px] hover:bg-brand-cream/40 hover:border-brand-sage/50 transition-all cursor-pointer group">
              {!activeFile ? (
                <div className="text-center">
                  <div className="w-12 h-12 bg-white border border-[#152A32]/10 rounded-[12px] flex items-center justify-center mx-auto mb-3 text-brand-sage shadow-sm">
                    <UploadCloud size={24} />
                  </div>
                  <p className="text-sm font-semibold text-brand-dark">Натисніть або перетягніть файл</p>
                  <p className="text-xs text-brand-dark/50 mt-1">PDF, DOCX або TXT</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-brand-dark text-brand-cream rounded-[12px] flex items-center justify-center shadow-sm mb-2.5">
                    {mode === 'classic' ? <FileText size={22} /> : <BrainCircuit size={22} />}
                  </div>
                  <span className="font-semibold text-brand-dark text-sm max-w-[250px] truncate">{activeFile.name}</span>
                  <span className="text-xs text-brand-dark/60 mt-1">Натисніть, щоб змінити файл</span>
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
                      {['10', '15', '20', '30', '50', '75'].map(v => <option key={v} value={v}>{v} тестів</option>)}
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
            <div className="mb-6 p-3.5 bg-brand-terracotta/10 border border-brand-terracotta/20 rounded-[12px] flex items-start gap-2.5 text-brand-terracotta text-sm font-medium animate-fade-in">
              <AlertCircle size={18} className="shrink-0 mt-0.5" /> 
              <span>{error}</span>
            </div>
          )}

          {/* Головна кнопка дії */}
          <button 
            onClick={mode === 'classic' ? handleParse : handleAIGenerate} 
            disabled={!activeFile || isParsing}
            className="w-full btn-primary h-[50px] text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isParsing ? <Loader2 size={18} className="animate-spin" /> : mode === 'classic' ? <FileText size={18} /> : <Sparkles size={18} />}
            {isParsing ? 'Обробка документа...' : mode === 'classic' ? 'Обробити тести' : 'Згенерувати тести'}
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
                className="btn-accent flex-[2] h-[48px] text-sm font-bold"
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

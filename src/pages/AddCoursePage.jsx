import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  UploadCloud, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Database, 
  AlertCircle,
  FileCode,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Якщо є змінна середовища - використовуємо її, якщо ні - падаємо на локальний сервер
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export default function AddCoursePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [step, setStep] = useState('form'); // 'form' | 'parsing' | 'result'
  const [courseName, setCourseName] = useState('');
  const [file, setFile] = useState(null);
  
  const [parseStatus, setParseStatus] = useState('Ініціалізація...');
  const [parseProgress, setParseProgress] = useState(0);
  
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleStartParsing = async (e) => {
    e.preventDefault();
    if (!courseName.trim() || !file) return;
    
    setStep('parsing');
    setParseProgress(15);
    setParseStatus('Підготовка файлу до відправки...');

    try {
      const formData = new FormData();
      formData.append('course_name', courseName);
      formData.append('file', file);

      setParseProgress(40);
      setParseStatus('Сервер аналізує структуру документа...');

      const response = await fetch(`${API_BASE_URL}/parse`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Помилка обробки файлу');
      }

      const data = await response.json();
      
      setParseProgress(100);
      setParseStatus('Обробка завершена успішно!');
      
      setParsedQuestions(data.questions);
      setTimeout(() => setStep('result'), 600); // Невелика затримка для ефекту завершення

    } catch (error) {
      alert(`Помилка: ${error.message}`);
      setStep('form');
    }
  };

  const handleConfirmSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const payload = {
        course_name: courseName,
        creator_id: user.id,
        questions: parsedQuestions
      };

      const response = await fetch(`${API_BASE_URL}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Помилка збереження');
      }

      navigate('/');
    } catch (error) {
      alert(`Помилка запису: ${error.message}`);
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans">
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-100/40 rounded-full blur-[100px] pointer-events-none"></div>
      
      {/* Navigation */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')} 
              className="p-2.5 hover:bg-slate-100 rounded-2xl transition-all text-slate-500 active:scale-95"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">Новий навчальний курс</h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full text-blue-600 text-xs font-bold border border-blue-100">
            <Sparkles size={14} /> AI Parser Active
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-10 relative z-10">
        
        {/* STEP 1: INITIAL FORM */}
        {step === 'form' && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-slate-800 mb-2">Завантажте матеріали</h2>
              <p className="text-slate-500 font-medium">Ми автоматично розпізнаємо питання та варіанти відповідей</p>
            </div>

            <form onSubmit={handleStartParsing} className="bg-white/90 backdrop-blur-sm p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-white space-y-8">
              <div className="space-y-2">
                <label className="text-sm font-extrabold text-slate-700 ml-1">Назва курсу</label>
                <input 
                  type="text" 
                  required
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="Наприклад: Тести з анатомії (Модуль 2)"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-800 font-medium placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-extrabold text-slate-700 ml-1">Документ з тестами</label>
                <div className="relative group overflow-hidden">
                  <input 
                    type="file" 
                    required
                    accept=".txt,.pdf,.docx"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  />
                  <div className={`
                    w-full h-52 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-all duration-300
                    ${file ? 'bg-blue-50/50 border-blue-400' : 'bg-slate-50 border-slate-200 group-hover:border-blue-400 group-hover:bg-slate-100/50'}
                  `}>
                    {!file ? (
                      <div className="text-center p-6">
                        <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-slate-400 group-hover:text-blue-500 group-hover:scale-110 transition-all duration-300">
                          <UploadCloud size={28} />
                        </div>
                        <p className="text-sm font-bold text-slate-700">Натисніть для вибору файлу</p>
                        <p className="text-xs text-slate-400 mt-2 font-medium">Підтримуються PDF, DOCX та TXT</p>
                      </div>
                    ) : (
                      <div className="text-center p-6 animate-in zoom-in-95">
                        <div className="w-14 h-14 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center mx-auto mb-4 text-white">
                          <FileCode size={28} />
                        </div>
                        <p className="text-sm font-bold text-blue-600 truncate max-w-[250px]">{file.name}</p>
                        <p className="text-[10px] uppercase tracking-widest text-blue-400 mt-1 font-black">Файл готовий</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold transition-all duration-300 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-3 group active:scale-[0.98]">
                <Database size={20} className="group-hover:rotate-12 transition-transform" /> 
                Розпочати обробку
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: PARSING LOADER */}
        {step === 'parsing' && (
          <div className="bg-white/80 backdrop-blur-xl p-12 rounded-[3rem] shadow-xl border border-white text-center flex flex-col items-center justify-center min-h-[400px] animate-in fade-in zoom-in-95">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-blue-400/20 blur-2xl rounded-full animate-pulse"></div>
              <Loader2 size={64} className="text-blue-600 animate-spin relative z-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Аналізуємо дані</h2>
            <p className="text-slate-500 font-medium mb-10 h-6 transition-all">{parseStatus}</p>
            
            <div className="w-full max-w-sm space-y-3">
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${parseProgress}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                <span className="text-sm font-black text-blue-600">{parseProgress}%</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: RESULT & REVIEW */}
        {step === 'result' && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="bg-white/90 backdrop-blur-xl p-10 rounded-[3rem] shadow-2xl shadow-slate-200 border border-white text-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-100">
                <CheckCircle2 size={40} className="text-emerald-500" />
              </div>
              
              <h2 className="text-2xl font-black text-slate-800 mb-2">Успішний парсинг!</h2>
              <p className="text-slate-500 font-medium mb-8">
                Ми знайшли та структурували наступну кількість питань:
              </p>

              <div className="relative inline-block mb-10">
                <div className="absolute inset-0 bg-blue-600 blur-2xl opacity-10 rounded-full"></div>
                <div className="relative bg-slate-50 border border-slate-100 px-10 py-6 rounded-[2rem] shadow-inner">
                  <span className="text-5xl font-black text-blue-600 tracking-tighter">
                    {parsedQuestions.length}
                  </span>
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Тестів знайдено</span>
                </div>
              </div>

              {parsedQuestions.length > 0 ? (
                <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl flex items-start gap-4 text-left mb-10">
                  <div className="p-2 bg-white rounded-xl shadow-sm shrink-0">
                    <AlertCircle size={20} className="text-amber-500" />
                  </div>
                  <p className="text-xs text-amber-700 leading-relaxed font-medium">
                    Будь ласка, переконайтеся, що кількість знайдених тестів відповідає дійсності. 
                    Якщо їх занадто мало, перевірте нумерацію у файлі (1., 2. ...) та спробуйте ще раз.
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-100 p-5 rounded-2xl flex items-center gap-4 text-left mb-10 text-red-600">
                   <XCircle size={24} />
                   <p className="text-sm font-bold">Жодного питання не знайдено. Перевірте формат файлу.</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleConfirmSave} 
                  disabled={parsedQuestions.length === 0 || isSaving}
                  className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Database size={20} />} 
                  {isSaving ? 'Зберігаємо...' : 'Підтвердити та зберегти'}
                </button>
                <button 
                  onClick={() => {
                    if(window.confirm('Скасувати? Всі дані парсингу будуть втрачені.')) navigate('/');
                  }} 
                  disabled={isSaving}
                  className="flex-1 py-4 bg-white border-2 border-slate-100 hover:bg-slate-50 text-slate-600 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <XCircle size={18} /> Скасувати
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
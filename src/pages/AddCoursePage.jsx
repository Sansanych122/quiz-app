import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UploadCloud, FileText, Loader2, CheckCircle2, XCircle, Database, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext'; // Додали для отримання ID юзера

// Адреса нашого локального Python-сервера
const API_BASE_URL = 'http://127.0.0.1:8000';

export default function AddCoursePage() {
  const navigate = useNavigate();
  const { user } = useAuth(); // Отримуємо поточного користувача
  
  // Стани сторінки: 'form' -> 'parsing' -> 'result'
  const [step, setStep] = useState('form');
  
  const [courseName, setCourseName] = useState('');
  const [file, setFile] = useState(null);
  
  const [parseStatus, setParseStatus] = useState('Ініціалізація...');
  const [parseProgress, setParseProgress] = useState(0);
  
  // Зберігаємо результати з бекенда
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // ЕТАП 1: ВІДПРАВКА НА /parse
  const handleStartParsing = async (e) => {
    e.preventDefault();
    if (!courseName.trim() || !file) return;
    
    setStep('parsing');
    setParseProgress(20);
    setParseStatus('Відправка файлу на сервер...');

    try {
      // Формуємо FormData для відправки файлу
      const formData = new FormData();
      formData.append('course_name', courseName);
      formData.append('file', file);

      setParseProgress(50);
      setParseStatus('Парсинг тексту та пошук питань...');

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
      setParseStatus('Готово!');
      
      // Зберігаємо всі питання в локальний стейт
      setParsedQuestions(data.questions);
      setStep('result');

    } catch (error) {
      alert(`Помилка: ${error.message}`);
      setStep('form'); // Повертаємо на форму у разі помилки
    }
  };

  // ЕТАП 2: ПІДТВЕРДЖЕННЯ І ВІДПРАВКА НА /save
  const handleConfirmSave = async () => {
    if (!user) {
      alert("Помилка авторизації. Спробуйте перезайти в акаунт.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        course_name: courseName,
        creator_id: user.id, // Передаємо ID автора
        questions: parsedQuestions
      };

      const response = await fetch(`${API_BASE_URL}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Помилка збереження в БД');
      }

      // Якщо все супер - вітаємо і кидаємо на головну!
      navigate('/');
      
    } catch (error) {
      alert(`Помилка запису: ${error.message}`);
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Ви впевнені, що хочете скасувати? Дані не будуть збережені.')) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Шапка */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-textMuted">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-base font-bold text-textMain">Додавання нового курсу</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-8">
        
        {/* КРОК 1: ФОРМА */}
        {step === 'form' && (
          <form onSubmit={handleStartParsing} className="glass-panel p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div>
              <label className="block text-sm font-bold text-textMain mb-2">Назва курсу</label>
              <input 
                type="text" 
                required
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="Наприклад: Хірургія 4 курс (Частина 1)"
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-textMain mb-2">Файл з тестами</label>
              <div className="relative w-full h-40 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 hover:border-primary transition-colors">
                <input 
                  type="file" 
                  required
                  accept=".txt"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {!file ? (
                  <div className="text-center">
                    <UploadCloud size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-textMain">Натисніть або перетягніть файл сюди</p>
                    <p className="text-xs text-textMuted mt-1">Поки підтримується тільки .txt</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <FileText size={32} className="mx-auto text-primary mb-2" />
                    <p className="text-sm font-bold text-primary">{file.name}</p>
                    <p className="text-xs text-textMuted mt-1">Готовий до обробки</p>
                  </div>
                )}
              </div>
            </div>

            <button type="submit" className="w-full py-3.5 bg-primary hover:bg-blue-600 text-white rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2">
              <Database size={18} /> Розпочати парсинг
            </button>
          </form>
        )}

        {/* КРОК 2: ПРОГРЕС ПАРСИНГУ */}
        {step === 'parsing' && (
          <div className="glass-panel p-10 text-center flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 size={48} className="text-primary animate-spin mb-6" />
            <h2 className="text-lg font-bold text-textMain mb-2">Обробка файлу...</h2>
            <p className="text-sm text-textMuted mb-8 h-5">{parseStatus}</p>
            
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${parseProgress}%` }}
              ></div>
            </div>
            <p className="text-xs font-bold text-primary mt-3">{parseProgress}%</p>
          </div>
        )}

        {/* КРОК 3: РЕЗУЛЬТАТ І ПІДТВЕРДЖЕННЯ */}
        {step === 'result' && (
          <div className="glass-panel p-8 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <CheckCircle2 size={32} className="text-emerald-600" />
            </div>
            
            <h2 className="text-xl font-bold text-textMain mb-2">Парсинг завершено!</h2>
            <p className="text-textMuted text-sm mb-6">
              Ми успішно знайшли та структурували тести з вашого файлу.
            </p>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-8 inline-block min-w-[200px] shadow-sm">
              <p className="text-xs text-textMuted uppercase tracking-wider mb-1">Знайдено тестів</p>
              <p className="text-4xl font-black text-primary">{parsedQuestions.length}</p>
            </div>

            {parsedQuestions.length === 0 ? (
               <p className="text-sm text-red-600 font-medium mb-6 bg-red-50 p-4 rounded-xl border border-red-100">
                 На жаль, ми не знайшли жодного питання. Перевірте, чи ваш файл відповідає правильному формату нумерації (1. , 2. ) та варіантів (А. , Б. ).
               </p>
            ) : (
               <p className="text-xs text-orange-600 font-medium mb-6 bg-orange-50 p-4 rounded-xl border border-orange-100 flex gap-2 text-left">
                 <AlertCircle size={16} className="shrink-0 mt-0.5" />
                 <span>Дані ще не збережені. Перевірте кількість знайдених тестів. Якщо цифра виглядає підозріло малою — скасуйте і перевірте форматування у файлі.</span>
               </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button 
                onClick={handleConfirmSave} 
                disabled={parsedQuestions.length === 0 || isSaving}
                className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} 
                {isSaving ? 'Збереження...' : 'Зберегти у базу'}
              </button>
              <button 
                onClick={handleCancel} 
                disabled={isSaving}
                className="flex-1 py-3.5 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-textMain rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <XCircle size={18} /> Скасувати
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
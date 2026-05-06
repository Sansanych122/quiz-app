import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UploadCloud, FileText, Loader2, CheckCircle2, XCircle, Database } from 'lucide-react';

export default function AddCoursePage() {
  const navigate = useNavigate();
  
  // Стани сторінки: 'form' -> 'parsing' -> 'result'
  const [step, setStep] = useState('form');
  
  const [courseName, setCourseName] = useState('');
  const [file, setFile] = useState(null);
  const [parseStatus, setParseStatus] = useState('Ініціалізація...');
  const [parseProgress, setParseProgress] = useState(0);
  const [parsedQuestionsCount, setParsedQuestionsCount] = useState(0);

  // Обробка вибору файлу
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Імітація відправки на Python-сервер
  const handleStartParsing = (e) => {
    e.preventDefault();
    if (!courseName.trim() || !file) return;
    
    setStep('parsing');
    setParseProgress(10);
    setParseStatus('Підключення до сервера парсингу...');

    // ІМІТАЦІЯ ПРОЦЕСУ (згодом тут буде fetch на FastAPI)
    setTimeout(() => { setParseProgress(30); setParseStatus('Зчитування тексту з файлу...'); }, 1500);
    setTimeout(() => { setParseProgress(60); setParseStatus('Пошук питань та варіантів відповідей за регулярними виразами...'); }, 3500);
    setTimeout(() => { setParseProgress(85); setParseStatus('Валідація знайдених тестів...'); }, 6000);
    setTimeout(() => { 
      setParseProgress(100); 
      setParseStatus('Готово!');
      setParsedQuestionsCount(Math.floor(Math.random() * 100) + 50); // Випадкове число від 50 до 150
      setStep('result');
    }, 7500);
  };

  // Підтвердження збереження
  const handleConfirmSave = async () => {
    // Згодом тут буде запит до Supabase для збереження курсу та питань
    alert(`Курс "${courseName}" з ${parsedQuestionsCount} тестами успішно збережено у базу!`);
    navigate('/');
  };

  // Скасування
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
          <form onSubmit={handleStartParsing} className="glass-panel p-6 space-y-6">
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
                  accept=".txt,.pdf,.docx"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {!file ? (
                  <div className="text-center">
                    <UploadCloud size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-textMain">Натисніть або перетягніть файл сюди</p>
                    <p className="text-xs text-textMuted mt-1">Підтримуються .txt, .pdf, .docx</p>
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
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${parseProgress}%` }}
              ></div>
            </div>
            <p className="text-xs font-bold text-primary mt-3">{parseProgress}%</p>
          </div>
        )}

        {/* КРОК 3: РЕЗУЛЬТАТ І ПІДТВЕРДЖЕННЯ */}
        {step === 'result' && (
          <div className="glass-panel p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-emerald-600" />
            </div>
            
            <h2 className="text-xl font-bold text-textMain mb-2">Парсинг завершено!</h2>
            <p className="text-textMuted text-sm mb-6">
              Ми успішно знайшли та структурували тести з вашого файлу.
            </p>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-8 inline-block min-w-[200px]">
              <p className="text-xs text-textMuted uppercase tracking-wider mb-1">Знайдено тестів</p>
              <p className="text-3xl font-black text-primary">{parsedQuestionsCount}</p>
            </div>

            <p className="text-xs text-orange-600 font-medium mb-6 bg-orange-50 p-3 rounded-lg border border-orange-100">
              ⚠️ Дані ще не збережені. Перевірте кількість знайдених тестів. Якщо цифра виглядає підозріло малою — скасуйте і перевірте форматування у файлі.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={handleConfirmSave} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2">
                <CheckCircle2 size={18} /> Зберегти у базу
              </button>
              <button onClick={handleCancel} className="flex-1 py-3 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-textMain rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                <XCircle size={18} /> Скасувати
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
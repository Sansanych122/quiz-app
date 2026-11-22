import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

if (!fs.existsSync(distDir)) {
  console.error('Dist directory does not exist. Run vite build first.');
  process.exit(1);
}

const template = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

const routes = [
  {
    path: 'privacy-policy',
    title: 'Політика конфіденційності — UniQuiz',
    description: 'Політика конфіденційності освітньої платформи UniQuiz: правила обробки та захисту персональних даних.',
    canonical: 'https://uniquiz.pages.dev/privacy-policy',
    content: `
      <div class="min-h-screen bg-[#FFFCEE] font-sans text-[#152A32]">
        <div class="max-w-3xl mx-auto px-6 py-12">
          <article class="bg-white p-8 sm:p-12 rounded-[20px] shadow-sm border border-[rgba(21,42,50,0.1)]">
            <h1 class="text-3xl font-bold tracking-tight mb-2 text-[#152A32]">Політика конфіденційності</h1>
            <p class="text-sm text-[rgba(21,42,50,0.6)] font-medium mb-8">Останнє оновлення: 2026</p>
            <section class="space-y-6 text-[rgba(21,42,50,0.8)]">
              <div>
                <h2 class="text-lg font-bold mb-2 text-[#152A32]">1. Збір інформації</h2>
                <p>Ми збираємо мінімально необхідну інформацію для функціонування сервісу UniQuiz.</p>
              </div>
              <div>
                <h2 class="text-lg font-bold mb-2 text-[#152A32]">2. Використання даних та AI</h2>
                <p>Завантажені вами матеріали використовуються виключно для генерації тестових завдань за допомогою AI.</p>
              </div>
              <div>
                <h2 class="text-lg font-bold mb-2 text-[#152A32]">3. Захист даних</h2>
                <p>Ми використовуємо сучасні методи шифрування та безпечні сервери для захисту ваших даних.</p>
              </div>
            </section>
          </article>
        </div>
      </div>
    `
  },
  {
    path: 'terms-of-service',
    title: 'Умови використання — UniQuiz',
    description: 'Умови використання сервісу UniQuiz: права та обов\'язки користувачів платформи.',
    canonical: 'https://uniquiz.pages.dev/terms-of-service',
    content: `
      <div class="min-h-screen bg-[#FFFCEE] font-sans text-[#152A32]">
        <div class="max-w-3xl mx-auto px-6 py-12">
          <article class="bg-white p-8 sm:p-12 rounded-[20px] shadow-sm border border-[rgba(21,42,50,0.1)]">
            <h1 class="text-3xl font-bold tracking-tight mb-2 text-[#152A32]">Умови використання</h1>
            <p class="text-sm text-[rgba(21,42,50,0.6)] font-medium mb-8">Останнє оновлення: 2026</p>
            <section class="space-y-6 text-[rgba(21,42,50,0.8)]">
              <div>
                <h2 class="text-lg font-bold mb-2 text-[#152A32]">1. Прийняття умов</h2>
                <p>Реєструючись на платформі UniQuiz, ви погоджуєтесь з цими умовами.</p>
              </div>
              <div>
                <h2 class="text-lg font-bold mb-2 text-[#152A32]">2. Контент користувача</h2>
                <p>Ви несете відповідальність за матеріали, які завантажуєте для генерації тестів.</p>
              </div>
              <div>
                <h2 class="text-lg font-bold mb-2 text-[#152A32]">3. Обліковий запис</h2>
                <p>Ви зобов'язані зберігати конфіденційність свого пароля.</p>
              </div>
            </section>
          </article>
        </div>
      </div>
    `
  },
  {
    path: 'auth',
    title: 'Вхід та реєстрація — UniQuiz',
    description: 'Увійдіть до особистого кабінету UniQuiz або створіть новий акаунт для розумного навчання з AI.',
    canonical: 'https://uniquiz.pages.dev/auth',
    content: `
      <div class="min-h-screen flex items-center justify-center p-6 bg-[#FFFCEE] text-[#152A32]">
        <div class="w-full max-w-md text-center">
          <h1 class="text-2xl font-bold text-[#152A32]">UniQuiz — Вхід та реєстрація</h1>
          <p class="text-sm text-[rgba(21,42,50,0.7)] mt-2">Завантаження форми авторизації...</p>
        </div>
      </div>
    `
  }
];

// 1. Генерація пререндерених публічних сторінок
for (const route of routes) {
  const targetDir = path.join(distDir, route.path);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  let html = template;
  html = html.replace(/<title>.*?<\/title>/, `<title>${route.title}</title>`);
  html = html.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${route.description}" />`);
  html = html.replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${route.canonical}" />`);
  html = html.replace('<div id="root"></div>', `<div id="root">${route.content}</div>`);

  fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf-8');
  console.log(`Pre-rendered route: /${route.path}`);
}

// 2. Створення 404.html для Cloudflare Pages SPA fallback
fs.writeFileSync(path.join(distDir, '404.html'), template, 'utf-8');
console.log('Generated Cloudflare Pages 404.html fallback.');

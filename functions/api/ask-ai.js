const GEMINI_MODEL = 'gemini-3.5-flash-lite';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_INSTRUCTION = `Ти — точний навчальний асистент платформи UniQuiz.
Твоє завдання — дуже коротко (2–4 речення) і зрозуміло пояснити студенту, чому зазначена правильна відповідь є правильною.
Правила:
1. Пиши простою, доступною українською мовою без зайвого вступу ("Звісно", "Ось пояснення" тощо) і без markdown-заголовків.
2. Не вигадуй факти, дати, цифри, визначення чи джерела, у яких не впевнений. Спирайся лише на перевірені наукові та навчальні факти.
3. Якщо студент обрав помилковий варіант (його передано окремо), одним коротким реченням поясни, чому він не підходить.
4. Якщо запитання сформульоване неточно або бракує контексту для однозначного висновку — чесно вкажи на це, замість того щоб додумувати.`;

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export async function onRequestPost(context) {
  const apiKey = context.env.GOOGLE_AI_API_KEY || context.env.GEMINI_API_KEY;

  if (!apiKey) {
    return jsonResponse(
      {
        error: 'Сервіс AI ще не налаштований: відсутній секретний ключ GOOGLE_AI_API_KEY у налаштуваннях Cloudflare Pages.',
        code: 'MISSING_API_KEY',
      },
      503
    );
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return jsonResponse(
      { error: 'Не вдалося прочитати дані запиту.', code: 'BAD_JSON' },
      400
    );
  }

  const question = typeof body?.question === 'string' ? body.question.trim() : '';
  const correctAnswer = typeof body?.correctAnswer === 'string' ? body.correctAnswer.trim() : '';
  const chosenAnswer = typeof body?.chosenAnswer === 'string' ? body.chosenAnswer.trim() : '';
  const options = Array.isArray(body?.options)
    ? body.options.filter((item) => typeof item === 'string').slice(0, 10)
    : [];

  if (!question || !correctAnswer) {
    return jsonResponse(
      { error: 'Бракує тексту питання або правильної відповіді для пояснення.', code: 'INVALID_INPUT' },
      400
    );
  }

  if (question.length > 2500 || correctAnswer.length > 1000) {
    return jsonResponse(
      { error: 'Текст питання перевищує допустимий ліміт символів.', code: 'INPUT_TOO_LONG' },
      400
    );
  }

  const optionsBlock = options.length > 0
    ? `Варіанти відповідей:\n${options.map((opt, idx) => `- ${String.fromCharCode(65 + idx)}) ${opt}`).join('\n')}`
    : null;

  const userPrompt = [
    `Питання: ${question}`,
    optionsBlock,
    `Правильна відповідь: ${correctAnswer}`,
    chosenAnswer && chosenAnswer !== correctAnswer
      ? `Обраний студентом неправильний варіант: ${chosenAnswer}`
      : null,
    'Поясни коротко і доступно, чому правильна відповідь є правильною.',
  ]
    .filter(Boolean)
    .join('\n\n');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const geminiRes = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 280,
          thinkingConfig: {
            thinkingLevel: 'MINIMAL',
          },
        },
      }),
    });

    if (!geminiRes.ok) {
      let upstreamCode = '';
      try {
        const errJson = await geminiRes.json();
        upstreamCode = errJson?.error?.status || errJson?.error?.message || '';
      } catch {
        // ігноруємо невалідний JSON помилки
      }

      if (geminiRes.status === 401 || geminiRes.status === 403) {
        return jsonResponse(
          {
            error: 'Помилка доступу до Google AI. Перевірте правильність ключа GOOGLE_AI_API_KEY у Cloudflare Pages.',
            code: 'AUTH_ERROR',
          },
          502
        );
      }

      if (geminiRes.status === 429) {
        return jsonResponse(
          {
            error: 'Забагато запитів до AI одночасно або вичерпано ліміт квоти. Спробуйте через кілька секунд.',
            code: 'RATE_LIMIT',
          },
          429
        );
      }

      if (geminiRes.status === 404 || geminiRes.status === 400) {
        return jsonResponse(
          {
            error: `Не вдалося виконати запит до моделі ${GEMINI_MODEL}. Перевірте доступність моделі для вашого ключа.`,
            code: 'MODEL_OR_REQUEST_ERROR',
            detail: upstreamCode ? undefined : undefined,
          },
          502
        );
      }

      return jsonResponse(
        {
          error: 'Сервер Google AI тимчасово перевантажений. Спробуйте повторити запит трохи згодом.',
          code: 'UPSTREAM_ERROR',
        },
        502
      );
    }

    const data = await geminiRes.json();
    const candidate = data?.candidates?.[0];

    if (candidate?.finishReason === 'SAFETY' || candidate?.finishReason === 'RECITATION') {
      return jsonResponse(
        {
          error: 'AI не зміг сформувати пояснення через обмеження політики безпеки для цього формулювання.',
          code: 'CONTENT_FILTERED',
        },
        422
      );
    }

    const parts = candidate?.content?.parts || [];
    const explanation = parts
      .filter((part) => !part.thought && typeof part.text === 'string')
      .map((part) => part.text)
      .join('')
      .trim();

    if (!explanation) {
      return jsonResponse(
        {
          error: 'AI повернув порожню відповідь. Спробуйте натиснути «Ask AI» ще раз.',
          code: 'EMPTY_RESPONSE',
        },
        502
      );
    }

    return jsonResponse({ explanation, model: GEMINI_MODEL }, 200);
  } catch (err) {
    if (err?.name === 'AbortError') {
      return jsonResponse(
        {
          error: 'AI відповідав занадто довго (таймаут 15 сек). Спробуйте повторити запит.',
          code: 'TIMEOUT',
        },
        504
      );
    }

    return jsonResponse(
      {
        error: 'Не вдалося встановити зв’язок із сервером Google AI.',
        code: 'NETWORK_ERROR',
      },
      502
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

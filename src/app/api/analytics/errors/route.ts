import { NextRequest, NextResponse } from 'next/server';

// POST /api/analytics/errors - трекинг ошибок
export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json();

    // Логируем ошибку
    console.error('[Client Error]', {
      message: errorData.message,
      stack: errorData.stack,
      url: errorData.url,
      userAgent: errorData.userAgent,
      timestamp: new Date(errorData.timestamp).toISOString(),
      errorInfo: errorData.errorInfo,
    });

    // В production отправляем в сервисы мониторинга ошибок
    if (process.env.NODE_ENV === 'production') {
      // Отправка в Sentry (если настроен)
      // await sendToSentry(errorData);
      // Отправка в собственную систему логирования
      // await sendToErrorLogging(errorData);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track error' },
      { status: 500 }
    );
  }
}

// Функция для отправки в Sentry
async function sendToSentry(errorData: any) {
  // Sentry обычно настраивается глобально,
  // но можно и вручную отправлять через API
  try {
    const sentryDsn = process.env.SENTRY_DSN;
    if (!sentryDsn) return;

    // Парсим DSN для получения ключей
    const dsnMatch = sentryDsn.match(/https:\/\/([^@]+)@([^\/]+)\/(.+)/);
    if (!dsnMatch) return;

    const [, key, host, projectId] = dsnMatch;

    await fetch(`https://${host}/api/${projectId}/store/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${key}, sentry_client=webapp/1.0.0`,
      },
      body: JSON.stringify({
        message: errorData.message,
        level: 'error',
        platform: 'javascript',
        sdk: { name: 'webapp', version: '1.0.0' },
        exception: {
          values: [
            {
              type: 'Error',
              value: errorData.message,
              stacktrace: {
                frames: parseStackTrace(errorData.stack),
              },
            },
          ],
        },
        extra: {
          url: errorData.url,
          userAgent: errorData.userAgent,
          errorInfo: errorData.errorInfo,
        },
        timestamp: errorData.timestamp / 1000,
      }),
    });
  } catch (error) {
    console.error('Failed to send to Sentry:', error);
  }
}

// Функция для парсинга stack trace
function parseStackTrace(stack: string) {
  if (!stack) return [];

  return stack
    .split('\n')
    .slice(1) // Убираем первую строку с сообщением
    .map((line) => {
      const match = line.match(/at (.+) \((.+):(\d+):(\d+)\)/);
      if (match) {
        const [, function_name, filename, lineno, colno] = match;
        return {
          function: function_name,
          filename,
          lineno: parseInt(lineno),
          colno: parseInt(colno),
        };
      }
      return { function: line.trim() };
    })
    .filter(Boolean);
}

// Функция для отправки в собственную систему логирования
async function sendToErrorLogging(errorData: any) {
  // Здесь можно реализовать отправку в вашу систему логирования
  // Например, в базу данных или внешний сервис
  console.log('Error logging:', errorData);
}

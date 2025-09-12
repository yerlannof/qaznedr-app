import { NextRequest, NextResponse } from 'next/server';

// POST /api/analytics/web-vitals - трекинг web vitals метрик
export async function POST(request: NextRequest) {
  try {
    const metrics = await request.json();

    // В production можно отправлять в аналитические сервисы
    if (process.env.NODE_ENV === 'production') {
      // Отправка в Google Analytics
      // await sendToGoogleAnalytics(metrics);

      // Отправка в собственную систему аналитики
      // await sendToCustomAnalytics(metrics);

      // Логирование критических метрик
      if (metrics.name === 'CLS' && metrics.value > 0.25) {
        console.warn('High CLS detected:', metrics);
      }

      if (metrics.name === 'FCP' && metrics.value > 3000) {
        console.warn('Slow FCP detected:', metrics);
      }

      if (metrics.name === 'LCP' && metrics.value > 4000) {
        console.warn('Slow LCP detected:', metrics);
      }
    }

    // В development логируем все метрики
    if (process.env.NODE_ENV === 'development') {
      console.log('[Web Vitals]', metrics);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking web vitals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track web vitals' },
      { status: 500 }
    );
  }
}

// Функция для отправки в Google Analytics (если нужно)
async function sendToGoogleAnalytics(metrics: any) {
  if (!process.env.GA_MEASUREMENT_ID) return;

  try {
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${process.env.GA_MEASUREMENT_ID}&api_secret=${process.env.GA_API_SECRET}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: metrics.id,
          events: [
            {
              name: 'web_vital',
              params: {
                metric_name: metrics.name,
                metric_value: metrics.value,
                metric_delta: metrics.delta,
                metric_id: metrics.id,
                page_location: metrics.url,
              },
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      console.error('Failed to send metrics to GA:', response.statusText);
    }
  } catch (error) {
    console.error('Error sending to GA:', error);
  }
}

// Функция для отправки в собственную систему аналитики
async function sendToCustomAnalytics(metrics: any) {
  // Здесь можно реализовать отправку в вашу систему аналитики
  // Например, в базу данных или внешний сервис
  console.log('Custom analytics:', metrics);
}

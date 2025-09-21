import { NextRequest, NextResponse } from 'next/server';

// POST /api/analytics/custom-metrics - трекинг кастомных метрик производительности
export async function POST(request: NextRequest) {
  try {
    const metric = await request.json();

    // В production логируем только критические метрики
    if (process.env.NODE_ENV === 'production') {
      // Логируем медленные ресурсы
      if (metric.name === 'Slow Resource' && metric.value > 2000) {
        console.warn('Very slow resource detected:', {
          name: metric.name,
          value: metric.value,
          metadata: metric.metadata,
          url: metric.url,
          timestamp: new Date(metric.timestamp).toISOString(),
        });
      }

      // Логируем длительные задачи
      if (metric.name === 'Long Task' && metric.value > 100) {
        console.warn('Long task detected:', {
          duration: metric.value,
          metadata: metric.metadata,
          url: metric.url,
          timestamp: new Date(metric.timestamp).toISOString(),
        });
      }

      // Логируем медленные DNS запросы
      if (metric.name === 'DNS Lookup' && metric.value > 200) {
        console.warn('Slow DNS lookup:', {
          duration: metric.value,
          url: metric.url,
          timestamp: new Date(metric.timestamp).toISOString(),
        });
      }
    }

    // В development логируем все метрики
    if (process.env.NODE_ENV === 'development') {
      console.log('[Custom Metric]', {
        name: metric.name,
        value: metric.value,
        metadata: metric.metadata,
        url: metric.url,
        timestamp: new Date(metric.timestamp).toISOString(),
      });
    }

    // Здесь можно добавить отправку в внешние сервисы мониторинга
    // await sendToMonitoringService(metric);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to track custom metric' },
      { status: 500 }
    );
  }
}

// Функция для отправки в сервис мониторинга (например, DataDog, New Relic)
async function sendToMonitoringService(metric: any) {
  // Пример интеграции с DataDog
  if (process.env.DATADOG_API_KEY) {
    try {
      await fetch('https://api.datadoghq.com/api/v1/series', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DD-API-KEY': process.env.DATADOG_API_KEY,
        },
        body: JSON.stringify({
          series: [
            {
              metric: `webapp.custom_metric.${metric.name.toLowerCase().replace(/\s+/g, '_')}`,
              points: [[Math.floor(metric.timestamp / 1000), metric.value]],
              tags: [
                `url:${metric.url}`,
                ...(metric.metadata
                  ? Object.entries(metric.metadata).map(([k, v]) => `${k}:${v}`)
                  : []),
              ],
            },
          ],
        }),
      });
    } catch (error) {}
  }
}

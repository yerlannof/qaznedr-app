#!/usr/bin/env node

// Прямая работа с Sentry API без MCP сервера
// Обходит требование OpenAI API ключа

const https = require('https');

const SENTRY_TOKEN =
  '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';
const ORG_SLUG = 'yerlans-company';
const PROJECT_SLUG = 'javascript-nextjs';

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: 'sentry.io',
      port: 443,
      path: `/api/0/${path}`,
      method: options.method || 'GET',
      headers: {
        Authorization: `Bearer ${SENTRY_TOKEN}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function listIssues(limit = 10) {
  console.log('🔍 Получение списка ошибок...');
  try {
    const issues = await makeRequest(
      `projects/${ORG_SLUG}/${PROJECT_SLUG}/issues/?limit=${limit}`
    );
    console.log('✅ Последние ошибки:');
    issues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue.title} (${issue.shortId})`);
      console.log(`   Первое появление: ${issue.firstSeen}`);
      console.log(`   Последнее: ${issue.lastSeen}`);
      console.log(`   Количество: ${issue.count}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

async function getProjectStats() {
  console.log('📊 Получение статистики проекта...');
  try {
    const project = await makeRequest(`projects/${ORG_SLUG}/${PROJECT_SLUG}/`);
    console.log('✅ Информация о проекте:');
    console.log(`   Название: ${project.name}`);
    console.log(`   Платформа: ${project.platform}`);
    console.log(`   Создан: ${project.dateCreated}`);
    console.log(`   Команда: ${project.team?.name || 'Не указана'}`);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

async function getOrganizationInfo() {
  console.log('🏢 Получение информации об организации...');
  try {
    const org = await makeRequest(`organizations/${ORG_SLUG}/`);
    console.log('✅ Информация об организации:');
    console.log(`   Название: ${org.name}`);
    console.log(`   Слаг: ${org.slug}`);
    console.log(`   Создана: ${org.dateCreated}`);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

// Главная функция
async function main() {
  const command = process.argv[2];

  console.log('🚀 Sentry API Helper (Обход MCP)');
  console.log('=================================');

  switch (command) {
    case 'issues':
      await listIssues(parseInt(process.argv[3]) || 10);
      break;
    case 'project':
      await getProjectStats();
      break;
    case 'org':
      await getOrganizationInfo();
      break;
    case 'all':
      await getOrganizationInfo();
      console.log('');
      await getProjectStats();
      console.log('');
      await listIssues(5);
      break;
    default:
      console.log('Использование:');
      console.log(
        '  node scripts/sentry-api.js issues [количество]  - Список ошибок'
      );
      console.log(
        '  node scripts/sentry-api.js project              - Информация о проекте'
      );
      console.log(
        '  node scripts/sentry-api.js org                  - Информация об организации'
      );
      console.log(
        '  node scripts/sentry-api.js all                  - Вся информация'
      );
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  makeRequest,
  listIssues,
  getProjectStats,
  getOrganizationInfo,
};

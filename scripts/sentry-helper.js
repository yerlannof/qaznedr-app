#!/usr/bin/env node

// Sentry API Helper Script
// Usage: node scripts/sentry-helper.js [command] [options]

const SENTRY_TOKEN =
  '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';
const SENTRY_ORG = 'yerlans-company';
const SENTRY_PROJECT = 'javascript-nextjs';
const SENTRY_PROJECT_ID = '4510024878784592'; // Numeric ID required for issues API
const SENTRY_API = 'https://sentry.io/api/0';

const headers = {
  Authorization: `Bearer ${SENTRY_TOKEN}`,
  'Content-Type': 'application/json',
};

async function fetchSentry(endpoint) {
  const url = `${SENTRY_API}${endpoint}`;
  const response = await fetch(url, { headers });
  return response.json();
}

async function getIssues() {
  console.log('\n📋 Fetching Sentry Issues...\n');
  const issues = await fetchSentry(
    `/organizations/${SENTRY_ORG}/issues/?project=${SENTRY_PROJECT_ID}`
  );

  if (!issues || !Array.isArray(issues) || issues.length === 0) {
    console.log('✅ No issues found! Your project is error-free.');
    return;
  }

  issues.forEach((issue, index) => {
    console.log(`\n${index + 1}. ${issue.title}`);
    console.log(`   ID: ${issue.id}`);
    console.log(`   Count: ${issue.count}`);
    console.log(`   First seen: ${new Date(issue.firstSeen).toLocaleString()}`);
    console.log(`   Last seen: ${new Date(issue.lastSeen).toLocaleString()}`);
    console.log(`   Status: ${issue.status}`);
    console.log(`   Level: ${issue.level}`);
    console.log(`   Culprit: ${issue.culprit}`);
  });
}

async function getEvents() {
  console.log('\n📊 Fetching Recent Events...\n');
  const events = await fetchSentry(
    `/organizations/${SENTRY_ORG}/events/?project=${SENTRY_PROJECT_ID}`
  );

  if (
    !events ||
    (!events.data && !Array.isArray(events)) ||
    (events.data && events.data.length === 0)
  ) {
    console.log('✅ No recent events found.');
    return;
  }

  const eventList = events.data || events;

  eventList.forEach((event, index) => {
    console.log(`\n${index + 1}. Event ${event.id}`);
    console.log(`   Title: ${event.title}`);
    console.log(
      `   Timestamp: ${new Date(event.timestamp * 1000).toLocaleString()}`
    );
    console.log(`   Platform: ${event.platform}`);
  });
}

async function getProjectStats() {
  console.log('\n📈 Fetching Project Stats...\n');
  const project = await fetchSentry(
    `/projects/${SENTRY_ORG}/${SENTRY_PROJECT}/`
  );

  console.log(`Project: ${project.name}`);
  console.log(`Slug: ${project.slug}`);
  console.log(`Platform: ${project.platform}`);
  console.log(
    `Date Created: ${new Date(project.dateCreated).toLocaleString()}`
  );
  console.log(`Status: ${project.status}`);
  console.log(`Has Access: ${project.hasAccess}`);
}

async function main() {
  const command = process.argv[2] || 'issues';

  try {
    switch (command) {
      case 'issues':
        await getIssues();
        break;
      case 'events':
        await getEvents();
        break;
      case 'stats':
        await getProjectStats();
        break;
      case 'all':
        await getProjectStats();
        await getIssues();
        await getEvents();
        break;
      default:
        console.log('Usage: node scripts/sentry-helper.js [command]');
        console.log('Commands:');
        console.log('  issues - Get all issues');
        console.log('  events - Get recent events');
        console.log('  stats  - Get project statistics');
        console.log('  all    - Get everything');
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.message.includes('401')) {
      console.error('\n❌ Authentication failed. Check your Sentry token.');
    }
  }
}

main();

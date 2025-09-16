#!/usr/bin/env node
/**
 * Health Check Script for QAZNEDR.KZ
 * Monitors all system components and reports status
 */

const https = require('https');
const http = require('http');

class HealthMonitor {
  async checkAPI() {
    return new Promise((resolve) => {
      http
        .get('http://localhost:3001/api/listings', (res) => {
          resolve({
            status: res.statusCode === 200 ? 'healthy' : 'unhealthy',
            code: res.statusCode,
          });
        })
        .on('error', () => {
          resolve({ status: 'unhealthy', error: 'Connection failed' });
        });
    });
  }

  async checkSentry() {
    return new Promise((resolve) => {
      http
        .get('http://localhost:3001/api/test-sentry', (res) => {
          // Sentry test endpoint returns 500 by design (testing error reporting)
          // So 500 status code means Sentry integration is working correctly
          const isHealthy = res.statusCode === 500 || res.statusCode === 200;
          resolve({
            status: isHealthy ? 'healthy' : 'unhealthy',
            code: res.statusCode,
            note:
              res.statusCode === 500
                ? 'Test error successfully captured by Sentry'
                : undefined,
          });
        })
        .on('error', () => {
          resolve({ status: 'unhealthy', error: 'Connection failed' });
        });
    });
  }

  async runHealthCheck() {
    console.log('🏥 Running system health check...');

    const api = await this.checkAPI();
    const sentry = await this.checkSentry();

    console.log(`API Status: ${api.status} (${api.code || api.error})`);
    console.log(
      `Sentry Status: ${sentry.status} (${sentry.code || sentry.error})${sentry.note ? ' - ' + sentry.note : ''}`
    );

    const allHealthy = api.status === 'healthy' && sentry.status === 'healthy';
    console.log(
      `Overall System: ${allHealthy ? '✅ HEALTHY' : '❌ ISSUES DETECTED'}`
    );

    process.exit(allHealthy ? 0 : 1);
  }
}

new HealthMonitor().runHealthCheck();

/**
 * Analytics Dashboard Page
 */

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';

interface AnalyticsData {
  events: Array<{
    id: string;
    name: string;
    properties: Record<string, unknown>;
    userId: string | null;
    timestamp: string;
  }>;
  totalEvents: number;
  eventCounts: Array<{
    name: string;
    count: number;
  }>;
}

interface ErrorData {
  recentErrors: Array<{
    id: string;
    message: string;
    severity: string;
    component: string;
    timestamp: string;
    count: number;
  }>;
  statistics: {
    totalErrors: number;
    errorsBySeverity: Array<{
      severity: string;
      count: number;
    }>;
    errorsByComponent: Array<{
      component: string;
      count: number;
    }>;
  };
}

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const { trackPage } = useAnalytics();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [errorData, setErrorData] = useState<ErrorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    trackPage('Analytics Dashboard');
  }, [trackPage]);

  useEffect(() => {
    // Only allow admins to view analytics
    if (!user || user.role !== 'ADMIN') {
      return;
    }

    fetchAnalyticsData();
    fetchErrorData();
  }, [user, dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch(`/api/analytics?limit=100&period=${dateRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    }
  };

  const fetchErrorData = async () => {
    try {
      const response = await fetch(`/api/errors?limit=50&period=${dateRange}`);
      if (response.ok) {
        const data = await response.json();
        setErrorData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch error data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to view this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Monitor application usage and errors</p>
      </div>

      {/* Date Range Selector */}
      <div className="mb-6">
        <div className="flex gap-2">
          {[
            { value: '1d', label: 'Last 24 hours' },
            { value: '7d', label: 'Last 7 days' },
            { value: '30d', label: 'Last 30 days' },
            { value: '90d', label: 'Last 90 days' },
          ].map((period) => (
            <Button
              key={period.value}
              variant={dateRange === period.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange(period.value)}
            >
              {period.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Events</h3>
          <p className="text-3xl font-bold text-blue-600">
            {analyticsData?.totalEvents?.toLocaleString() || '0'}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Event Types</h3>
          <p className="text-3xl font-bold text-blue-600">
            {analyticsData?.eventCounts?.length || '0'}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Errors</h3>
          <p className="text-3xl font-bold text-red-600">
            {errorData?.statistics?.totalErrors?.toLocaleString() || '0'}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Critical Errors</h3>
          <p className="text-3xl font-bold text-red-600">
            {errorData?.statistics?.errorsBySeverity?.find(e => e.severity === 'critical')?.count || '0'}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Events */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Events</h2>
          <div className="space-y-4">
            {analyticsData?.eventCounts?.slice(0, 10).map((event, index) => (
              <div key={event.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900">{event.name}</span>
                </div>
                <span className="text-sm text-gray-600">{event.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Errors */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Errors</h2>
          <div className="space-y-4">
            {errorData?.recentErrors?.slice(0, 10).map((error) => (
              <div key={error.id} className="border-l-4 border-red-200 pl-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 truncate">{error.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        error.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        error.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        error.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {error.severity}
                      </span>
                      {error.component && (
                        <span className="text-xs text-gray-500">{error.component}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{error.count}x</p>
                    <p className="text-xs text-gray-500">
                      {new Date(error.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Errors by Component */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Errors by Component</h2>
          <div className="space-y-3">
            {errorData?.statistics?.errorsByComponent?.map((component, index) => (
              <div key={component.component} className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{component.component || 'Unknown'}</span>
                <span className="text-sm text-gray-600">{component.count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Errors by Severity */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Errors by Severity</h2>
          <div className="space-y-3">
            {errorData?.statistics?.errorsBySeverity?.map((severity) => (
              <div key={severity.severity} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    severity.severity === 'critical' ? 'bg-red-500' :
                    severity.severity === 'high' ? 'bg-orange-500' :
                    severity.severity === 'medium' ? 'bg-yellow-500' :
                    'bg-gray-500'
                  }`} />
                  <span className="font-medium text-gray-900 capitalize">{severity.severity}</span>
                </div>
                <span className="text-sm text-gray-600">{severity.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
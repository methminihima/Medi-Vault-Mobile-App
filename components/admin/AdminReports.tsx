import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    ImageBackground,
    Platform,
    Text as RNText,
    ScrollView,
    Share,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
// @ts-ignore - react-native-chart-kit doesn't have TypeScript definitions
import { BarChart, LineChart, PieChart, ProgressChart } from 'react-native-chart-kit';
import { API_BASE_URL } from '../../src/config/constants';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 360;
const chartWidth = width - 40;

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: string;
}

type Period = 'today' | 'week' | 'month' | 'year';

type Trend = 'up' | 'down' | 'stable';

type ReportsAnalytics = {
  period: Period;
  range: { start: string; end: string };
  kpis: {
    totalPatients: number;
    totalStaff: number;
    totalAppointments: number;
    completionRate: number;
    cancelRate: number;
    inPeriod: {
      appointments: number;
      completed: number;
      cancelled: number;
      newPatients: number;
      newStaff: number;
    };
  };
  trends: {
    appointments: { labels: string[]; data: number[] };
  };
  distributions: {
    appointmentStatus: Record<string, number>;
  };
  cards: {
    patients: { trend: Trend; trendValue: string };
    staff: { trend: Trend; trendValue: string };
    appointments: { trend: Trend; trendValue: string };
    completionRate: { trend: Trend; trendValue: string };
  };
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    created_at: string;
  }>;
};

function safeNum(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function formatPercent(n: number): string {
  const v = Math.round(n * 10) / 10;
  return `${v}%`;
}

function formatTimeAgo(iso: string): string {
  const d = new Date(iso);
  const t = d.getTime();
  if (Number.isNaN(t)) return '';
  const deltaSec = Math.floor((Date.now() - t) / 1000);
  if (deltaSec < 60) return `${deltaSec}s ago`;
  const deltaMin = Math.floor(deltaSec / 60);
  if (deltaMin < 60) return `${deltaMin} mins ago`;
  const deltaHr = Math.floor(deltaMin / 60);
  if (deltaHr < 24) return `${deltaHr} hours ago`;
  const deltaDay = Math.floor(deltaHr / 24);
  return `${deltaDay} days ago`;
}

export default function AdminReports() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('month');
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<ReportsAnalytics | null>(null);

  const fetchAnalytics = useCallback(async (period: Period) => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/reports/analytics?period=${period}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      const rawText = await resp.text();
      const json = (() => {
        try {
          return rawText ? JSON.parse(rawText) : null;
        } catch {
          return null;
        }
      })();
      if (!resp.ok || !json?.success) {
        throw new Error(json?.message || `Failed to load reports (${resp.status})`);
      }
      setAnalytics(json.data as ReportsAnalytics);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e?.message || 'Failed to load reports');
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(selectedPeriod);
  }, [fetchAnalytics, selectedPeriod]);

  const reportCards: ReportCard[] = useMemo(() => {
    const totalPatients = safeNum(analytics?.kpis?.totalPatients);
    const totalStaff = safeNum(analytics?.kpis?.totalStaff);
    const totalAppointments = safeNum(analytics?.kpis?.totalAppointments);
    const completionRate = safeNum(analytics?.kpis?.completionRate);

    return [
      {
        id: 'patients',
        title: 'Total Patients',
        description: 'Registered patients',
        icon: 'account-group',
        color: '#10B981',
        value: String(totalPatients),
        trend: (analytics?.cards?.patients?.trend || 'stable') as Trend,
        trendValue: analytics?.cards?.patients?.trendValue || '0%',
      },
      {
        id: 'staff',
        title: 'Medical Staff',
        description: 'Doctors, pharmacists & lab techs',
        icon: 'doctor',
        color: '#3B82F6',
        value: String(totalStaff),
        trend: (analytics?.cards?.staff?.trend || 'stable') as Trend,
        trendValue: analytics?.cards?.staff?.trendValue || '0%',
      },
      {
        id: 'appointments',
        title: 'Total Appointments',
        description: 'All appointments in system',
        icon: 'calendar-check',
        color: '#8B5CF6',
        value: String(totalAppointments),
        trend: (analytics?.cards?.appointments?.trend || 'stable') as Trend,
        trendValue: analytics?.cards?.appointments?.trendValue || '0%',
      },
      {
        id: 'completion',
        title: 'Completion Rate',
        description: 'Completed / total (selected period)',
        icon: 'check-decagram',
        color: '#06B6D4',
        value: formatPercent(completionRate),
        trend: (analytics?.cards?.completionRate?.trend || 'stable') as Trend,
        trendValue: analytics?.cards?.completionRate?.trendValue || '0%',
      },
    ];
  }, [analytics]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return 'trending-up' as const;
      case 'down': return 'trending-down' as const;
      default: return 'remove' as const;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return '#10B981';
      case 'down': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const onExportCsv = useCallback(async () => {
    if (!analytics) return;
    const header = ['Metric', 'Value'];
    const rows = [
      ['Total Patients', String(analytics.kpis.totalPatients)],
      ['Medical Staff', String(analytics.kpis.totalStaff)],
      ['Total Appointments', String(analytics.kpis.totalAppointments)],
      ['Completion Rate', formatPercent(analytics.kpis.completionRate)],
      ['Cancel Rate', formatPercent(analytics.kpis.cancelRate)],
      ['Period', analytics.period],
      ['Range Start', analytics.range.start],
      ['Range End', analytics.range.end],
    ];

    const statusHeader = ['Appointment Status', 'Count'];
    const statusRows = Object.entries(analytics.distributions.appointmentStatus || {}).map(([k, v]) => [k, String(v)]);

    const toCsvLine = (cols: string[]) => cols.map((c) => `"${String(c ?? '').replace(/\"/g, '""')}"`).join(',');
    const csv = [
      toCsvLine(header),
      ...rows.map((r) => toCsvLine(r)),
      '',
      toCsvLine(statusHeader),
      ...statusRows.map((r) => toCsvLine(r)),
    ].join('\n');

    try {
      await Share.share({ title: 'Reports CSV', message: csv });
    } catch {
      // ignore
    }
  }, [analytics]);

  const onExportPdf = useCallback(async () => {
    if (!analytics) return;
    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; padding: 16px; }
            h1 { margin: 0 0 6px 0; }
            .muted { color: #6b7280; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            td, th { border: 1px solid #e5e7eb; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #f9fafb; }
          </style>
        </head>
        <body>
          <h1>Reports & Analytics</h1>
          <div class="muted">Period: ${analytics.period} (${analytics.range.start} → ${analytics.range.end})</div>
          <h2>Key Metrics</h2>
          <table>
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Total Patients</td><td>${analytics.kpis.totalPatients}</td></tr>
            <tr><td>Medical Staff</td><td>${analytics.kpis.totalStaff}</td></tr>
            <tr><td>Total Appointments</td><td>${analytics.kpis.totalAppointments}</td></tr>
            <tr><td>Completion Rate</td><td>${formatPercent(analytics.kpis.completionRate)}</td></tr>
            <tr><td>Cancel Rate</td><td>${formatPercent(analytics.kpis.cancelRate)}</td></tr>
          </table>
          <h2>Appointment Status (selected period)</h2>
          <table>
            <tr><th>Status</th><th>Count</th></tr>
            ${Object.entries(analytics.distributions.appointmentStatus || {})
              .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
              .join('')}
          </table>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) {
      console.error('PDF export error:', e);
      Alert.alert('Error', 'Failed to export PDF. Please try again.');
    }
  }, [analytics]);

  const onPressExport = useCallback(() => {
    Alert.alert('Export', 'Choose export format:', [
      { text: 'Export CSV', onPress: onExportCsv },
      { text: 'Export PDF', onPress: onExportPdf },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [onExportCsv, onExportPdf]);

  const lineLabels = analytics?.trends?.appointments?.labels?.length
    ? analytics.trends.appointments.labels
    : [''];
  const lineSeries = analytics?.trends?.appointments?.data?.length
    ? analytics.trends.appointments.data
    : [0];

  const statusOrder = ['pending', 'confirmed', 'completed', 'cancel_requested', 'cancelled'];
  const statusCounts = statusOrder.map((k) => safeNum(analytics?.distributions?.appointmentStatus?.[k]));
  const statusTotal = statusCounts.reduce((sum, n) => sum + n, 0);

  return (
    <ImageBackground
      source={require('../../assets/images/Background-image.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <RNText style={styles.headerTitle}>Reports & Analytics</RNText>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: '#1E4BA3' }]}
              onPress={() => fetchAnalytics(selectedPeriod)}
              disabled={loading}
            >
              <Ionicons name="refresh" size={18} color="#fff" />
              <RNText style={styles.exportButtonText}>Refresh</RNText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportButton} onPress={onPressExport}>
              <MaterialCommunityIcons name="download" size={20} color="#fff" />
              <RNText style={styles.exportButtonText}>Export</RNText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Period Selector */}
        <View style={styles.periodContainer}>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'today' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('today')}
          >
            <RNText style={[styles.periodText, selectedPeriod === 'today' && styles.periodTextActive]}>
              Today
            </RNText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('week')}
          >
            <RNText style={[styles.periodText, selectedPeriod === 'week' && styles.periodTextActive]}>
              Week
            </RNText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('month')}
          >
            <RNText style={[styles.periodText, selectedPeriod === 'month' && styles.periodTextActive]}>
              Month
            </RNText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'year' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('year')}
          >
            <RNText style={[styles.periodText, selectedPeriod === 'year' && styles.periodTextActive]}>
              Year
            </RNText>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={{ paddingVertical: 10, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#1E4BA3" />
          </View>
        ) : null}

        {/* Key Metrics Grid */}
        <View style={styles.section}>
          <RNText style={styles.sectionTitle}>Key Performance Indicators</RNText>
          <View style={styles.metricsGrid}>
            {reportCards.map((card) => (
              <View key={card.id} style={styles.metricCard}>
                <View style={[styles.metricIconContainer, { backgroundColor: `${card.color}15` }]}>
                  <MaterialCommunityIcons name={card.icon as any} size={24} color={card.color} />
                </View>
                <RNText style={styles.metricTitle}>{card.title}</RNText>
                <RNText style={styles.metricValue}>{card.value}</RNText>
                <View style={styles.metricTrend}>
                  <Ionicons name={getTrendIcon(card.trend)} size={16} color={getTrendColor(card.trend)} />
                  <RNText style={[styles.metricTrendText, { color: getTrendColor(card.trend) }]}>
                    {card.trendValue}
                  </RNText>
                </View>
                <RNText style={styles.metricDescription}>{card.description}</RNText>
              </View>
            ))}
          </View>
        </View>

        {/* Appointments Trend Chart */}
        <View style={styles.section}>
          <RNText style={styles.sectionTitle}>Appointments Trend</RNText>
          <View style={styles.chartCard}>
            <LineChart
              data={{
                labels: lineLabels,
                datasets: [
                  {
                    data: lineSeries
                  }
                ]
              }}
              width={chartWidth}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: '#007AFF'
                }
              }}
              bezier
              style={styles.chart}
            />
          </View>
        </View>

        {/* Appointments by Status Chart */}
        <View style={styles.section}>
          <RNText style={styles.sectionTitle}>Appointments by Status</RNText>
          <View style={styles.chartCard}>
            <BarChart
              data={{
                labels: ['Pending', 'Confirmed', 'Completed', 'Cancel Req', 'Cancelled'],
                datasets: [
                  {
                    data: statusCounts
                  }
                ]
              }}
              width={chartWidth}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(52, 199, 89, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16
                }
              }}
              style={styles.chart}
              showValuesOnTopOfBars
            />
          </View>
        </View>

        {/* Appointment Status Distribution Chart */}
        <View style={styles.section}>
          <RNText style={styles.sectionTitle}>Appointment Status Distribution</RNText>
          <View style={styles.chartCard}>
            <PieChart
              data={
                [
                  { key: 'pending', name: 'Pending', color: '#FF9500' },
                  { key: 'confirmed', name: 'Confirmed', color: '#34C759' },
                  { key: 'completed', name: 'Completed', color: '#007AFF' },
                  { key: 'cancel_requested', name: 'Cancel Req', color: '#F59E0B' },
                  { key: 'cancelled', name: 'Cancelled', color: '#FF3B30' },
                ]
                  .map((s) => ({
                    name: s.name,
                    population: safeNum(analytics?.distributions?.appointmentStatus?.[s.key]),
                    color: s.color,
                    legendFontColor: '#333',
                    legendFontSize: 12,
                  }))
                  .filter((d) => d.population > 0 || statusTotal === 0)
              }
              width={chartWidth}
              height={220}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        </View>

        {/* Completion & Cancellation Rates */}
        <View style={styles.section}>
          <RNText style={styles.sectionTitle}>Rates</RNText>
          <View style={styles.chartCard}>
            <ProgressChart
              data={{
                labels: ['Completion', 'Cancel'],
                data: [
                  Math.max(0, Math.min(1, safeNum(analytics?.kpis?.completionRate) / 100)),
                  Math.max(0, Math.min(1, safeNum(analytics?.kpis?.cancelRate) / 100)),
                ]
              }}
              width={chartWidth}
              height={220}
              strokeWidth={16}
              radius={32}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(88, 86, 214, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16
                }
              }}
              hideLegend={false}
              style={styles.chart}
            />
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <RNText style={styles.sectionTitle}>Recent Activity</RNText>
          <View style={styles.activityContainer}>
            {(analytics?.recentActivity || []).length ? (
              (analytics?.recentActivity || []).map((n) => {
                const isAppointment = /appointment/i.test(n.title) || /appointment/i.test(n.message);
                const icon = isAppointment ? 'calendar-check' : n.type === 'user' ? 'account-plus' : 'bell';
                const color = isAppointment ? '#3B82F6' : n.type === 'user' ? '#10B981' : '#8B5CF6';
                return (
                  <View key={n.id} style={styles.activityCard}>
                    <View style={[styles.activityIcon, { backgroundColor: `${color}15` }]}>
                      <MaterialCommunityIcons name={icon as any} size={20} color={color} />
                    </View>
                    <View style={styles.activityContent}>
                      <RNText style={styles.activityText}>{n.title}</RNText>
                      <RNText style={styles.activityTime}>{formatTimeAgo(n.created_at)}</RNText>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.activityCard}>
                <View style={[styles.activityIcon, { backgroundColor: '#6B728015' }]}>
                  <MaterialCommunityIcons name="bell" size={20} color="#6B7280" />
                </View>
                <View style={styles.activityContent}>
                  <RNText style={styles.activityText}>No recent activity</RNText>
                  <RNText style={styles.activityTime}>{analytics ? '—' : 'Load reports to see activity'}</RNText>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E4BA3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  periodContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#1E4BA315',
    borderWidth: 1,
    borderColor: '#1E4BA3',
  },
  periodText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  periodTextActive: {
    color: '#1E4BA3',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: isSmallScreen ? '100%' : '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  metricTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  metricTrendText: {
    fontSize: 13,
    fontWeight: '700',
  },
  metricDescription: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  departmentContainer: {
    gap: 12,
  },
  departmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  departmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  departmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  departmentInfo: {
    flex: 1,
  },
  departmentName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  departmentSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  departmentRevenue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  doctorsContainer: {
    gap: 12,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  doctorRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E4BA315',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  doctorRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E4BA3',
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E4BA315',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  doctorSpecialty: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  doctorStats: {
    flexDirection: 'row',
    gap: 12,
  },
  doctorStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  doctorStatText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  doctorRevenue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  activityContainer: {
    gap: 12,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
});


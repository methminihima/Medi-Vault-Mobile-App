import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Dimensions,
    ImageBackground,
    Platform,
    Text as RNText,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
// @ts-ignore - react-native-chart-kit doesn't have TypeScript definitions
import { BarChart, LineChart, PieChart, ProgressChart } from 'react-native-chart-kit';

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

export default function AdminReports() {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');

  const reportCards: ReportCard[] = [
    {
      id: '1',
      title: 'Total Revenue',
      description: 'Overall revenue generated',
      icon: 'cash-multiple',
      color: '#10B981',
      value: '$127,450',
      trend: 'up',
      trendValue: '+12.5%'
    },
    {
      id: '2',
      title: 'Total Appointments',
      description: 'Scheduled appointments',
      icon: 'calendar-check',
      color: '#3B82F6',
      value: '1,247',
      trend: 'up',
      trendValue: '+8.3%'
    },
    {
      id: '3',
      title: 'New Patients',
      description: 'Newly registered patients',
      icon: 'account-plus',
      color: '#8B5CF6',
      value: '342',
      trend: 'up',
      trendValue: '+15.2%'
    },
    {
      id: '4',
      title: 'Active Doctors',
      description: 'Currently active doctors',
      icon: 'doctor',
      color: '#06B6D4',
      value: '87',
      trend: 'stable',
      trendValue: '0%'
    },
    {
      id: '5',
      title: 'Prescriptions',
      description: 'Total prescriptions issued',
      icon: 'pill',
      color: '#EC4899',
      value: '2,156',
      trend: 'up',
      trendValue: '+6.7%'
    },
    {
      id: '6',
      title: 'Lab Tests',
      description: 'Laboratory tests conducted',
      icon: 'flask',
      color: '#F59E0B',
      value: '1,523',
      trend: 'down',
      trendValue: '-2.1%'
    },
    {
      id: '7',
      title: 'Patient Satisfaction',
      description: 'Average satisfaction rating',
      icon: 'heart',
      color: '#EF4444',
      value: '4.7/5.0',
      trend: 'up',
      trendValue: '+0.3'
    },
    {
      id: '8',
      title: 'System Uptime',
      description: 'Server availability',
      icon: 'server',
      color: '#10B981',
      value: '99.8%',
      trend: 'stable',
      trendValue: '0%'
    }
  ];

  const departmentStats = [
    { name: 'Cardiology', appointments: 245, revenue: '$36,750', color: '#EF4444' },
    { name: 'Neurology', appointments: 189, revenue: '$34,020', color: '#8B5CF6' },
    { name: 'Pediatrics', appointments: 312, revenue: '$37,440', color: '#EC4899' },
    { name: 'Orthopedics', appointments: 176, revenue: '$35,200', color: '#F59E0B' },
    { name: 'Dermatology', appointments: 134, revenue: '$17,420', color: '#10B981' },
  ];

  const topDoctors = [
    { name: 'Dr. Sarah Johnson', specialty: 'Cardiologist', patients: 342, rating: 4.8, revenue: '$51,300' },
    { name: 'Dr. Michael Chen', specialty: 'Neurologist', patients: 287, rating: 4.9, revenue: '$51,660' },
    { name: 'Dr. Emily Rodriguez', specialty: 'Pediatrician', patients: 456, rating: 4.7, revenue: '$54,720' },
    { name: 'Dr. James Wilson', specialty: 'Orthopedic', patients: 298, rating: 4.6, revenue: '$59,600' },
    { name: 'Dr. Jennifer Martinez', specialty: 'Gynecologist', patients: 389, rating: 4.8, revenue: '$54,460' },
  ];

  const recentActivity = [
    { type: 'appointment', text: '15 new appointments scheduled', time: '10 mins ago', icon: 'calendar-plus', color: '#3B82F6' },
    { type: 'patient', text: '8 new patient registrations', time: '25 mins ago', icon: 'account-plus', color: '#10B981' },
    { type: 'payment', text: '$12,450 revenue collected', time: '1 hour ago', icon: 'cash', color: '#F59E0B' },
    { type: 'prescription', text: '42 prescriptions issued', time: '2 hours ago', icon: 'pill', color: '#EC4899' },
    { type: 'lab', text: '28 lab tests completed', time: '3 hours ago', icon: 'flask', color: '#8B5CF6' },
  ];

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
          <TouchableOpacity style={styles.exportButton}>
            <MaterialCommunityIcons name="download" size={20} color="#fff" />
            <RNText style={styles.exportButtonText}>Export</RNText>
          </TouchableOpacity>
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

        {/* Revenue Trend Chart */}
        <View style={styles.section}>
          <RNText style={styles.sectionTitle}>Revenue Trend</RNText>
          <View style={styles.chartCard}>
            <LineChart
              data={{
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                  {
                    data: [45000, 52000, 48000, 65000, 58000, 72000]
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

        {/* Appointments by Department Chart */}
        <View style={styles.section}>
          <RNText style={styles.sectionTitle}>Appointments by Department</RNText>
          <View style={styles.chartCard}>
            <BarChart
              data={{
                labels: ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics'],
                datasets: [
                  {
                    data: [245, 189, 156, 203]
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

        {/* Patient Distribution Chart */}
        <View style={styles.section}>
          <RNText style={styles.sectionTitle}>Patient Distribution</RNText>
          <View style={styles.chartCard}>
            <PieChart
              data={[
                {
                  name: 'New Patients',
                  population: 450,
                  color: '#007AFF',
                  legendFontColor: '#333',
                  legendFontSize: 12
                },
                {
                  name: 'Follow-up',
                  population: 680,
                  color: '#34C759',
                  legendFontColor: '#333',
                  legendFontSize: 12
                },
                {
                  name: 'Emergency',
                  population: 120,
                  color: '#FF3B30',
                  legendFontColor: '#333',
                  legendFontSize: 12
                },
                {
                  name: 'Routine Check',
                  population: 350,
                  color: '#FF9500',
                  legendFontColor: '#333',
                  legendFontSize: 12
                }
              ]}
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

        {/* Performance Metrics Chart */}
        <View style={styles.section}>
          <RNText style={styles.sectionTitle}>Performance Metrics</RNText>
          <View style={styles.chartCard}>
            <ProgressChart
              data={{
                labels: ['Satisfaction', 'Efficiency', 'Quality', 'Response'],
                data: [0.92, 0.87, 0.95, 0.89]
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

        {/* Department Performance */}
        <View style={styles.section}>
          <RNText style={styles.sectionTitle}>Department Performance</RNText>
          <View style={styles.departmentContainer}>
            {departmentStats.map((dept, index) => (
              <View key={index} style={styles.departmentCard}>
                <View style={styles.departmentHeader}>
                  <View style={[styles.departmentIcon, { backgroundColor: `${dept.color}15` }]}>
                    <MaterialCommunityIcons name="hospital-building" size={20} color={dept.color} />
                  </View>
                  <View style={styles.departmentInfo}>
                    <RNText style={styles.departmentName}>{dept.name}</RNText>
                    <RNText style={styles.departmentSubtext}>{dept.appointments} appointments</RNText>
                  </View>
                  <RNText style={styles.departmentRevenue}>{dept.revenue}</RNText>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: dept.color,
                        width: `${(dept.appointments / 312) * 100}%`
                      }
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Top Doctors */}
        <View style={styles.section}>
          <RNText style={styles.sectionTitle}>Top Performing Doctors</RNText>
          <View style={styles.doctorsContainer}>
            {topDoctors.map((doctor, index) => (
              <View key={index} style={styles.doctorCard}>
                <View style={styles.doctorRank}>
                  <RNText style={styles.doctorRankText}>#{index + 1}</RNText>
                </View>
                <View style={styles.doctorAvatar}>
                  <MaterialCommunityIcons name="doctor" size={24} color="#1E4BA3" />
                </View>
                <View style={styles.doctorInfo}>
                  <RNText style={styles.doctorName}>{doctor.name}</RNText>
                  <RNText style={styles.doctorSpecialty}>{doctor.specialty}</RNText>
                  <View style={styles.doctorStats}>
                    <View style={styles.doctorStat}>
                      <MaterialCommunityIcons name="account-group" size={12} color="#6B7280" />
                      <RNText style={styles.doctorStatText}>{doctor.patients}</RNText>
                    </View>
                    <View style={styles.doctorStat}>
                      <MaterialCommunityIcons name="star" size={12} color="#F59E0B" />
                      <RNText style={styles.doctorStatText}>{doctor.rating}</RNText>
                    </View>
                  </View>
                </View>
                <RNText style={styles.doctorRevenue}>{doctor.revenue}</RNText>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <RNText style={styles.sectionTitle}>Recent Activity</RNText>
          <View style={styles.activityContainer}>
            {recentActivity.map((activity, index) => (
              <View key={index} style={styles.activityCard}>
                <View style={[styles.activityIcon, { backgroundColor: `${activity.color}15` }]}>
                  <MaterialCommunityIcons name={activity.icon as any} size={20} color={activity.color} />
                </View>
                <View style={styles.activityContent}>
                  <RNText style={styles.activityText}>{activity.text}</RNText>
                  <RNText style={styles.activityTime}>{activity.time}</RNText>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Stats Summary */}
        <View style={styles.section}>
          <RNText style={styles.sectionTitle}>Quick Summary</RNText>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <RNText style={styles.summaryLabel}>Average Wait Time</RNText>
              <RNText style={styles.summaryValue}>12 mins</RNText>
            </View>
            <View style={styles.summaryRow}>
              <RNText style={styles.summaryLabel}>Appointment Success Rate</RNText>
              <RNText style={[styles.summaryValue, { color: '#10B981' }]}>94.2%</RNText>
            </View>
            <View style={styles.summaryRow}>
              <RNText style={styles.summaryLabel}>Cancellation Rate</RNText>
              <RNText style={[styles.summaryValue, { color: '#EF4444' }]}>5.8%</RNText>
            </View>
            <View style={styles.summaryRow}>
              <RNText style={styles.summaryLabel}>New Patient Growth</RNText>
              <RNText style={[styles.summaryValue, { color: '#10B981' }]}>+15.2%</RNText>
            </View>
            <View style={styles.summaryRow}>
              <RNText style={styles.summaryLabel}>Revenue per Patient</RNText>
              <RNText style={styles.summaryValue}>$372</RNText>
            </View>
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


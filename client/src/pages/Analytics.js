import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import {
  FiTrendingUp,
  FiUsers,
  FiAward,
  FiClock,
  FiBarChart3,
  FiPieChart,
  FiRefreshCw,
  FiDownload,
  FiFilter,
  FiCalendar
} from 'react-icons/fi';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Analytics = () => {
  const { user } = useAuth();
  const { socket, isConnected, joinAnalyticsRoom, leaveAnalyticsRoom } = useSocket();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [positions, setPositions] = useState([]);
  const [realtimeData, setRealtimeData] = useState(null);

  useEffect(() => {
    fetchAnalytics();
    fetchPositions();
    
    if (isConnected) {
      joinAnalyticsRoom();
    }

    return () => {
      if (isConnected) {
        leaveAnalyticsRoom();
      }
    };
  }, [timeRange, selectedPosition]);

  useEffect(() => {
    if (socket) {
      socket.on('analytics-updated', (data) => {
        setRealtimeData(data);
        toast.success('Analytics updated in real-time!');
      });

      return () => {
        socket.off('analytics-updated');
      };
    }
  }, [socket]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/analytics/dashboard?timeRange=${timeRange}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchPositions = async () => {
    try {
      const response = await axios.get('/api/candidates/positions/list');
      setPositions(response.data.positions);
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  };

  const handleRefresh = () => {
    fetchAnalytics();
    toast.success('Analytics refreshed!');
  };

  const exportAnalytics = () => {
    if (!analytics) return;
    
    const dataStr = JSON.stringify(analytics, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Analytics exported successfully!');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="error-container">
        <h2>Failed to load analytics</h2>
        <button onClick={fetchAnalytics} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  const votingTrendsData = {
    labels: analytics.trends.votingTrends.map(item => item._id),
    datasets: [
      {
        label: 'Votes',
        data: analytics.trends.votingTrends.map(item => item.count),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1,
      },
    ],
  };

  const hourlyPatternData = {
    labels: analytics.trends.hourlyPattern.map(item => `${item._id}:00`),
    datasets: [
      {
        label: 'Votes by Hour',
        data: analytics.trends.hourlyPattern.map(item => item.count),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1,
      },
    ],
  };

  const positionAnalyticsData = {
    labels: analytics.performance.positionAnalytics.map(item => item._id),
    datasets: [
      {
        label: 'Total Votes',
        data: analytics.performance.positionAnalytics.map(item => item.totalVotes),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 1,
      },
      {
        label: 'Unique Voters',
        data: analytics.performance.positionAnalytics.map(item => item.uniqueVoterCount),
        backgroundColor: 'rgba(255, 205, 86, 0.5)',
        borderColor: 'rgb(255, 205, 86)',
        borderWidth: 1,
      },
    ],
  };

  const topCandidatesData = {
    labels: analytics.performance.topCandidates.map(item => item.name),
    datasets: [
      {
        label: 'Recent Votes',
        data: analytics.performance.topCandidates.map(item => item.recentVoteCount),
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        borderColor: 'rgb(153, 102, 255)',
        borderWidth: 1,
      },
    ],
  };

  const deviceAnalyticsData = {
    labels: ['Desktop', 'Mobile', 'Tablet', 'Unknown'],
    datasets: [
      {
        data: [65, 25, 8, 2], // Placeholder data - replace with actual device analytics
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
        ],
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div className="header-content">
          <h1>Analytics Dashboard</h1>
          <p>Comprehensive insights into voting patterns and trends</p>
        </div>
        <div className="header-actions">
          <div className="filters">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="select-input"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            {positions.length > 0 && (
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="select-input"
              >
                <option value="">All Positions</option>
                {positions.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="action-buttons">
            <button onClick={handleRefresh} className="btn btn-secondary">
              <FiRefreshCw /> Refresh
            </button>
            <button onClick={exportAnalytics} className="btn btn-primary">
              <FiDownload /> Export
            </button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="overview-cards">
        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="stat-icon">
            <FiTrendingUp />
          </div>
          <div className="stat-content">
            <h3>{analytics.overview.totalVotes.toLocaleString()}</h3>
            <p>Total Votes</p>
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="stat-icon">
            <FiUsers />
          </div>
          <div className="stat-content">
            <h3>{analytics.overview.totalUsers.toLocaleString()}</h3>
            <p>Total Users</p>
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="stat-icon">
            <FiBarChart3 />
          </div>
          <div className="stat-content">
            <h3>{analytics.overview.conversionRate}%</h3>
            <p>Conversion Rate</p>
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="stat-icon">
            <FiAward />
          </div>
          <div className="stat-content">
            <h3>{analytics.engagement.avgVotesPerUser.toFixed(1)}</h3>
            <p>Avg Votes/User</p>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-row">
          <motion.div
            className="chart-container"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="chart-header">
              <h3>Voting Trends</h3>
              <p>Vote activity over time</p>
            </div>
            <Line
              data={votingTrendsData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </motion.div>

          <motion.div
            className="chart-container"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="chart-header">
              <h3>Hourly Activity</h3>
              <p>Voting patterns by hour</p>
            </div>
            <Bar
              data={hourlyPatternData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </motion.div>
        </div>

        <div className="chart-row">
          <motion.div
            className="chart-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="chart-header">
              <h3>Position Analytics</h3>
              <p>Votes by position</p>
            </div>
            <Bar
              data={positionAnalyticsData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </motion.div>

          <motion.div
            className="chart-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="chart-header">
              <h3>Device Distribution</h3>
              <p>Votes by device type</p>
            </div>
            <Doughnut
              data={deviceAnalyticsData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                  title: {
                    display: false,
                  },
                },
              }}
            />
          </motion.div>
        </div>
      </div>

      {/* Top Candidates Section */}
      <motion.div
        className="top-candidates-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="section-header">
          <h3>Top Performing Candidates</h3>
          <p>Most voted candidates in the selected period</p>
        </div>
        <div className="candidates-grid">
          {analytics.performance.topCandidates.slice(0, 6).map((candidate, index) => (
            <div key={candidate._id || index} className="candidate-card">
              <div className="candidate-rank">#{index + 1}</div>
              <div className="candidate-info">
                <h4>{candidate.name}</h4>
                <p className="candidate-position">{candidate.position}</p>
                {candidate.party && <p className="candidate-party">{candidate.party}</p>}
              </div>
              <div className="candidate-stats">
                <div className="stat">
                  <span className="stat-value">{candidate.recentVoteCount}</span>
                  <span className="stat-label">Recent Votes</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{candidate.totalVoteCount}</span>
                  <span className="stat-label">Total Votes</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Real-time Updates */}
      {realtimeData && (
        <motion.div
          className="realtime-section"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="realtime-header">
            <h3>Real-time Updates</h3>
            <div className="connection-status">
              <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}></div>
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
          <div className="realtime-content">
            <div className="realtime-stat">
              <span className="stat-label">Recent Votes (24h)</span>
              <span className="stat-value">{realtimeData.last24Hours?.totalVotes || 0}</span>
            </div>
            <div className="realtime-stat">
              <span className="stat-label">Active Positions</span>
              <span className="stat-value">{realtimeData.last24Hours?.activePositions || 0}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Engagement Metrics */}
      <motion.div
        className="engagement-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="section-header">
          <h3>Engagement Metrics</h3>
          <p>User engagement and participation statistics</p>
        </div>
        <div className="engagement-grid">
          <div className="engagement-card">
            <div className="engagement-icon">
              <FiUsers />
            </div>
            <div className="engagement-content">
              <h4>{analytics.engagement.totalVoters}</h4>
              <p>Active Voters</p>
            </div>
          </div>
          <div className="engagement-card">
            <div className="engagement-icon">
              <FiBarChart3 />
            </div>
            <div className="engagement-content">
              <h4>{analytics.engagement.avgPositionsPerUser.toFixed(1)}</h4>
              <p>Avg Positions/User</p>
            </div>
          </div>
          <div className="engagement-card">
            <div className="engagement-icon">
              <FiAward />
            </div>
            <div className="engagement-content">
              <h4>{analytics.engagement.maxVotesByUser}</h4>
              <p>Max Votes by User</p>
            </div>
          </div>
          <div className="engagement-card">
            <div className="engagement-icon">
              <FiClock />
            </div>
            <div className="engagement-content">
              <h4>{analytics.overview.averageVotesPerUser.toFixed(1)}</h4>
              <p>Avg Votes/User</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Analytics; 
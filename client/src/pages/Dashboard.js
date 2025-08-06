import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { FaChartBar, FaVoteYea, FaHistory, FaUser, FaCalendar } from 'react-icons/fa';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [votingHistory, setVotingHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, historyRes] = await Promise.all([
          axios.get('/api/votes/stats/overview'),
          axios.get('/api/votes/history')
        ]);

        setStats(statsRes.data);
        setVotingHistory(historyRes.data.votes);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Welcome Section */}
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">
            <FaUser />
            Welcome back, {user?.username}!
          </h1>
          <p className="card-subtitle">
            Here's your voting activity and statistics
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-4">
        <div className="stats-card">
          <div className="stats-icon">
            <FaVoteYea />
          </div>
          <div className="stats-number">{votingHistory.length}</div>
          <div className="stats-label">Votes Cast</div>
        </div>

        <div className="stats-card">
          <div className="stats-icon">
            <FaChartBar />
          </div>
          <div className="stats-number">{stats?.totalPositions || 0}</div>
          <div className="stats-label">Positions Voted</div>
        </div>

        <div className="stats-card">
          <div className="stats-icon">
            <FaCalendar />
          </div>
          <div className="stats-number">
            {votingHistory.length > 0 
              ? new Date(votingHistory[0].createdAt).toLocaleDateString()
              : 'N/A'
            }
          </div>
          <div className="stats-label">Last Vote</div>
        </div>

        <div className="stats-card">
          <div className="stats-icon">
            <FaHistory />
          </div>
          <div className="stats-number">
            {votingHistory.filter(vote => 
              new Date(vote.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            ).length}
          </div>
          <div className="stats-label">This Week</div>
        </div>
      </div>

      {/* Voting History */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <FaHistory />
            Your Voting History
          </h2>
          <p className="card-subtitle">
            Recent votes and their details
          </p>
        </div>

        {votingHistory.length > 0 ? (
          <div className="voting-history">
            {votingHistory.map(vote => (
              <div key={vote._id} className="history-item">
                <div className="history-content">
                  <div className="history-candidate">
                    <h3>{vote.candidate.name}</h3>
                    <p className="history-position">{vote.candidate.position}</p>
                    {vote.candidate.party && (
                      <p className="history-party">{vote.candidate.party}</p>
                    )}
                  </div>
                  <div className="history-date">
                    {new Date(vote.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-history">
            <FaHistory />
            <p>No voting history yet</p>
            <Link to="/voting" className="btn btn-primary">
              Start Voting
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Quick Actions</h2>
        </div>
        <div className="quick-actions">
          <Link to="/voting" className="action-card">
            <FaVoteYea />
            <h3>Cast Vote</h3>
            <p>Participate in ongoing elections</p>
          </Link>
          
          <Link to="/results" className="action-card">
            <FaChartBar />
            <h3>View Results</h3>
            <p>See current voting results</p>
          </Link>
          
          <Link to="/profile" className="action-card">
            <FaUser />
            <h3>Profile</h3>
            <p>Manage your account settings</p>
          </Link>
        </div>
      </div>

      <style jsx>{`
        .dashboard {
          max-width: 1200px;
          margin: 0 auto;
        }

        .card-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .card-title svg {
          color: #667eea;
        }

        .stats-icon {
          font-size: 2rem;
          color: #667eea;
          margin-bottom: 0.5rem;
        }

        .voting-history {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .history-item {
          background: rgba(255, 255, 255, 0.5);
          border-radius: 8px;
          padding: 1rem;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        .history-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .history-candidate h3 {
          margin: 0;
          color: #333;
          font-size: 1.1rem;
        }

        .history-position {
          color: #667eea;
          font-weight: 500;
          margin: 0.25rem 0;
        }

        .history-party {
          color: #666;
          font-size: 0.9rem;
          margin: 0;
        }

        .history-date {
          color: #666;
          font-size: 0.9rem;
        }

        .no-history {
          text-align: center;
          padding: 3rem;
          color: #666;
        }

        .no-history svg {
          font-size: 3rem;
          margin-bottom: 1rem;
          color: #ccc;
        }

        .quick-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .action-card {
          background: rgba(255, 255, 255, 0.5);
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          text-decoration: none;
          color: inherit;
          border: 1px solid rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .action-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          text-decoration: none;
          color: inherit;
        }

        .action-card svg {
          font-size: 2rem;
          color: #667eea;
          margin-bottom: 1rem;
        }

        .action-card h3 {
          margin: 0 0 0.5rem 0;
          color: #333;
        }

        .action-card p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }

        @media (max-width: 768px) {
          .history-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .quick-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard; 
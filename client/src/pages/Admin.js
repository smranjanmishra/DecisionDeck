import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FaChartBar, 
  FaUser, 
  FaVoteYea, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye,
  FaUsers,
  FaCrown
} from 'react-icons/fa';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [candidateForm, setCandidateForm] = useState({
    name: '',
    position: '',
    party: '',
    description: ''
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [statsRes, candidatesRes, usersRes] = await Promise.all([
        axios.get('/api/votes/stats/admin'),
        axios.get('/api/candidates'),
        axios.get('/api/users')
      ]);

      setStats(statsRes.data);
      setCandidates(candidatesRes.data.candidates);
      setUsers(usersRes.data.users);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post('/api/candidates', candidateForm);
      toast.success('Candidate added successfully');
      setShowAddCandidate(false);
      setCandidateForm({ name: '', position: '', party: '', description: '' });
      fetchAdminData();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add candidate';
      toast.error(message);
    }
  };

  const handleDeleteCandidate = async (id) => {
    if (window.confirm('Are you sure you want to delete this candidate?')) {
      try {
        await axios.delete(`/api/candidates/${id}`);
        toast.success('Candidate deleted successfully');
        fetchAdminData();
      } catch (error) {
        toast.error('Failed to delete candidate');
      }
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`/api/users/${id}`);
        toast.success('User deleted successfully');
        fetchAdminData();
      } catch (error) {
        toast.error('Failed to delete user');
      }
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">
            <FaCrown />
            Admin Dashboard
          </h1>
          <p className="card-subtitle">
            Manage candidates, users, and monitor voting activities
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="admin-tabs">
          <button
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <FaChartBar />
            Overview
          </button>
          <button
            className={`tab-button ${activeTab === 'candidates' ? 'active' : ''}`}
            onClick={() => setActiveTab('candidates')}
          >
            <FaUser />
            Candidates
          </button>
          <button
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <FaUsers />
            Users
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stats-card">
                <div className="stats-icon">
                  <FaVoteYea />
                </div>
                <div className="stats-number">{stats?.totalVotes || 0}</div>
                <div className="stats-label">Total Votes</div>
              </div>

              <div className="stats-card">
                <div className="stats-icon">
                  <FaUser />
                </div>
                <div className="stats-number">{candidates.length}</div>
                <div className="stats-label">Candidates</div>
              </div>

              <div className="stats-card">
                <div className="stats-icon">
                  <FaUsers />
                </div>
                <div className="stats-number">{users.length}</div>
                <div className="stats-label">Users</div>
              </div>

              <div className="stats-card">
                <div className="stats-icon">
                  <FaChartBar />
                </div>
                <div className="stats-number">{stats?.validVotes || 0}</div>
                <div className="stats-label">Valid Votes</div>
              </div>
            </div>

            {stats?.votesByPosition && (
              <div className="position-stats">
                <h3>Votes by Position</h3>
                <div className="position-list">
                  {stats.votesByPosition.map((position, index) => (
                    <div key={index} className="position-item">
                      <span className="position-name">{position._id}</span>
                      <span className="position-votes">{position.voteCount} votes</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Candidates Tab */}
        {activeTab === 'candidates' && (
          <div className="candidates-section">
            <div className="section-header">
              <h3>Candidates Management</h3>
              <button
                className="btn btn-primary"
                onClick={() => setShowAddCandidate(true)}
              >
                <FaPlus />
                Add Candidate
              </button>
            </div>

            {showAddCandidate && (
              <div className="add-candidate-form">
                <h4>Add New Candidate</h4>
                <form onSubmit={handleAddCandidate}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Name</label>
                      <input
                        type="text"
                        value={candidateForm.name}
                        onChange={(e) => setCandidateForm(prev => ({ ...prev, name: e.target.value }))}
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Position</label>
                      <input
                        type="text"
                        value={candidateForm.position}
                        onChange={(e) => setCandidateForm(prev => ({ ...prev, position: e.target.value }))}
                        className="form-input"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Party</label>
                      <input
                        type="text"
                        value={candidateForm.party}
                        onChange={(e) => setCandidateForm(prev => ({ ...prev, party: e.target.value }))}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        value={candidateForm.description}
                        onChange={(e) => setCandidateForm(prev => ({ ...prev, description: e.target.value }))}
                        className="form-input"
                        rows="3"
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                      Add Candidate
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowAddCandidate(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="candidates-list">
              {candidates.map(candidate => (
                <div key={candidate._id} className="candidate-item">
                  <div className="candidate-info">
                    <h4>{candidate.name}</h4>
                    <p className="candidate-position">{candidate.position}</p>
                    {candidate.party && <p className="candidate-party">{candidate.party}</p>}
                    <p className="candidate-votes">{candidate.voteCount} votes</p>
                  </div>
                  <div className="candidate-actions">
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteCandidate(candidate._id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="users-section">
            <h3>User Management</h3>
            <div className="users-list">
              {users.map(user => (
                <div key={user._id} className="user-item">
                  <div className="user-info">
                    <h4>{user.username}</h4>
                    <p className="user-email">{user.email}</p>
                    <span className={`role-badge ${user.role}`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="user-actions">
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteUser(user._id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .admin-page {
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

        .admin-tabs {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          padding-bottom: 1rem;
        }

        .tab-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          background: none;
          color: #666;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .tab-button.active {
          background: #667eea;
          color: white;
        }

        .tab-button:hover {
          background: rgba(102, 126, 234, 0.1);
        }

        .tab-button.active:hover {
          background: #667eea;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .position-stats h3 {
          margin-bottom: 1rem;
          color: #333;
        }

        .position-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .position-item {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 8px;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        .position-name {
          font-weight: 500;
          color: #333;
        }

        .position-votes {
          color: #667eea;
          font-weight: 500;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .add-candidate-form {
          background: rgba(255, 255, 255, 0.5);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
        }

        .candidates-list,
        .users-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .candidate-item,
        .user-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 8px;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        .candidate-info h4,
        .user-info h4 {
          margin: 0 0 0.25rem 0;
          color: #333;
        }

        .candidate-position,
        .user-email {
          color: #667eea;
          font-weight: 500;
          margin: 0.25rem 0;
        }

        .candidate-party {
          color: #666;
          margin: 0.25rem 0;
        }

        .candidate-votes {
          color: #333;
          font-weight: 500;
          margin: 0;
        }

        .role-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 500;
          text-transform: capitalize;
        }

        .role-badge.user {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
        }

        .role-badge.admin {
          background: rgba(255, 107, 107, 0.1);
          color: #ff6b6b;
        }

        @media (max-width: 768px) {
          .admin-tabs {
            flex-direction: column;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }

          .candidate-item,
          .user-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Admin; 
import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaVoteYea, FaUser, FaCheck, FaTimes } from 'react-icons/fa';

const Voting = () => {
  const [candidates, setCandidates] = useState([]);
  const [positions, setPositions] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [userVotes, setUserVotes] = useState({});

  const { user } = useAuth();
  const { joinVoteRoom, leaveVoteRoom, onVoteUpdate } = useSocket();

  // Fetch candidates and positions
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [candidatesRes, positionsRes] = await Promise.all([
          axios.get('/api/candidates'),
          axios.get('/api/candidates/positions/list')
        ]);

        setCandidates(candidatesRes.data.candidates);
        setPositions(positionsRes.data.positions);
        
        if (positionsRes.data.positions.length > 0) {
          setSelectedPosition(positionsRes.data.positions[0]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load candidates');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Join vote room for real-time updates
  useEffect(() => {
    if (selectedPosition) {
      joinVoteRoom(selectedPosition);
      
      return () => {
        leaveVoteRoom(selectedPosition);
      };
    }
  }, [selectedPosition, joinVoteRoom, leaveVoteRoom]);

  // Listen for real-time vote updates
  useEffect(() => {
    const cleanup = onVoteUpdate((data) => {
      if (data.position === selectedPosition) {
        setCandidates(prev => 
          prev.map(candidate => 
            candidate._id === data.candidateId 
              ? { ...candidate, voteCount: data.voteCount }
              : candidate
          )
        );
      }
    });

    return cleanup;
  }, [selectedPosition, onVoteUpdate]);

  // Check user's previous votes
  useEffect(() => {
    const checkUserVotes = async () => {
      try {
        const response = await axios.get('/api/votes/history');
        const votes = {};
        response.data.votes.forEach(vote => {
          votes[vote.candidate.position] = vote.candidate._id;
        });
        setUserVotes(votes);
      } catch (error) {
        console.error('Error checking user votes:', error);
      }
    };

    if (user) {
      checkUserVotes();
    }
  }, [user]);

  const handleVote = async (candidateId) => {
    if (!selectedPosition) {
      toast.error('Please select a position first');
      return;
    }

    if (userVotes[selectedPosition]) {
      toast.error('You have already voted for this position');
      return;
    }

    setVoting(true);
    
    try {
      await axios.post('/api/votes', {
        candidateId,
        position: selectedPosition
      });

      setUserVotes(prev => ({
        ...prev,
        [selectedPosition]: candidateId
      }));

      toast.success('Vote submitted successfully!');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to submit vote';
      toast.error(message);
    } finally {
      setVoting(false);
    }
  };

  const filteredCandidates = candidates.filter(
    candidate => candidate.position === selectedPosition
  );

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="voting-page">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">
            <FaVoteYea />
            Cast Your Vote
          </h1>
          <p className="card-subtitle">
            Select a position and choose your preferred candidate
          </p>
        </div>

        {/* Position Selection */}
        <div className="form-group">
          <label className="form-label">Select Position</label>
          <select
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="form-input"
          >
            {positions.map(position => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
        </div>

        {selectedPosition && (
          <>
            {/* Voting Status */}
            {userVotes[selectedPosition] ? (
              <div className="vote-status voted">
                <FaCheck />
                <span>You have already voted for this position</span>
              </div>
            ) : (
              <div className="vote-status">
                <FaVoteYea />
                <span>You can vote for this position</span>
              </div>
            )}

            {/* Candidates */}
            <div className="candidates-grid">
              {filteredCandidates.map(candidate => (
                <div
                  key={candidate._id}
                  className={`candidate-card ${
                    userVotes[selectedPosition] === candidate._id ? 'voted' : ''
                  }`}
                >
                  {candidate.image ? (
                    <img
                      src={candidate.image}
                      alt={candidate.name}
                      className="candidate-image"
                    />
                  ) : (
                    <div className="candidate-image-placeholder">
                      <FaUser />
                    </div>
                  )}

                  <h3 className="candidate-name">{candidate.name}</h3>
                  
                  {candidate.party && (
                    <p className="candidate-party">{candidate.party}</p>
                  )}
                  
                  {candidate.description && (
                    <p className="candidate-description">{candidate.description}</p>
                  )}

                  <div className="vote-count">
                    {candidate.voteCount} votes
                  </div>
                  
                  <div className="vote-percentage">
                    {filteredCandidates.length > 0 && candidate.voteCount > 0
                      ? `${((candidate.voteCount / filteredCandidates.reduce((sum, c) => sum + c.voteCount, 0)) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </div>

                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${filteredCandidates.length > 0 && candidate.voteCount > 0
                          ? (candidate.voteCount / filteredCandidates.reduce((sum, c) => sum + c.voteCount, 0)) * 100
                          : 0
                        }%`
                      }}
                    />
                  </div>

                  {!userVotes[selectedPosition] && (
                    <button
                      className="btn btn-primary vote-button"
                      onClick={() => handleVote(candidate._id)}
                      disabled={voting}
                    >
                      {voting ? 'Submitting...' : 'Vote'}
                    </button>
                  )}

                  {userVotes[selectedPosition] === candidate._id && (
                    <div className="voted-indicator">
                      <FaCheck />
                      <span>Your Vote</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredCandidates.length === 0 && (
              <div className="no-candidates">
                <FaTimes />
                <p>No candidates available for this position</p>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .voting-page {
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

        .vote-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: rgba(102, 126, 234, 0.1);
          border-radius: 8px;
          margin-bottom: 2rem;
          color: #667eea;
          font-weight: 500;
        }

        .vote-status.voted {
          background: rgba(76, 175, 80, 0.1);
          color: #4caf50;
        }

        .candidates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
        }

        .candidate-card {
          position: relative;
          transition: all 0.3s ease;
        }

        .candidate-card.voted {
          border: 2px solid #4caf50;
          background: rgba(76, 175, 80, 0.05);
        }

        .candidate-image-placeholder {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(102, 126, 234, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
          color: #667eea;
          font-size: 2rem;
        }

        .vote-button {
          width: 100%;
          margin-top: 1rem;
        }

        .voted-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: #4caf50;
          color: white;
          border-radius: 8px;
          margin-top: 1rem;
          font-weight: 500;
        }

        .no-candidates {
          text-align: center;
          padding: 3rem;
          color: #666;
        }

        .no-candidates svg {
          font-size: 3rem;
          margin-bottom: 1rem;
          color: #ccc;
        }

        @media (max-width: 768px) {
          .candidates-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Voting; 
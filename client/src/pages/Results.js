import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaChartBar, FaVoteYea, FaUser, FaTrophy } from 'react-icons/fa';

const Results = () => {
  const [positions, setPositions] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const response = await axios.get('/api/candidates/positions/list');
        setPositions(response.data.positions);
        if (response.data.positions.length > 0) {
          setSelectedPosition(response.data.positions[0]);
        }
      } catch (error) {
        console.error('Error fetching positions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPositions();
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (!selectedPosition) return;

      try {
        const response = await axios.get(`/api/votes/results/${selectedPosition}`);
        setResults(response.data);
      } catch (error) {
        console.error('Error fetching results:', error);
      }
    };

    fetchResults();
  }, [selectedPosition]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="results-page">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">
            <FaChartBar />
            Voting Results
          </h1>
          <p className="card-subtitle">
            Live results and statistics for all positions
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

        {results && (
          <>
            {/* Results Summary */}
            <div className="results-summary">
              <div className="summary-card">
                <div className="summary-icon">
                  <FaVoteYea />
                </div>
                <div className="summary-content">
                  <h3>Total Votes</h3>
                  <div className="summary-number">{results.totalVotes}</div>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon">
                  <FaUser />
                </div>
                <div className="summary-content">
                  <h3>Candidates</h3>
                  <div className="summary-number">{results.totalCandidates}</div>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon">
                  <FaTrophy />
                </div>
                <div className="summary-content">
                  <h3>Leading</h3>
                  <div className="summary-number">
                    {results.results.length > 0 ? results.results[0].name : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Results List */}
            <div className="results-list">
              {results.results.map((candidate, index) => (
                <div
                  key={candidate.id}
                  className={`result-item ${index === 0 ? 'winner' : ''}`}
                >
                  <div className="result-rank">
                    {index === 0 && <FaTrophy />}
                    <span>{index + 1}</span>
                  </div>

                  <div className="result-candidate">
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

                    <div className="candidate-info">
                      <h3 className="candidate-name">{candidate.name}</h3>
                      {candidate.party && (
                        <p className="candidate-party">{candidate.party}</p>
                      )}
                      {candidate.description && (
                        <p className="candidate-description">{candidate.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="result-stats">
                    <div className="vote-count">
                      {candidate.voteCount} votes
                    </div>
                    <div className="vote-percentage">
                      {candidate.percentage}%
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${candidate.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {results.results.length === 0 && (
              <div className="no-results">
                <FaChartBar />
                <p>No results available for this position</p>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .results-page {
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

        .results-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .summary-card {
          background: rgba(255, 255, 255, 0.5);
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        .summary-icon {
          font-size: 2rem;
          color: #667eea;
        }

        .summary-content h3 {
          margin: 0;
          font-size: 0.9rem;
          color: #666;
          font-weight: normal;
        }

        .summary-number {
          font-size: 1.5rem;
          font-weight: bold;
          color: #333;
        }

        .results-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .result-item {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          border: 1px solid rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .result-item.winner {
          border: 2px solid #ffd700;
          background: rgba(255, 215, 0, 0.05);
        }

        .result-rank {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.5rem;
          font-weight: bold;
          color: #667eea;
          min-width: 40px;
        }

        .result-rank svg {
          color: #ffd700;
          font-size: 1.2rem;
        }

        .result-candidate {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .candidate-image-placeholder {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: rgba(102, 126, 234, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #667eea;
          font-size: 1.5rem;
        }

        .candidate-info h3 {
          margin: 0 0 0.25rem 0;
          color: #333;
        }

        .candidate-party {
          color: #667eea;
          font-weight: 500;
          margin: 0.25rem 0;
        }

        .candidate-description {
          color: #666;
          font-size: 0.9rem;
          margin: 0;
        }

        .result-stats {
          text-align: right;
          min-width: 150px;
        }

        .vote-count {
          font-size: 1.25rem;
          font-weight: bold;
          color: #333;
          margin-bottom: 0.25rem;
        }

        .vote-percentage {
          color: #667eea;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .no-results {
          text-align: center;
          padding: 3rem;
          color: #666;
        }

        .no-results svg {
          font-size: 3rem;
          margin-bottom: 1rem;
          color: #ccc;
        }

        @media (max-width: 768px) {
          .result-item {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
          }

          .result-candidate {
            flex-direction: column;
          }

          .result-stats {
            text-align: center;
            width: 100%;
          }

          .results-summary {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Results; 
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaVoteYea, FaChartLine, FaShieldAlt, FaBolt } from 'react-icons/fa';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Make Your Voice Heard with
            <span className="gradient-text"> DecisionDeck</span>
          </h1>
          <p className="hero-subtitle">
            Experience real-time voting with instant results and live updates. 
            Secure, transparent, and accessible voting platform for the digital age.
          </p>
          <div className="hero-buttons">
            {isAuthenticated ? (
              <Link to="/voting" className="btn btn-primary">
                Start Voting
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary">
                  Get Started
                </Link>
                <Link to="/login" className="btn btn-secondary">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2 className="section-title">Why Choose DecisionDeck?</h2>
        <div className="grid grid-3">
          <div className="feature-card">
            <div className="feature-icon">
              <FaBolt />
            </div>
            <h3>Real-Time Updates</h3>
            <p>
              Experience live voting results with instant updates using WebSocket technology. 
              See the impact of your vote immediately.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FaShieldAlt />
            </div>
            <h3>Secure & Transparent</h3>
            <p>
              JWT-based authentication ensures secure access while maintaining complete 
              transparency in the voting process.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FaChartLine />
            </div>
            <h3>Live Analytics</h3>
            <p>
              Track voting trends and results in real-time with comprehensive 
              analytics and visual representations.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FaVoteYea />
            </div>
            <h3>Easy Voting</h3>
            <p>
              Simple and intuitive voting interface that makes participating 
              in elections effortless and accessible.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FaShieldAlt />
            </div>
            <h3>Admin Controls</h3>
            <p>
              Comprehensive admin panel for managing candidates, users, and 
              monitoring voting activities with detailed insights.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <FaChartLine />
            </div>
            <h3>Mobile Friendly</h3>
            <p>
              Responsive design that works seamlessly across all devices, 
              ensuring everyone can participate from anywhere.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-content">
          <h2>Ready to Start Voting?</h2>
          <p>Join thousands of users making informed decisions with DecisionDeck</p>
          {isAuthenticated ? (
            <Link to="/voting" className="btn btn-primary">
              Go to Voting
            </Link>
          ) : (
            <Link to="/register" className="btn btn-primary">
              Create Account
            </Link>
          )}
        </div>
      </section>

      <style jsx>{`
        .hero {
          text-align: center;
          padding: 4rem 0;
          margin-bottom: 4rem;
        }

        .hero-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .hero-title {
          font-size: 3rem;
          font-weight: bold;
          margin-bottom: 1.5rem;
          line-height: 1.2;
        }

        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: #666;
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .hero-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .section-title {
          text-align: center;
          font-size: 2.5rem;
          font-weight: bold;
          margin-bottom: 3rem;
          color: #333;
        }

        .features {
          padding: 4rem 0;
          margin-bottom: 4rem;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          padding: 2rem;
          text-align: center;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: transform 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-8px);
        }

        .feature-icon {
          font-size: 3rem;
          color: #667eea;
          margin-bottom: 1rem;
        }

        .feature-card h3 {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 1rem;
          color: #333;
        }

        .feature-card p {
          color: #666;
          line-height: 1.6;
        }

        .cta {
          text-align: center;
          padding: 4rem 0;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          margin-bottom: 2rem;
        }

        .cta-content {
          max-width: 600px;
          margin: 0 auto;
        }

        .cta h2 {
          font-size: 2.5rem;
          font-weight: bold;
          margin-bottom: 1rem;
          color: #333;
        }

        .cta p {
          font-size: 1.25rem;
          color: #666;
          margin-bottom: 2rem;
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2rem;
          }

          .hero-subtitle {
            font-size: 1.1rem;
          }

          .section-title {
            font-size: 2rem;
          }

          .cta h2 {
            font-size: 2rem;
          }

          .hero-buttons {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
};

export default Home; 
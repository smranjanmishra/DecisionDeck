import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaUser, FaSignOutAlt, FaCog, FaChartBar } from 'react-icons/fa';

const Navbar = () => {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowMenu(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          DecisionDeck
        </Link>

        <div className="nav-links">
          <Link to="/" className="nav-link">
            Home
          </Link>
          
          <Link to="/results" className="nav-link">
            Results
          </Link>

          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="nav-link">
                Dashboard
              </Link>
              
              <Link to="/voting" className="nav-link">
                Vote
              </Link>

              {isAdmin && (
                <Link to="/admin" className="nav-link">
                  Admin
                </Link>
              )}

              <div className="user-menu">
                <button
                  className="nav-button"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <FaUser />
                  <span style={{ marginLeft: '0.5rem' }}>
                    {user?.username}
                  </span>
                </button>

                {showMenu && (
                  <div className="dropdown-menu">
                    <Link
                      to="/profile"
                      className="dropdown-item"
                      onClick={() => setShowMenu(false)}
                    >
                      <FaCog />
                      <span>Profile</span>
                    </Link>
                    
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="dropdown-item"
                        onClick={() => setShowMenu(false)}
                      >
                        <FaChartBar />
                        <span>Admin Panel</span>
                      </Link>
                    )}
                    
                    <button
                      className="dropdown-item"
                      onClick={handleLogout}
                    >
                      <FaSignOutAlt />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="nav-button">
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .user-menu {
          position: relative;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          padding: 0.5rem 0;
          min-width: 200px;
          z-index: 1000;
          margin-top: 0.5rem;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          color: #333;
          text-decoration: none;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
          font-size: 0.9rem;
          transition: background-color 0.2s ease;
        }

        .dropdown-item:hover {
          background-color: rgba(102, 126, 234, 0.1);
        }

        .dropdown-item svg {
          width: 16px;
          height: 16px;
        }
      `}</style>
    </nav>
  );
};

export default Navbar; 
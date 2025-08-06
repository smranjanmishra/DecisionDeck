import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaUser, FaEnvelope, FaSave, FaEdit } from 'react-icons/fa';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const result = await updateProfile(formData);
      if (result.success) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || ''
    });
    setErrors({});
    setIsEditing(false);
  };

  return (
    <div className="profile-page">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">
            <FaUser />
            Profile Settings
          </h1>
          <p className="card-subtitle">
            Manage your account information and preferences
          </p>
        </div>

        {!isEditing ? (
          <div className="profile-info">
            <div className="info-item">
              <label>Username</label>
              <div className="info-value">{user?.username}</div>
            </div>

            <div className="info-item">
              <label>Email</label>
              <div className="info-value">{user?.email}</div>
            </div>

            <div className="info-item">
              <label>Role</label>
              <div className="info-value">
                <span className={`role-badge ${user?.role}`}>
                  {user?.role}
                </span>
              </div>
            </div>

            <div className="info-item">
              <label>Member Since</label>
              <div className="info-value">
                {new Date(user?.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>

            <div className="info-item">
              <label>Last Login</label>
              <div className="info-value">
                {new Date(user?.lastLogin).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setIsEditing(true)}
            >
              <FaEdit />
              Edit Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                <FaUser />
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`form-input ${errors.username ? 'error' : ''}`}
                placeholder="Enter your username"
              />
              {errors.username && <div className="form-error">{errors.username}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                <FaEnvelope />
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="Enter your email"
              />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                <FaSave />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <style jsx>{`
        .profile-page {
          max-width: 800px;
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

        .profile-info {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 8px;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        .info-item label {
          font-weight: 500;
          color: #333;
        }

        .info-value {
          color: #666;
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

        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #333;
        }

        .form-label svg {
          width: 16px;
          height: 16px;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        @media (max-width: 768px) {
          .info-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default Profile; 
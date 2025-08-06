import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      const newSocket = io('http://localhost:5000', {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
        setConnectionError(null);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Disconnected from server:', reason);
        setIsConnected(false);
        if (reason === 'io server disconnect') {
          // Server disconnected us, try to reconnect
          newSocket.connect();
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
        setConnectionError(error.message);
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('Reconnected to server after', attemptNumber, 'attempts');
        setIsConnected(true);
        setConnectionError(null);
      });

      newSocket.on('reconnect_error', (error) => {
        console.error('Reconnection error:', error);
        setConnectionError('Failed to reconnect');
      });

      newSocket.on('reconnect_failed', () => {
        console.error('Reconnection failed');
        setConnectionError('Reconnection failed');
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
        setConnectionError(null);
      }
    }
  }, [isAuthenticated]);

  const joinVoteRoom = (voteId) => {
    if (socket && isConnected) {
      socket.emit('join-vote-room', voteId);
      console.log(`Joined vote room: ${voteId}`);
    } else {
      console.warn('Cannot join vote room: socket not connected');
    }
  };

  const leaveVoteRoom = (voteId) => {
    if (socket && isConnected) {
      socket.emit('leave-vote-room', voteId);
      console.log(`Left vote room: ${voteId}`);
    } else {
      console.warn('Cannot leave vote room: socket not connected');
    }
  };

  const joinAnalyticsRoom = () => {
    if (socket && isConnected) {
      socket.emit('join-analytics-room');
      console.log('Joined analytics room');
    } else {
      console.warn('Cannot join analytics room: socket not connected');
    }
  };

  const leaveAnalyticsRoom = () => {
    if (socket && isConnected) {
      socket.emit('leave-analytics-room');
      console.log('Left analytics room');
    } else {
      console.warn('Cannot leave analytics room: socket not connected');
    }
  };

  const onVoteUpdate = (callback) => {
    if (socket) {
      socket.on('vote-updated', callback);
      return () => socket.off('vote-updated', callback);
    }
  };

  const onAnalyticsUpdate = (callback) => {
    if (socket) {
      socket.on('analytics-updated', callback);
      return () => socket.off('analytics-updated', callback);
    }
  };

  const emitAnalyticsRequest = (data) => {
    if (socket && isConnected) {
      socket.emit('request-analytics', data);
    } else {
      console.warn('Cannot emit analytics request: socket not connected');
    }
  };

  const getConnectionStatus = () => {
    if (!socket) return 'disconnected';
    if (isConnected) return 'connected';
    if (connectionError) return 'error';
    return 'connecting';
  };

  const reconnect = () => {
    if (socket) {
      socket.connect();
    }
  };

  const value = {
    socket,
    isConnected,
    connectionError,
    connectionStatus: getConnectionStatus(),
    joinVoteRoom,
    leaveVoteRoom,
    joinAnalyticsRoom,
    leaveAnalyticsRoom,
    onVoteUpdate,
    onAnalyticsUpdate,
    emitAnalyticsRequest,
    reconnect
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 
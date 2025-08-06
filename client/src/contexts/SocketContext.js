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
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      const newSocket = io('http://localhost:5000', {
        transports: ['websocket'],
        autoConnect: true
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
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
      }
    }
  }, [isAuthenticated]);

  const joinVoteRoom = (voteId) => {
    if (socket && isConnected) {
      socket.emit('join-vote-room', voteId);
    }
  };

  const leaveVoteRoom = (voteId) => {
    if (socket && isConnected) {
      socket.emit('leave-vote-room', voteId);
    }
  };

  const onVoteUpdate = (callback) => {
    if (socket) {
      socket.on('vote-updated', callback);
      return () => socket.off('vote-updated', callback);
    }
  };

  const value = {
    socket,
    isConnected,
    joinVoteRoom,
    leaveVoteRoom,
    onVoteUpdate
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 
/* eslint-disable prettier/prettier */
import { io } from 'socket.io-client';

// Replace with your backend WebSocket URL
const socket = io('http://localhost:3000/groups', {
  transports: ['websocket'],
  auth: {
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5YmU1YmY0OC0zMzQzLTRhZDMtODcwNi1kMjVhOTM5Y2E3ZWQiLCJlbWFpbCI6ImoyNjUxNTc2MkBnbWFpbC5jb20iLCJyb2xlIjoiU1RVREVOVCIsImlhdCI6MTc1NjQ1MzYwOSwiZXhwIjoxNzU2NTQwMDA5fQ.z1h9M4VmvPDX4yhSgdR1K6_Yy2F9P2m9EnFkIoVT3fA',
  },
});

// --- Connection events ---
socket.on('connect', () => {
  console.log('✅ Connected to server with id:', socket.id);

  // Join a group immediately after connect
  const groupId = 'ad655799-03fe-4b7c-a703-3a58faa1cfde';
  socket.emit('join', { groupId });   
  console.log('➡️ Sent join request for:', groupId);

  // Send a test message after 2s
  setTimeout(() => {
    socket.emit('message', {          
      groupId,
      content: 'Hello everyone 👋, this is a test message!',
    });
  }, 2000);
});

socket.on('connect_error', (err) => {
  console.error('❌ Connection failed:', err.message);
});

// --- Custom group events (must match gateway) ---
socket.on('joined', (data) => {       
  console.log('📌 Joined group:', data);
});

socket.on('message', (msg) => {     
  console.log('💬 New message received:', msg);
});

socket.on('error', (err) => {
  console.error('⚠️ Server error:', err);
});

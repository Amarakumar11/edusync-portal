import React, { useEffect, useState } from 'react';
import { signupWithEmail, loginWithEmail, logout } from './services/authService';
import { createLeaveRequest, getAnnouncementsRealtime } from './services/firestoreService';
import { uploadFileAndGetUrl } from './services/storageService';

export default function FirebaseDemo() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    // Listen to announcements in real time
    const unsub = getAnnouncementsRealtime(setAnnouncements);
    return () => unsub();
  }, []);

  async function handleSignup() {
    await signupWithEmail('test@edu.com', 'password123', 'Test User');
  }

  async function handleLogin() {
    await loginWithEmail('test@edu.com', 'password123');
  }

  async function handleLogout() {
    await logout();
  }

  async function handleLeaveRequest() {
    await createLeaveRequest({
      id: '',
      facultyId: 'uid123',
      reason: 'Personal',
      from: '2026-02-05',
      to: '2026-02-06',
      status: 'pending',
      createdAt: Date.now(),
    });
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const url = await uploadFileAndGetUrl('uploads/' + e.target.files[0].name, e.target.files[0]);
      alert('File uploaded! URL: ' + url);
    }
  }

  return (
    <div>
      <button onClick={handleSignup}>Signup</button>
      <button onClick={handleLogin}>Login</button>
      <button onClick={handleLogout}>Logout</button>
      <button onClick={handleLeaveRequest}>Create Leave Request</button>
      <input type="file" onChange={handleFileUpload} />
      <div>
        <h3>Announcements:</h3>
        <ul>
          {announcements.map((a: any, i) => (
            <li key={i}>{a.title}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

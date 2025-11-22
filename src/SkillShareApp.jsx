import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, query, where, serverTimestamp } from 'firebase/firestore';

// Firebase Configuration - Using environment variables with fallbacks
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDummyKeyForTesting",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "skillshare-test.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "skillshare-test",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "skillshare-test.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

// Application ID for Firestore paths
const APP_ID = process.env.REACT_APP_SKILLSHARE_APP_ID || 'skillshare_app';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Main SkillShare Application Component
const SkillShareApp = () => {
  // Authentication State
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Application State
  const [page, setPage] = useState('list'); // 'list' | 'detail' | 'dashboard'
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [skills, setSkills] = useState([]);
  const [userRequests, setUserRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal State
  const [showNewSkillModal, setShowNewSkillModal] = useState(false);
  const [showVideoCallModal, setShowVideoCallModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Form State
  const [newSkillForm, setNewSkillForm] = useState({
    title: '',
    description: '',
    category: '',
    teacherName: ''
  });
  const [requestForm, setRequestForm] = useState({
    message: '',
    studentName: ''
  });

  // Firebase Authentication Effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setIsAuthReady(true);
      } else {
        // Try custom token first, then fall back to anonymous
        try {
          if (typeof window !== 'undefined' && window.__initial_auth_token) {
            await signInWithCustomToken(auth, window.__initial_auth_token);
          } else {
            await signInAnonymously(auth);
          }
        } catch (error) {
          console.error('Authentication error:', error);
          setError('Failed to authenticate. Please refresh the page.');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time Skills Data Listener
  useEffect(() => {
    if (!isAuthReady) return;

    setLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, 'artifacts', APP_ID, 'public', 'data', 'skills'),
      (snapshot) => {
        const skillsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSkills(skillsData);
        setLoading(false);
      },
      (error) => {
        console.error('Skills listener error:', error);
        setError('Failed to load skills. Please try again.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAuthReady]);

  // Real-time User Requests Listener
  useEffect(() => {
    if (!isAuthReady || !userId) return;

    const unsubscribe = onSnapshot(
      collection(db, 'artifacts', APP_ID, 'users', userId, 'requests'),
      (snapshot) => {
        const requestsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUserRequests(requestsData);
      },
      (error) => {
        console.error('Requests listener error:', error);
        setError('Failed to load your requests. Please try again.');
      }
    );

    return () => unsubscribe();
  }, [isAuthReady, userId]);

  // Modal Component
  const Modal = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
      const handleEscape = (e) => {
        if (e.key === 'Escape') onClose();
      };

      if (isOpen) {
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
      }

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-xl font-bold mb-4">{title}</h2>
          {children}
        </div>
      </div>
    );
  };

  // RequestItem Component
  const RequestItem = ({ request, isTeacher }) => {
    return (
      <div className="border border-gray-200 rounded-lg p-4 mb-3">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-semibold text-gray-900">{request.skillTitle}</h4>
            <p className="text-sm text-gray-600">
              {isTeacher ? `Student: ${request.studentName}` : `Teacher: ${request.teacherName}`}
            </p>
          </div>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
            request.status === 'Accepted' ? 'bg-green-100 text-green-800' :
            request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
            request.status === 'Rejected' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {request.status}
          </span>
        </div>

        {request.message && (
          <p className="text-sm text-gray-700 mb-3">{request.message}</p>
        )}

        {request.status === 'Accepted' && (
          <button
            onClick={() => {
              setSelectedRequest(request);
              setShowVideoCallModal(true);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Join Video Call
          </button>
        )}
      </div>
    );
  };

  // SkillList Component
  const SkillList = ({ skills, onSelectSkill, onOfferSkill, userId }) => {
    const mySkills = skills.filter(skill => skill.teacherId === userId);

    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Discover Skills</h1>
          <button
            onClick={onOfferSkill}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium"
          >
            Offer New Skill
          </button>
        </div>

        {mySkills.length > 0 && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">My Skills Offered ({mySkills.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mySkills.map(skill => (
                <div key={skill.id} className="border border-blue-200 rounded-lg p-3 bg-white">
                  <h4 className="font-medium text-blue-900">{skill.title}</h4>
                  <p className="text-sm text-gray-600 truncate">{skill.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {skills.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">No skills available yet</div>
            <button
              onClick={onOfferSkill}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md font-medium"
            >
              Be the first to offer a skill!
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.filter(skill => skill.teacherId !== userId).map(skill => (
              <div
                key={skill.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => onSelectSkill(skill)}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{skill.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-3">{skill.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">by {skill.teacherName || 'Anonymous'}</span>
                  <button className="text-blue-500 hover:text-blue-600 font-medium text-sm">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // SkillDetail Component
  const SkillDetail = ({ skill, onRequestLesson, userId }) => {
    const isOwner = skill.teacherId === userId;

    return (
      <div>
        <button
          onClick={() => setPage('list')}
          className="mb-4 text-blue-500 hover:text-blue-600 flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Skills
        </button>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{skill.title}</h1>

          <div className="flex items-center text-gray-600 mb-6">
            <span className="font-medium">Teacher: {skill.teacherName || 'Anonymous'}</span>
            {skill.category && (
              <>
                <span className="mx-2">•</span>
                <span className="bg-gray-100 px-2 py-1 rounded text-sm">{skill.category}</span>
              </>
            )}
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">About this skill</h2>
            <p className="text-gray-700 leading-relaxed">{skill.description}</p>
          </div>

          {!isOwner ? (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Request a Lesson</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={requestForm.studentName}
                    onChange={(e) => setRequestForm({...requestForm, studentName: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message (optional)
                  </label>
                  <textarea
                    value={requestForm.message}
                    onChange={(e) => setRequestForm({...requestForm, message: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Tell the teacher what you'd like to learn..."
                  />
                </div>
                <button
                  onClick={() => onRequestLesson(skill)}
                  disabled={!requestForm.studentName.trim()}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-md font-medium"
                >
                  Request Lesson
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t pt-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">This is your skill listing</h3>
                <p className="text-yellow-700 text-sm">
                  You can view requests for this skill in your Dashboard.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Dashboard Component
  const Dashboard = ({ userRequests, skills, userId }) => {
    const mySkills = skills.filter(skill => skill.teacherId === userId);
    const myIncomingRequests = userRequests; // Currently limited by Firestore rules

    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Requests (As Student) */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">My Requests (As Student)</h2>
            {myIncomingRequests.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <div className="text-gray-500">You haven't requested any lessons yet</div>
                <button
                  onClick={() => setPage('list')}
                  className="mt-3 text-blue-500 hover:text-blue-600 font-medium"
                >
                  Discover Skills
                </button>
              </div>
            ) : (
              <div>
                {myIncomingRequests.map(request => (
                  <RequestItem key={request.id} request={request} isTeacher={false} />
                ))}
              </div>
            )}
          </div>

          {/* My Skills Offered */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">My Skills Offered</h2>
            {mySkills.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <div className="text-gray-500">You haven't offered any skills yet</div>
                <button
                  onClick={() => setShowNewSkillModal(true)}
                  className="mt-3 text-blue-500 hover:text-blue-600 font-medium"
                >
                  Offer Your First Skill
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {mySkills.map(skill => (
                  <div key={skill.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900">{skill.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{skill.description}</p>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        skill.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {skill.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Teacher Notice */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="font-semibold text-amber-900 mb-2">📝 Teacher Dashboard Notice</h3>
          <p className="text-amber-700 text-sm">
            Due to Firebase security rules, incoming lesson requests from other students are not automatically displayed here.
            For a production environment, implement cloud functions or server-side logic to properly handle teacher notifications.
          </p>
        </div>
      </div>
    );
  };

  // Handler functions
  const handleSelectSkill = (skill) => {
    setSelectedSkill(skill);
    setPage('detail');
  };

  const handleOfferSkill = () => {
    setShowNewSkillModal(true);
  };

  const handleCreateSkill = async () => {
    if (!newSkillForm.title.trim() || !newSkillForm.description.trim() || !newSkillForm.teacherName.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'skills'), {
        title: newSkillForm.title.trim(),
        description: newSkillForm.description.trim(),
        teacherId: userId,
        teacherName: newSkillForm.teacherName.trim(),
        category: newSkillForm.category.trim() || 'General',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setNewSkillForm({ title: '', description: '', category: '', teacherName: '' });
      setShowNewSkillModal(false);
      setError(null);
    } catch (error) {
      console.error('Error creating skill:', error);
      setError('Failed to create skill. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestLesson = async (skill) => {
    if (!requestForm.studentName.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, 'artifacts', APP_ID, 'users', userId, 'requests'), {
        skillId: skill.id,
        skillTitle: skill.title,
        teacherId: skill.teacherId,
        teacherName: skill.teacherName || 'Anonymous',
        studentId: userId,
        studentName: requestForm.studentName.trim(),
        message: requestForm.message.trim() || '',
        status: 'Pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setRequestForm({ message: '', studentName: '' });
      setPage('dashboard');
      setError(null);
    } catch (error) {
      console.error('Error creating request:', error);
      setError('Failed to create request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Main render
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">SkillShare</h1>
              {isAuthReady && (
                <span className="ml-4 text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                  Connected
                </span>
              )}
            </div>

            {isAuthReady && (
              <div className="flex space-x-4">
                <button
                  onClick={() => setPage('list')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    page === 'list'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Discover Skills
                </button>
                <button
                  onClick={() => setPage('dashboard')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    page === 'dashboard'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  My Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {!isAuthReady && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Connecting to SkillShare...</p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-red-700 underline text-sm"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        {isAuthReady && !loading && (
          <>
            {page === 'list' && (
              <SkillList
                skills={skills}
                onSelectSkill={handleSelectSkill}
                onOfferSkill={handleOfferSkill}
                userId={userId}
              />
            )}

            {page === 'detail' && selectedSkill && (
              <SkillDetail
                skill={selectedSkill}
                onRequestLesson={handleRequestLesson}
                userId={userId}
              />
            )}

            {page === 'dashboard' && (
              <Dashboard
                userRequests={userRequests}
                skills={skills}
                userId={userId}
              />
            )}
          </>
        )}
      </main>

      {/* New Skill Modal */}
      <Modal
        isOpen={showNewSkillModal}
        onClose={() => setShowNewSkillModal(false)}
        title="Offer a New Skill"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Name *
            </label>
            <input
              type="text"
              value={newSkillForm.teacherName}
              onChange={(e) => setNewSkillForm({...newSkillForm, teacherName: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Skill Title *
            </label>
            <input
              type="text"
              value={newSkillForm.title}
              onChange={(e) => setNewSkillForm({...newSkillForm, title: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., JavaScript Programming"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={newSkillForm.description}
              onChange={(e) => setNewSkillForm({...newSkillForm, description: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Describe what you'll teach and what students will learn..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              type="text"
              value={newSkillForm.category}
              onChange={(e) => setNewSkillForm({...newSkillForm, category: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Programming, Design, Music"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleCreateSkill}
              disabled={loading}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-md font-medium"
            >
              {loading ? 'Creating...' : 'Offer Skill'}
            </button>
            <button
              onClick={() => setShowNewSkillModal(false)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Video Call Modal */}
      <Modal
        isOpen={showVideoCallModal}
        onClose={() => setShowVideoCallModal(false)}
        title="Video Call"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📹 Video Call Information</h3>
            <p className="text-blue-700 text-sm mb-3">
              This is a mock video call integration. In a production environment, this would connect to a real video service like Zoom, Google Meet, or a custom WebRTC solution.
            </p>
          </div>

          {selectedRequest && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Lesson Details:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><strong>Skill:</strong> {selectedRequest.skillTitle}</li>
                <li><strong>Student:</strong> {selectedRequest.studentName}</li>
                <li><strong>Teacher:</strong> {selectedRequest.teacherName}</li>
                <li><strong>Status:</strong> {selectedRequest.status}</li>
              </ul>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mock Video Call Link:
            </label>
            <div className="bg-white border border-gray-300 rounded-md p-3 font-mono text-sm">
              https://video-call.skillshare.com/meeting/{selectedRequest?.id || 'demo'}?t={Date.now()}
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-900 mb-2">⚠️ Important Notice</h3>
            <ul className="text-red-700 text-sm space-y-1">
              <li>• This is a demonstration link, not a real video call</li>
              <li>• In production, integrate with actual video services</li>
              <li>• Always verify user identity before video calls</li>
              <li>• Consider screen recording for lesson documentation</li>
            </ul>
          </div>

          <button
            onClick={() => setShowVideoCallModal(false)}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default SkillShareApp;
import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Navigation from './components/Navigation';
import AuthModal from './components/AuthModal';
import Feed from './components/Feed';
import PostCreator from './components/PostCreator';
import UserProfile from './components/UserProfile';
import ChatSection from './components/ChatSection';
import ChatView from './components/ChatView';
import BottomNav from './components/BottomNav';
import './App.css';

// Mock initial data
const defaultSpheres = [
  { name: 'AI', color: '#A78BFA' },
  { name: 'Web Dev', color: '#22D3EE' },
  { name: 'Finance', color: '#34D399' }
];

const initialPosts = [
  {
    id: 1,
    author: 'Alex',
    domain: 'AI',
    body: 'The new reasoning models are incredible!',
    time: '2h ago',
    likes: 24,
    commentsList: [
      { id: 1, author: 'Sam', text: 'Totally agree, the logic is much tighter.' },
      { id: 2, author: 'Jordan', text: 'Have you tried the vision integration yet?' }
    ],
    media: [
      { url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800', type: 'image/jpeg', name: 'ai-gen.jpg' }
    ]
  },
  {
    id: 2,
    author: 'Sam',
    domain: 'Web Dev',
    body: 'Just updated my React prototype to use Vite and Framer Motion.',
    time: '4h ago',
    likes: 12,
    commentsList: [
      { id: 1, author: 'Alex', text: 'Framer Motion is a game changer for UX.' }
    ]
  },
  {
    id: 3,
    author: 'Jordan',
    domain: 'Finance',
    body: 'Analyzing Q1 reports. Check the attached summary.',
    time: '5h ago',
    likes: 8,
    commentsList: [
      { id: 1, author: 'Sarah', text: 'Thanks for the deep dive!' }
    ],
    media: [
      { url: '#', type: 'application/pdf', name: 'q1-report.pdf' }
    ]
  },
  {
    id: 4,
    author: 'Luna',
    domain: 'Gaming',
    body: 'Just finished the secret quest in Elder’s Reach. The world design is breathtaking!',
    time: '6h ago',
    likes: 42,
    commentsList: [
      { id: 1, author: 'Samurai', text: 'That final boss was intense though.' },
      { id: 2, author: 'GamerX', text: 'Hidden gems everywhere in that map.' }
    ]
  },
  {
    id: 5,
    author: 'Nova',
    domain: 'Space',
    body: 'Received fresh telemetric data from the station. The nebula resonance is higher than expected. ✨',
    time: '12h ago',
    likes: 156,
    commentsList: [
      { id: 1, author: 'Astro', text: 'Stunning data. Is the station stable?' }
    ],
    media: [
      { url: 'file:///C:/Users/thvs1/.gemini/antigravity/brain/3220076b-d68e-41e0-823d-fb97dec8ba10/space_nebula_demo_1772566967303.png', type: 'image/png', name: 'nebula-echo.png' }
    ]
  },
];

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('feed'); // 'feed', 'profile', 'chat'
  const [userBio, setUserBio] = useState('New explorer in the InterestSphere');
  const [subscribedSpheres, setSubscribedSpheres] = useState(defaultSpheres);
  const [activatedSpheres, setActivatedSpheres] = useState(defaultSpheres);
  const [posts, setPosts] = useState(initialPosts);
  const [searchQuery, setSearchQuery] = useState('');

  // Theme Logic
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('is-theme') || 'dark';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('is-theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const filteredPostsForFeed = posts.filter(post => {
    const query = searchQuery.toLowerCase();
    return (
      post.author.toLowerCase().includes(query) ||
      post.domain.toLowerCase().includes(query) ||
      post.body.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          // Fetch user preferences from Firestore
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setSubscribedSpheres(userData.spheres || defaultSpheres);
            setActivatedSpheres(userData.spheres || defaultSpheres);
            setUserBio(userData.bio || 'AI Researcher & Finance Enthusiast');
          }
          setUser(currentUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Initialization error:", error);
        setUser(currentUser); // Still set user if auth worked but firestore failed
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handlePostCreated = (newPost) => {
    setPosts([{ ...newPost, id: Date.now(), author: user?.displayName || 'Anonymous' }, ...posts]);
  };

  const handleToggleActivation = (sphere) => {
    const isActive = activatedSpheres.some(s => s.name === sphere.name);
    if (isActive) {
      setActivatedSpheres(activatedSpheres.filter(s => s.name !== sphere.name));
    } else {
      setActivatedSpheres([...activatedSpheres, sphere]);
    }
  };

  const handleCreateSphere = (newSphere) => {
    setSubscribedSpheres([...subscribedSpheres, newSphere]);
    setActivatedSpheres([...activatedSpheres, newSphere]);
  };

  if (loading) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--accent-cyan)', fontSize: '1.2rem' }}>Initializing InterestSphere...</div>
      </div>
    );
  }

  return (
    <div className="app-container" data-theme={theme}>
      {!user && <AuthModal />}

      <Navigation
        currentView={currentView}
        setView={setCurrentView}
        user={user}
        theme={theme}
        toggleTheme={toggleTheme}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <main className="main-content">
        {currentView === 'profile' && (
          <UserProfile
            user={user}
            subscribedSpheres={subscribedSpheres}
            activatedSpheres={activatedSpheres}
            onToggleActivation={handleToggleActivation}
            onCreateSphere={handleCreateSphere}
            onUpdateSpheres={setSubscribedSpheres}
            bio={userBio}
            onUpdateBio={setUserBio}
          />
        )}

        {currentView === 'chat' && (
          <ChatView user={user} spheres={subscribedSpheres} />
        )}

        {currentView === 'global' && (
          <section className="feed-container">
            <ChatSection user={user} fullView={true} />
          </section>
        )}

        {currentView === 'feed' && (
          <section className="feed-container">
            <PostCreator
              availableDomains={subscribedSpheres.map(s => s.name)}
              onPost={handlePostCreated}
            />
            <Feed
              posts={filteredPostsForFeed}
              activatedSpheres={activatedSpheres}
            />
          </section>
        )}
      </main>

      {currentView !== 'chat' && <ChatSection user={user} />}
      <BottomNav currentView={currentView} setView={setCurrentView} />
    </div>
  );
}

export default App;

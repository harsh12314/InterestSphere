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
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-primary text-xl font-bold font-headline animate-pulse">Initializing InterestSphere...</div>
      </div>
    );
  }

  const handleMouseMove = (e) => {
    const { currentTarget, clientX, clientY } = e;
    const { left, top } = currentTarget.getBoundingClientRect();
    currentTarget.style.setProperty('--mouse-x', `${clientX - left}px`);
    currentTarget.style.setProperty('--mouse-y', `${clientY - top}px`);
  };

  return (
    <div 
      className="bg-background min-h-screen text-on-surface overflow-hidden relative group"
      onMouseMove={handleMouseMove}
    >
      <div 
          className="pointer-events-none fixed inset-0 z-[1] transition duration-300 opacity-0 group-hover:opacity-100"
          style={{
              background: 'radial-gradient(800px circle at var(--mouse-x) var(--mouse-y), rgba(244, 114, 182, 0.08), transparent 40%)'
          }}
      />

      {/* Ambient Background Glows */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-primary/10 blur-[150px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-yellow-500/5 blur-[120px]"></div>
      </div>
      
      {!user && <AuthModal />}

      {/* Top Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-8 py-4 bg-[#0f0c1b]/80 backdrop-blur-xl shadow-[0_0_40px_rgba(208,149,255,0.1)]">
        <div className="text-2xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-[#d095ff] to-[#c782ff] font-headline">
          InterestSphere
        </div>
        <div className="flex items-center gap-6">
          <div className="relative flex items-center bg-surface-container-low rounded-full px-4 py-2 border border-outline-variant/20 focus-within:border-primary transition-all hidden md:flex">
            <span className="material-symbols-outlined text-outline-variant mr-2">search</span>
            <input 
              className="bg-transparent border-none focus:ring-0 text-sm w-64 placeholder:text-outline-variant outline-none" 
              placeholder="Explore the cosmos..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="material-symbols-outlined hover:text-[#d095ff] cursor-pointer transition-colors">notifications</span>
            <span className="material-symbols-outlined hover:text-[#d095ff] cursor-pointer transition-colors" onClick={toggleTheme}>settings</span>
            {user && (
              <img alt="User profile" className="w-10 h-10 rounded-full border-2 border-primary/30 object-cover" src={user.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuDUoostPb_wO5NUdhLmsRiUn_-YSsdiVCTNC8A71_c9910Im2F1ksKPWZDTFcmZtrR_Bcd0yNQ9vWex1Ifg0QBDEZbRLr8ubKyiuMVAbvv29ocF2ETJ4zmadXGVQWsbdFzpReLssYLFtvordEaEgXb2yQR_keWRKwt64APhODsc2MKByuttwRbMNpaKtMUphhb638itPjKPCdMhOsn2_b2GwzF9qQnBDumzEZtverTuefNmLXQCx5sStVBVZF-yQnz7ab-689jqW9Y"}/>
            )}
          </div>
        </div>
      </header>

      <div className="flex h-screen pt-20">
        {/* Left Navigation Sidebar */}
        <Navigation currentView={currentView} setView={setCurrentView} user={user} />

        {/* Central Content Area */}
        <main className="flex-1 md:ml-64 lg:mr-80 overflow-y-auto px-4 md:px-12 py-8 bg-surface">
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
            <ChatSection user={user} fullView={true} />
          )}

          {currentView === 'feed' && (
            <>
              <section className="mb-12">
                <h1 className="text-5xl font-headline font-extrabold tracking-tighter text-on-surface mb-2">InterestSphere feed</h1>
                <p className="text-on-surface-variant/70 text-lg">Your gateway to the local cluster of interests.</p>
              </section>
              
              <PostCreator
                availableDomains={subscribedSpheres.map(s => s.name)}
                onPost={handlePostCreated}
              />
              <Feed
                posts={filteredPostsForFeed}
                activatedSpheres={activatedSpheres}
              />
            </>
          )}
        </main>

        {/* Right Sidebar (Desktop only) */}
        <aside className="hidden lg:flex fixed right-0 top-0 h-full pt-24 w-80 bg-surface-container-low/50 backdrop-blur-md px-6 flex-col gap-8 z-40 border-l border-outline-variant/10">
          <section>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline font-extrabold text-sm uppercase tracking-widest text-primary">Trending Spheres</h3>
              <span className="material-symbols-outlined text-outline-variant text-sm">trending_up</span>
            </div>
            <div className="space-y-4">
              {subscribedSpheres.map((s, i) => (
                <div key={s.name} className="group cursor-pointer">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-on-surface group-hover:text-primary transition-colors">#{s.name.toUpperCase()}</span>
                    <span className="text-[10px] text-outline-variant">Active</span>
                  </div>
                  <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${80 - (i * 15)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline font-extrabold text-sm uppercase tracking-widest text-primary">Active Pilots</h3>
              <span className="text-[10px] bg-secondary-container/20 text-secondary px-2 py-0.5 rounded-full font-bold">42 ONLINE</span>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img alt="User" className="w-10 h-10 rounded-full object-cover border border-outline-variant/30" src="https://lh3.googleusercontent.com/aida-public/AB6AXuACTeMGwzphBbgrYKTnzLR_bohdWojnDTeunAdkAiqkV0WHJ37VGnzC4AQQYs8RYVZEPO7-kDlyq2xWl2pOo7K7Q9kvuMOhyCLlmWpYsVutu20btH_WyCX_AWYjf19OXY-i4CIjDZzbTBb-QsAfNFUmFtLAeWGYzWtAVj6Yh1xAcyIfqyrcwBQIe_BYifPa0Zj0ugDjUFY5hWZH7AiLhiGoVhlGVBodJjaD_RyoTa4Y-_PBu6IT2BkVw5Z05Ovj5E8cH-Doa8NbdEE"/>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background"></div>
                  </div>
                  <div>
                    <div className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">Nova_Scribe</div>
                    <div className="text-[10px] text-outline-variant">Designing Nebula</div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline-variant text-sm">more_horiz</span>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <div className="md:hidden">
        <BottomNav currentView={currentView} setView={setCurrentView} />
      </div>
    </div>
  );
}

export default App;

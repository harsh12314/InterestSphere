import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
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
    authorId: 'mock_alex',
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
    authorId: 'mock_sam',
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
    authorId: 'mock_jordan',
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
    authorId: 'mock_luna',
    domain: 'Gaming',
    body: 'Just finished the secret quest in Elder\u2019s Reach. The world design is breathtaking!',
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
    authorId: 'mock_nova',
    domain: 'Space',
    body: 'Received fresh telemetric data from the station. The nebula resonance is higher than expected. \u2728',
    time: '12h ago',
    likes: 156,
    commentsList: [
      { id: 1, author: 'Astro', text: 'Stunning data. Is the station stable?' }
    ]
  },
];

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('feed'); // 'feed', 'profile', 'chat', 'viewProfile'
  const [userBio, setUserBio] = useState('New explorer in the InterestSphere');
  const [subscribedSpheres, setSubscribedSpheres] = useState(defaultSpheres);
  const [activatedSpheres, setActivatedSpheres] = useState(defaultSpheres);
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Follow system state
  const [currentUserData, setCurrentUserData] = useState(null);
  const [viewingUserId, setViewingUserId] = useState(null);

  // User Search state
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [showUserSearch, setShowUserSearch] = useState(false);

  // Direct message state
  const [directChatUser, setDirectChatUser] = useState(null);

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

  // Feed filtering: prioritize posts from followed users + active domains
  const filteredPostsForFeed = (() => {
    const queryStr = searchQuery.toLowerCase();
    const filtered = posts.filter(post =>
      post.author.toLowerCase().includes(queryStr) ||
      post.domain.toLowerCase().includes(queryStr) ||
      post.body.toLowerCase().includes(queryStr)
    );

    const followingList = currentUserData?.following || [];
    const activeDomains = activatedSpheres.map(s => s.name.trim().toLowerCase());

    // Sort: followed users first, then matching domain, then others
    return filtered.sort((a, b) => {
      const aFollowed = followingList.includes(a.authorId) ? 2 : 0;
      const bFollowed = followingList.includes(b.authorId) ? 2 : 0;
      const aDomain = activeDomains.includes(a.domain?.trim().toLowerCase()) ? 1 : 0;
      const bDomain = activeDomains.includes(b.domain?.trim().toLowerCase()) ? 1 : 0;
      return (bFollowed + bDomain) - (aFollowed + aDomain);
    });
  })();

  // Real-time listener for posts
  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => {
        const data = doc.data();
        let timeString = 'Just now';
        if (data.createdAt) {
          const diffMs = Date.now() - data.createdAt.toMillis();
          const diffMins = Math.floor(diffMs / 60000);
          if (diffMins < 60) timeString = `${diffMins || 1}m ago`;
          else if (diffMins < 1440) timeString = `${Math.floor(diffMins / 60)}h ago`;
          else timeString = new Date(data.createdAt.toMillis()).toLocaleDateString();
        }
        return { id: doc.id, ...data, time: timeString };
      });
      setPosts(fetchedPosts);
    });
    return () => unsub();
  }, []);

  // Auth state + Firestore user data listener
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
            setCurrentUserData({ uid: currentUser.uid, ...userData });
          } else {
            setCurrentUserData({ uid: currentUser.uid, following: [], followers: [] });
          }
          setUser(currentUser);
        } else {
          setUser(null);
          setCurrentUserData(null);
        }
      } catch (error) {
        console.error("Initialization error:", error);
        setUser(currentUser);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time listener for currentUserData (following/followers updates)
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCurrentUserData(prev => ({ ...prev, ...data, uid: user.uid }));
      }
    });
    return () => unsub();
  }, [user]);

  // User search with debounce
  useEffect(() => {
    if (!userSearchQuery.trim() || userSearchQuery.trim().length < 2) {
      setUserSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        const q = userSearchQuery.toLowerCase();
        const results = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(u =>
            u.id !== user?.uid &&
            (u.username?.toLowerCase().includes(q) ||
             u.displayName?.toLowerCase().includes(q))
          )
          .slice(0, 8);
        setUserSearchResults(results);
      } catch (err) {
        console.error("User search error:", err);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [userSearchQuery, user]);

  const handleViewProfile = (userId) => {
    setViewingUserId(userId);
    setCurrentView('viewProfile');
    setShowUserSearch(false);
    setUserSearchQuery('');
    setUserSearchResults([]);
  };

  const handleDirectMessage = (targetUser) => {
    setDirectChatUser(targetUser);
    setCurrentView('chat');
  };

  const handlePostCreated = async (newPost) => {
    try {
      await addDoc(collection(db, 'posts'), {
        ...newPost,
        author: user?.displayName || 'Anonymous',
        authorId: user?.uid,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error creating post:", error);
    }
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
          {/* User Search */}
          <div className="relative hidden md:block">
            <div className="relative flex items-center bg-surface-container-low rounded-full px-4 py-2 border border-outline-variant/20 focus-within:border-primary transition-all">
              <span className="material-symbols-outlined text-outline-variant mr-2">search</span>
              <input 
                className="bg-transparent border-none focus:ring-0 text-sm w-64 placeholder:text-outline-variant outline-none" 
                placeholder="Search users or posts..." 
                value={showUserSearch ? userSearchQuery : searchQuery}
                onChange={(e) => {
                  if (showUserSearch) {
                    setUserSearchQuery(e.target.value);
                  } else {
                    setSearchQuery(e.target.value);
                  }
                }}
                onFocus={() => setShowUserSearch(true)}
                onBlur={() => setTimeout(() => setShowUserSearch(false), 200)}
              />
              {showUserSearch && (
                <button 
                  className="text-xs text-pink-400 font-bold ml-2 hover:text-pink-300 transition-colors"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setShowUserSearch(false);
                    setUserSearchQuery('');
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
            
            {/* Search Results Dropdown */}
            {showUserSearch && userSearchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container border border-outline-variant/20 rounded-2xl shadow-2xl overflow-hidden z-[100] backdrop-blur-xl">
                {userSearchResults.map((u, i) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 p-3 hover:bg-primary/10 cursor-pointer transition-colors border-b border-outline-variant/10 last:border-0"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleViewProfile(u.id);
                    }}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface font-bold text-sm shadow-inner flex-shrink-0" style={{ backgroundColor: `hsl(${i * 60}, 70%, 20%)`, border: `1px solid hsl(${i * 60}, 70%, 50%)` }}>
                      {u.photoURL ? (
                        <img src={u.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        u.displayName?.charAt(0) || u.email?.charAt(0)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-on-surface truncate">{u.displayName || 'Anonymous'}</div>
                      <div className="text-xs text-outline-variant truncate">@{u.username || 'user'}</div>
                    </div>
                    <span className="material-symbols-outlined text-outline-variant text-sm">arrow_forward</span>
                  </div>
                ))}
              </div>
            )}

            {showUserSearch && userSearchQuery.length >= 2 && userSearchResults.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container border border-outline-variant/20 rounded-2xl shadow-2xl p-4 text-center text-outline-variant text-sm z-[100]">
                No users found matching &quot;{userSearchQuery}&quot;
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span className="material-symbols-outlined hover:text-[#d095ff] cursor-pointer transition-colors">notifications</span>
            <span className="material-symbols-outlined hover:text-[#d095ff] cursor-pointer transition-colors" onClick={toggleTheme}>settings</span>
            {user && (
              <img alt="User profile" className="w-10 h-10 rounded-full border-2 border-primary/30 object-cover cursor-pointer" src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'U'}&background=272339&color=d095ff`} onClick={() => { setCurrentView('profile'); setViewingUserId(null); }} />
            )}
          </div>
        </div>
      </header>

      <div className="flex h-screen pt-20">
        {/* Left Navigation Sidebar */}
        <Navigation currentView={currentView} setView={(v) => { setCurrentView(v); if (v === 'profile') setViewingUserId(null); if (v !== 'chat') setDirectChatUser(null); }} user={user} />

        {/* Central Content Area */}
        <main className="flex-1 md:ml-64 lg:mr-80 overflow-y-auto px-4 md:px-12 py-8 bg-surface">
          {currentView === 'profile' && (
            <UserProfile
              user={user}
              currentUserData={currentUserData}
              subscribedSpheres={subscribedSpheres}
              activatedSpheres={activatedSpheres}
              onToggleActivation={handleToggleActivation}
              onCreateSphere={handleCreateSphere}
              onUpdateSpheres={setSubscribedSpheres}
              bio={userBio}
              onUpdateBio={setUserBio}
              onViewProfile={handleViewProfile}
            />
          )}

          {currentView === 'viewProfile' && viewingUserId && (
            <UserProfile
              user={user}
              currentUserData={currentUserData}
              viewingUserId={viewingUserId}
              onViewProfile={handleViewProfile}
              onBack={() => setCurrentView('feed')}
              onMessage={handleDirectMessage}
            />
          )}

          {currentView === 'chat' && (
            <ChatView user={user} spheres={subscribedSpheres} currentUserData={currentUserData} directChatUser={directChatUser} />
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
                onViewProfile={handleViewProfile}
                currentUserData={currentUserData}
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
              <h3 className="font-headline font-extrabold text-sm uppercase tracking-widest text-primary">Following</h3>
              <span className="text-[10px] bg-secondary-container/20 text-secondary px-2 py-0.5 rounded-full font-bold">{currentUserData?.following?.length || 0}</span>
            </div>
            <div className="space-y-3">
              {(!currentUserData?.following || currentUserData.following.length === 0) ? (
                <p className="text-outline-variant text-xs italic">You&apos;re not following anyone yet. Search and follow users to see them here.</p>
              ) : (
                <p className="text-outline-variant text-xs">Your followed users appear in feed priority.</p>
              )}
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

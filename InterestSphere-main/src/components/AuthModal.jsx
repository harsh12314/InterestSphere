import React, { useState } from 'react';
import { auth, googleProvider, db } from '../firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import logo from '../assets/logo.jpg';

const PREDEFINED_SPHERES = [
    { name: 'AI', color: '#A78BFA' },
    { name: 'Web Dev', color: '#22D3EE' },
    { name: 'Finance', color: '#34D399' },
    { name: 'Gaming', color: '#F472B6' },
    { name: 'Space', color: '#FBBF24' }
];

const AuthModal = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [step, setStep] = useState(1); // 1: Credentials, 2: Domain Selection
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [selectedSpheres, setSelectedSpheres] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const toggleSphere = (sphere) => {
        if (selectedSpheres.find(s => s.name === sphere.name)) {
            setSelectedSpheres(selectedSpheres.filter(s => s.name !== sphere.name));
        } else {
            setSelectedSpheres([...selectedSpheres, sphere]);
        }
    };

    const handleInitialAuth = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                setStep(2);
            }
        } catch (err) {
            setError(err.message.replace('Firebase:', ''));
        } finally {
            setLoading(false);
        }
    };

    const handleFinalSignup = async () => {
        if (selectedSpheres.length === 0) {
            setError('Please select at least one domain to construct your universe.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            // Validate username uniqueness
            const usernameClean = username.trim().toLowerCase();
            if (!usernameClean || usernameClean.length < 3) {
                setError('Username must be at least 3 characters.');
                setLoading(false);
                return;
            }
            if (!/^[a-z0-9_]+$/.test(usernameClean)) {
                setError('Username can only contain lowercase letters, numbers, and underscores.');
                setLoading(false);
                return;
            }
            const usernameQuery = query(collection(db, 'users'), where('username', '==', usernameClean));
            const usernameSnap = await getDocs(usernameQuery);
            if (!usernameSnap.empty) {
                setError('This username is already taken. Choose another.');
                setLoading(false);
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await updateProfile(user, { displayName: name });

            await setDoc(doc(db, 'users', user.uid), {
                displayName: name,
                username: usernameClean,
                email: email,
                spheres: selectedSpheres,
                bio: 'New explorer in the InterestSphere',
                followers: [],
                following: [],
                createdAt: new Date().toISOString()
            });

        } catch (err) {
            setError(err.message.replace('Firebase:', ''));
            setStep(1);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (!userDoc.exists()) {
                const autoUsername = (user.displayName || user.email.split('@')[0]).toLowerCase().replace(/[^a-z0-9_]/g, '_').substring(0, 20) + '_' + Date.now().toString(36);
                await setDoc(doc(db, 'users', user.uid), {
                    displayName: user.displayName,
                    username: autoUsername,
                    email: user.email,
                    spheres: PREDEFINED_SPHERES.slice(0, 3),
                    bio: 'New explorer in the InterestSphere',
                    followers: [],
                    following: [],
                    createdAt: new Date().toISOString()
                });
            }
        } catch (err) {
            setError(err.message.replace('Firebase:', ''));
        } finally {
            setLoading(false);
        }
    };

    const handleMouseMove = (e) => {
        const { currentTarget, clientX, clientY } = e;
        const { left, top } = currentTarget.getBoundingClientRect();
        currentTarget.style.setProperty('--mouse-x', `${clientX - left}px`);
        currentTarget.style.setProperty('--mouse-y', `${clientY - top}px`);
    };

    return (
        <div 
            className="fixed inset-0 z-[100] bg-background overflow-y-auto"
            onMouseMove={handleMouseMove}
        >
            {/* Interactive Pink Glow */}
            <div 
                className="pointer-events-none fixed inset-0 z-0 transition duration-300 opacity-0 group-hover:opacity-100"
                style={{
                    background: 'radial-gradient(800px circle at var(--mouse-x) var(--mouse-y), rgba(244, 114, 182, 0.12), transparent 40%)'
                }}
            />

            <div className="flex flex-col lg:flex-row min-h-full relative group">
                {/* Left Panel - Branding & Taglines */}
                <div className="hidden lg:flex flex-1 flex-col justify-center p-8 lg:p-16 relative z-10 border-r border-outline-variant/10 bg-surface/30 backdrop-blur-sm">
                    <div className="mx-auto max-w-xl w-full py-12">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-16 h-16 bg-primary-container rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(208,149,255,0.4)] overflow-hidden">
                            <img src={logo} alt="InterestSphere Logo" className="w-full h-full object-cover" />
                        </div>
                        <h1 className="text-4xl font-headline font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary-fixed">InterestSphere</h1>
                    </div>
                    
                    <h2 className="text-5xl font-headline font-bold text-on-surface leading-tight mb-6">
                        Discover What <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-primary">Drives You.</span>
                    </h2>
                    
                    <div className="space-y-8 mt-12">
                        {/* Section 1 */}
                        <div className="bg-surface-container/50 p-6 rounded-2xl border border-outline-variant/20 shadow-lg backdrop-blur-md transition-all hover:border-pink-400/30 hover:bg-surface-container">
                            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-3">
                                <span>🚀</span> Clean & Powerful
                            </h3>
                            <ul className="space-y-2 text-outline-variant font-medium">
                                <li className="flex items-start gap-2"><span className="text-primary">•</span> Where Interests Become Identity.</li>
                                <li className="flex items-start gap-2"><span className="text-primary">•</span> Your Domain. Your People. Your Growth.</li>
                                <li className="flex items-start gap-2"><span className="text-primary">•</span> Find Your Circle. Build Your Sphere.</li>
                            </ul>
                        </div>

                        {/* Section 2 */}
                        <div className="bg-surface-container/50 p-6 rounded-2xl border border-outline-variant/20 shadow-lg backdrop-blur-md transition-all hover:border-pink-400/30 hover:bg-surface-container">
                            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-3">
                                <span>🌍</span> Community-Focused
                            </h3>
                            <ul className="space-y-2 text-outline-variant font-medium">
                                <li className="flex items-start gap-2"><span className="text-primary">•</span> Connect Through What You Love.</li>
                                <li className="flex items-start gap-2"><span className="text-primary">•</span> Shared Interests. Stronger Connections.</li>
                                <li className="flex items-start gap-2"><span className="text-primary">•</span> Communities Built Around Passion.</li>
                            </ul>
                        </div>

                        {/* Section 3 */}
                        <div className="bg-surface-container/50 p-6 rounded-2xl border border-outline-variant/20 shadow-lg backdrop-blur-md transition-all hover:border-pink-400/30 hover:bg-surface-container">
                            <h3 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-3">
                                <span>🔐</span> Domain + Custom Access
                            </h3>
                            <ul className="space-y-2 text-outline-variant font-medium">
                                <li className="flex items-start gap-2"><span className="text-primary">•</span> Public Passion. Private Circles.</li>
                                <li className="flex items-start gap-2"><span className="text-primary">•</span> Choose Your Domain. Own Your Space.</li>
                                <li className="flex items-start gap-2"><span className="text-primary">•</span> Exclusive by Code. United by Interest.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

                {/* Right Panel - Auth Form */}
                <div className="flex-1 flex justify-center items-center p-6 lg:p-12 relative z-10">
                    <div className={`glass-panel w-full max-w-md p-8 rounded-[2rem] shadow-2xl relative overflow-hidden transition-all duration-500 bg-surface/80 border border-outline-variant/30 ${step === 2 ? 'max-w-lg' : ''}`}>
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-400 to-primary"></div>
                    
                    <div className="lg:hidden text-center mb-8">
                        <div className="w-16 h-16 mx-auto bg-primary-container rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(208,149,255,0.4)] overflow-hidden">
                            <img src={logo} alt="InterestSphere Logo" className="w-full h-full object-cover" />
                        </div>
                        <h2 className="text-3xl font-headline font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary-fixed">InterestSphere</h2>
                    </div>

                    {step === 1 ? (
                        <div className="animate-in fade-in zoom-in duration-300">
                            <div className="text-center mb-8">
                                <h3 className="text-2xl font-headline font-bold text-on-surface">{isLogin ? 'Welcome Back' : 'Join the Observatory'}</h3>
                                <p className="text-outline-variant text-sm mt-2">{isLogin ? 'Secure entry to your domain universes' : 'Phase 1: Establish your identity'}</p>
                            </div>

                            {error && <div className="mb-4 p-3 rounded-xl bg-error-container/20 border border-error/50 text-error text-sm text-center font-bold">{error}</div>}

                            <form onSubmit={handleInitialAuth} className="space-y-5">
                                {!isLogin && (
                                    <>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-outline-variant mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            className="w-full bg-surface-container rounded-xl px-4 py-3 text-on-surface border border-outline-variant/20 focus:border-pink-400 focus:ring-1 focus:ring-pink-400 outline-none transition-all"
                                            placeholder="Nova Scribe"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-outline-variant mb-2">Username</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant text-sm">@</span>
                                            <input
                                                type="text"
                                                className="w-full bg-surface-container rounded-xl pl-8 pr-4 py-3 text-on-surface border border-outline-variant/20 focus:border-pink-400 focus:ring-1 focus:ring-pink-400 outline-none transition-all"
                                                placeholder="nova_scribe"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                                required
                                            />
                                        </div>
                                        <p className="text-[10px] text-outline-variant mt-1">Lowercase letters, numbers, underscores only</p>
                                    </div>
                                    </>
                                )}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-outline-variant mb-2">Email Access</label>
                                    <input
                                        type="email"
                                        className="w-full bg-surface-container rounded-xl px-4 py-3 text-on-surface border border-outline-variant/20 focus:border-pink-400 focus:ring-1 focus:ring-pink-400 outline-none transition-all"
                                        placeholder="pilot@dsn.net"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-outline-variant mb-2">Master Password</label>
                                    <input
                                        type="password"
                                        className="w-full bg-surface-container rounded-xl px-4 py-3 text-on-surface border border-outline-variant/20 focus:border-pink-400 focus:ring-1 focus:ring-pink-400 outline-none transition-all"
                                        placeholder="•••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                <button type="submit" className="w-full py-4 mt-2 bg-gradient-to-br from-pink-500 to-primary text-white rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(244,114,182,0.4)] hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-70 disabled:hover:scale-100" disabled={loading}>
                                    {loading ? 'Processing...' : (isLogin ? 'Authenticate' : 'Next Phase')}
                                </button>
                            </form>

                            {isLogin && (
                                <>
                                    <div className="flex items-center gap-4 my-6">
                                        <div className="h-px bg-outline-variant/20 flex-1"></div>
                                        <span className="text-xs font-bold uppercase text-outline-variant tracking-widest">Or</span>
                                        <div className="h-px bg-outline-variant/20 flex-1"></div>
                                    </div>

                                    <button 
                                        className="w-full py-3 flex items-center justify-center gap-3 border border-outline-variant/20 bg-surface-container hover:bg-surface-container-high rounded-xl text-on-surface font-bold transition-colors disabled:opacity-70 shadow-sm" 
                                        onClick={handleGoogleSignIn} 
                                        disabled={loading}
                                    >
                                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                                        Continue with Google
                                    </button>
                                </>
                            )}

                            <div className="mt-8 pt-6 border-t border-outline-variant/10 text-center">
                                <p className="text-sm text-outline-variant">
                                    {isLogin ? "Don't have an account?" : "Already established?"}
                                </p>
                                <button 
                                    className="mt-2 px-6 py-2 border-2 border-primary/30 text-primary hover:bg-primary/10 rounded-full font-bold text-sm transition-colors"
                                    onClick={() => setIsLogin(!isLogin)}
                                >
                                    {isLogin ? "Request Access (Sign Up)" : "Login"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-right duration-300">
                            <div className="text-center mb-8">
                                <h3 className="text-xl font-bold text-on-surface">Choose Your Domains</h3>
                                <p className="text-outline-variant text-sm mt-1">Phase 2: Construct your initial feed universe</p>
                            </div>

                            {error && <div className="mb-4 p-3 rounded-xl bg-error-container/20 border border-error/50 text-error text-sm text-center font-bold">{error}</div>}

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                                {PREDEFINED_SPHERES.map(sphere => {
                                    const isSelected = selectedSpheres.find(s => s.name === sphere.name);
                                    return (
                                        <div
                                            key={sphere.name}
                                            className={`p-4 rounded-2xl cursor-pointer border-2 transition-all duration-300 flex flex-col items-center gap-2 ${isSelected ? 'border-pink-400 bg-pink-400/10 shadow-[0_0_15px_rgba(244,114,182,0.2)] scale-105' : 'border-outline-variant/20 bg-surface-container hover:border-outline-variant/50 hover:bg-surface-container-high'}`}
                                            onClick={() => toggleSphere(sphere)}
                                        >
                                            <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: sphere.color, boxShadow: `0 0 10px ${sphere.color}` }}></div>
                                            <span className="font-bold text-sm text-on-surface">{sphere.name}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    className="flex-1 py-3 border border-outline-variant/20 rounded-xl text-on-surface font-bold hover:bg-surface-container transition-colors disabled:opacity-70" 
                                    onClick={() => setStep(1)} 
                                    disabled={loading}
                                >
                                    Back
                                </button>
                                <button 
                                    className="flex-[2] py-3 bg-gradient-to-br from-pink-500 to-primary text-white rounded-xl font-bold shadow-[0_0_20px_rgba(244,114,182,0.4)] hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-70 disabled:hover:scale-100" 
                                    onClick={handleFinalSignup} 
                                    disabled={loading}
                                >
                                    {loading ? 'Initializing...' : 'Construct Universe'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
        </div>
    );
};

export default AuthModal;

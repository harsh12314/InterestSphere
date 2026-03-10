import React, { useState } from 'react';
import { auth, googleProvider, db } from '../firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
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
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await updateProfile(user, { displayName: name });

            await setDoc(doc(db, 'users', user.uid), {
                displayName: name,
                email: email,
                spheres: selectedSpheres,
                bio: 'New explorer in the InterestSphere'
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
                await setDoc(doc(db, 'users', user.uid), {
                    displayName: user.displayName,
                    email: user.email,
                    spheres: PREDEFINED_SPHERES.slice(0, 3),
                    bio: 'New explorer in the InterestSphere'
                });
            }
        } catch (err) {
            setError(err.message.replace('Firebase:', ''));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-overlay">
            <div className="auth-modal glass-panel" style={{ maxWidth: step === 2 ? '500px' : '400px' }}>
                <div style={{ textAlign: 'center' }}>
                    <img src={logo} alt="InterestSphere Logo" className="auth-logo-img" />
                    <h2>InterestSphere</h2>
                </div>

                {step === 1 ? (
                    <>
                        <h3>{isLogin ? 'Welcome Back' : 'Join InterestSphere'}</h3>
                        <p>{isLogin ? 'Secure entry to your domain universes' : 'Phase 1: Establish your identity'}</p>

                        {error && <div className="auth-error">{error}</div>}

                        <form onSubmit={handleInitialAuth}>
                            {!isLogin && (
                                <div className="input-group">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="John Doe"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                            )}
                            <div className="input-group">
                                <label>Email Access</label>
                                <input
                                    type="email"
                                    className="input-field"
                                    placeholder="hacker@matrix.net"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label>Master Password</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    placeholder="•••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Processing...' : (isLogin ? 'Authenticate' : 'Next Step: Choose Spheres')}
                            </button>
                        </form>

                        {isLogin && (
                            <>
                                <div className="auth-divider">
                                    <span>OR</span>
                                </div>

                                <button className="btn-secondary" style={{ width: '100%', marginBottom: '1.5rem' }} onClick={handleGoogleSignIn} disabled={loading}>
                                    Continue with Google
                                </button>
                            </>
                        )}

                        <p className="auth-switch" onClick={() => setIsLogin(!isLogin)}>
                            {isLogin ? "Need an account? Sign up" : "Already established? Login"}
                        </p>
                    </>
                ) : (
                    <div className="animate-in">
                        <h3>Choose Your Domains</h3>
                        <p>Phase 2: Construct your initial feed universe</p>

                        {error && <div className="auth-error">{error}</div>}

                        <div className="signup-spheres-grid">
                            {PREDEFINED_SPHERES.map(sphere => {
                                const isSelected = selectedSpheres.find(s => s.name === sphere.name);
                                return (
                                    <div
                                        key={sphere.name}
                                        className={`signup-sphere-tile ${isSelected ? 'selected' : ''}`}
                                        onClick={() => toggleSphere(sphere)}
                                    >
                                        <div className="sphere-dot" style={{ backgroundColor: sphere.color }}></div>
                                        <span>{sphere.name}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginTop: '2rem' }}>
                            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(1)} disabled={loading}>
                                Back
                            </button>
                            <button className="btn-primary" style={{ flex: 2 }} onClick={handleFinalSignup} disabled={loading}>
                                {loading ? 'Initializing...' : 'Construct Universe'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthModal;

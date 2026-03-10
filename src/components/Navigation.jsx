import React from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import logo from '../assets/logo.jpg';

const Navigation = ({ currentView, setView, user, theme, toggleTheme, searchQuery, setSearchQuery }) => {
    const handleLogout = () => {
        signOut(auth);
        setView('feed');
    };
    return (
        <header className="top-nav">
            <div className="nav-content">
                <a
                    href="#"
                    className="logo"
                    onClick={(e) => { e.preventDefault(); setView('feed'); }}
                >
                    <img src={logo} alt="InterestSphere Logo" className="logo-img" /> InterestSphere
                </a>

                <div className="search-bar">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search across activated spheres..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div
                        className={`theme-toggle ${theme === 'light' ? 'rotate' : ''}`}
                        onClick={toggleTheme}
                        title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                        style={{ cursor: 'pointer', fontSize: '1.2rem', transition: 'transform 0.5s ease' }}
                    >
                        {theme === 'dark' ? '🌙' : '☀️'}
                    </div>

                    <div
                        className={`profile-icon ${currentView === 'feed' ? 'active' : ''}`}
                        title="Home Feed"
                        onClick={() => setView('feed')}
                        style={{ cursor: 'pointer', fontSize: '1.2rem', opacity: currentView === 'feed' ? 1 : 0.6 }}
                    >
                        🏠
                    </div>

                    <div
                        className={`profile-icon ${currentView === 'chat' ? 'active' : ''}`}
                        title="Sphere Messages"
                        onClick={() => setView('chat')}
                        style={{ cursor: 'pointer', fontSize: '1.2rem', opacity: currentView === 'chat' ? 1 : 0.6 }}
                    >
                        💬
                    </div>

                    <div
                        className="profile-icon"
                        title="Global Hub"
                        onClick={() => {
                            // Logic to open global chat widget if it was a view, 
                            // but here we'll just trigger the widget state if we can,
                            // or better, make it a dedicated view.
                            setView('global');
                        }}
                        style={{ cursor: 'pointer', fontSize: '1.2rem', opacity: currentView === 'global' ? 1 : 0.6 }}
                    >
                        🌐
                    </div>

                    <div className="profile-menu" onClick={() => setView(currentView === 'profile' ? 'feed' : 'profile')}>
                        <div
                            className="profile-icon"
                            title={currentView === 'profile' ? `Return to Feed (${user?.displayName || 'User'})` : "Manage Profile & Spheres"}
                            style={{ opacity: currentView === 'profile' ? 1 : 0.6 }}
                        >
                            👤
                        </div>
                    </div>

                    {user && (
                        <div
                            className="profile-icon"
                            title="Logout from InterestSphere"
                            onClick={handleLogout}
                            style={{ cursor: 'pointer', fontSize: '1.1rem', opacity: 0.6 }}
                        >
                            🚪
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navigation;

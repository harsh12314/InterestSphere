
import React from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import logo from '../assets/logo.jpg';

const Navigation = ({ currentView, setView, user }) => {
    const handleLogout = () => {
        signOut(auth);
        setView('feed');
    };

    const navItems = [
        { id: 'feed', icon: 'home_max', label: 'Feed' },
        { id: 'chat', icon: 'chat_bubble', label: 'Chat' },
        { id: 'global', icon: 'public', label: 'Global' },
        { id: 'profile', icon: 'account_circle', label: 'Profile' }
    ];

    return (
        <nav className="hidden md:flex fixed left-0 top-0 h-full pt-24 w-64 bg-[#141122] flex-col gap-2 z-40 border-r border-outline-variant/10">
            <div className="px-8 mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center overflow-hidden">
                        <img src={logo} alt="InterestSphere Logo" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <div className="font-headline font-bold text-sm tracking-tight text-on-surface">Observatory</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">Deep Space Network</div>
                    </div>
                </div>
            </div>

            {navItems.map((item) => {
                const isActive = currentView === item.id;
                return (
                    <a
                        key={item.id}
                        href="#"
                        onClick={(e) => { e.preventDefault(); setView(item.id); }}
                        className={`flex items-center gap-4 py-4 px-6 transition-all font-headline text-sm uppercase tracking-widest ${
                            isActive 
                            ? "bg-[#1b1729] text-[#d095ff] rounded-r-full border-l-4 border-[#d095ff] font-bold" 
                            : "text-slate-500 hover:text-slate-200 hover:translate-x-1 font-medium"
                        }`}
                    >
                        <span className="material-symbols-outlined">{item.icon}</span>
                        <span>{item.label}</span>
                    </a>
                );
            })}

            <div className="mt-auto p-6 flex flex-col gap-4">
                <button 
                    onClick={() => setView('feed')} // Temporary, maybe open create post modal later
                    className="w-full py-4 bg-gradient-to-br from-[#d095ff] to-[#c782ff] text-on-primary-container rounded-full font-bold shadow-[0_0_20px_rgba(208,149,255,0.3)] hover:scale-105 transition-transform active:scale-95"
                >
                    Create Post
                </button>
                
                {user && (
                    <button 
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 w-full py-3 border border-outline-variant/20 text-on-surface-variant hover:bg-error-container hover:text-on-error-container rounded-full font-bold text-xs transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">logout</span>
                        Logout
                    </button>
                )}
            </div>
        </nav>
    );
};

export default Navigation;

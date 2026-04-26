import React from 'react';

const BottomNav = ({ currentView, setView }) => {
  const navItems = [
    { id: 'feed', label: 'Feed', icon: 'home' },
    { id: 'chat', label: 'Chat', icon: 'chat' },
    { id: 'global', label: 'Global', icon: 'language' },
    { id: 'profile', label: 'Profile', icon: 'person' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-surface-container/80 backdrop-blur-md border-t border-outline-variant/10 px-4 pb-safe flex justify-around items-center h-[72px]">
      {navItems.map((item) => {
        const isActive = currentView === item.id;
        return (
          <div
            key={item.id}
            className={`flex flex-col items-center justify-center w-16 h-full gap-1 cursor-pointer transition-colors ${isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            onClick={() => setView(item.id)}
          >
            <div className={`relative flex items-center justify-center w-12 h-8 rounded-full transition-all duration-300 ${isActive ? 'bg-primary-container text-on-primary-container' : 'bg-transparent'}`}>
              <span className="material-symbols-outlined text-[24px]">
                {item.icon}
              </span>
              {isActive && (
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-[8px] -z-10"></div>
              )}
            </div>
            <span className={`text-[10px] font-bold ${isActive ? 'text-on-surface' : ''}`}>{item.label}</span>
          </div>
        );
      })}
    </nav>
  );
};

export default BottomNav;

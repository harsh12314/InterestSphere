import React, { useState, useRef } from 'react';
import { db, auth, storage } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';

const PREDEFINED_SPHERES = [
    { name: 'AI', color: '#A78BFA' },
    { name: 'Web Dev', color: '#22D3EE' },
    { name: 'Finance', color: '#34D399' },
    { name: 'Gaming', color: '#F472B6' },
    { name: 'Space', color: '#FBBF24' }
];

const UserProfile = ({ user, subscribedSpheres, activatedSpheres, onToggleActivation, onCreateSphere, onUpdateSpheres, bio, onUpdateBio }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [tempBio, setTempBio] = useState(bio);
    const [newSphereName, setNewSphereName] = useState('');
    const [selectedColor, setSelectedColor] = useState('#A78BFA');
    const [loading, setLoading] = useState(false);
    const [localPhotoURL, setLocalPhotoURL] = useState(user?.photoURL);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const fileInputRef = useRef(null);

    const colors = ['#A78BFA', '#22D3EE', '#F472B6', '#34D399', '#FBBF24'];

    const saveToFirestore = async (updates) => {
        if (!user) return;
        setLoading(true);
        try {
            await updateDoc(doc(db, 'users', user.uid), updates);
        } catch (err) {
            console.error("Firestore sync error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (newSphereName.trim()) {
            const newSphere = { name: newSphereName, color: selectedColor };
            const newSpheres = [...subscribedSpheres, newSphere];
            onUpdateSpheres(newSpheres);
            await saveToFirestore({ spheres: newSpheres });
            setIsCreating(false);
            setNewSphereName('');
        }
    };

    const handleToggleSphereSelection = async (sphere) => {
        let newSpheres;
        const exists = subscribedSpheres.find(s => s.name === sphere.name);
        if (exists) {
            newSpheres = subscribedSpheres.filter(s => s.name !== sphere.name);
        } else {
            newSpheres = [...subscribedSpheres, sphere];
        }
        onUpdateSpheres(newSpheres);
        await saveToFirestore({ spheres: newSpheres });
    };

    const handleSaveBio = async () => {
        onUpdateBio(tempBio);
        await saveToFirestore({ bio: tempBio });
        setIsEditingBio(false);
    };

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !user) return;

        setUploadingPhoto(true);
        try {
            const fileRef = ref(storage, `profile_pictures/${user.uid}_${Date.now()}`);
            await uploadBytes(fileRef, file);
            const photoURL = await getDownloadURL(fileRef);

            await updateProfile(auth.currentUser, { photoURL });
            await saveToFirestore({ photoURL });
            
            setLocalPhotoURL(photoURL);
        } catch (error) {
            console.error("Error uploading profile picture:", error);
            alert("Failed to upload image. Please try again.");
        } finally {
            setUploadingPhoto(false);
        }
    };

    const badges = [
        { id: 1, name: 'AI Expert', icon: '🤖', color: '#A78BFA' },
        { id: 2, name: 'Vite Architect', icon: '⚡', color: '#22D3EE' },
        { id: 3, name: 'Sphere Founder', icon: '🌐', color: '#34D399' }
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header Profile Section */}
            <div className="glass-panel p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                    <div 
                        className="relative w-32 h-32 rounded-[2rem] border-4 border-surface-variant overflow-hidden shadow-[0_0_30px_rgba(208,149,255,0.2)] flex-shrink-0 bg-surface-container flex items-center justify-center text-4xl cursor-pointer group/avatar"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {uploadingPhoto ? (
                            <span className="material-symbols-outlined animate-spin text-primary">sync</span>
                        ) : localPhotoURL ? (
                            <img src={localPhotoURL} alt="User" className="w-full h-full object-cover" />
                        ) : (
                            <span>{user?.displayName?.charAt(0) || user?.email?.charAt(0) || '👤'}</span>
                        )}
                        
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-3xl">add_a_photo</span>
                        </div>
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handlePhotoChange} 
                        />
                    </div>
                    <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div>
                                <h2 className="text-3xl font-headline font-extrabold text-on-surface mb-1">{user?.displayName || 'Obsidian Scholar'}</h2>
                                <div className="text-sm text-outline-variant font-bold uppercase tracking-widest">{user?.email}</div>
                            </div>
                            <div className="flex gap-2">
                                {badges.map(badge => (
                                    <div 
                                        key={badge.id}
                                        className="w-10 h-10 rounded-xl bg-surface-container border flex items-center justify-center shadow-lg"
                                        style={{ borderColor: `${badge.color}40` }}
                                        title={badge.name}
                                    >
                                        <span className="text-lg">{badge.icon}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-surface-container/50 p-6 rounded-2xl border border-outline-variant/10">
                            {isEditingBio ? (
                                <div className="flex flex-col gap-4">
                                    <textarea
                                        className="w-full bg-surface rounded-xl p-4 text-on-surface border border-outline-variant/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                                        value={tempBio}
                                        onChange={(e) => setTempBio(e.target.value)}
                                        rows={3}
                                        placeholder="Enter your professional bio..."
                                    />
                                    <div className="flex gap-3">
                                        <button className="px-6 py-2 bg-primary text-on-primary rounded-full font-bold text-sm shadow-lg hover:shadow-primary/30 transition-shadow disabled:opacity-50" onClick={handleSaveBio} disabled={loading}>
                                            {loading ? 'Saving...' : 'Save Transmit'}
                                        </button>
                                        <button className="px-6 py-2 border border-outline-variant/30 text-on-surface-variant rounded-full font-bold text-sm hover:bg-surface-variant transition-colors" onClick={() => setIsEditingBio(false)}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div onClick={() => setIsEditingBio(true)} className="cursor-pointer group/bio relative">
                                    <div className="absolute -inset-2 bg-surface-variant/0 group-hover/bio:bg-surface-variant/50 rounded-xl transition-colors -z-10"></div>
                                    <h4 className="text-xs font-bold uppercase text-outline-variant tracking-widest mb-2 flex items-center gap-2">
                                        <span>Professional Bio</span>
                                        <span className="material-symbols-outlined text-[14px] opacity-0 group-hover/bio:opacity-100 transition-opacity">edit</span>
                                    </h4>
                                    <p className="text-on-surface-variant leading-relaxed">{bio || "Describe your expertise in specific domains..."}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Domains Hub Section */}
            <div className="glass-panel p-8 rounded-[2rem] shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-outline-variant/10">
                    <div>
                        <h3 className="text-2xl font-headline font-bold text-on-surface">Domain Construction Hub</h3>
                        <p className="text-outline-variant text-sm mt-1">Manage your active spheres and construct new ones</p>
                    </div>
                    <button className="flex items-center gap-2 px-6 py-3 bg-surface-container border border-outline-variant/20 hover:border-primary/50 hover:bg-surface-container-high rounded-full text-sm font-bold text-on-surface transition-all" onClick={() => setIsCreating(true)}>
                        <span className="material-symbols-outlined text-[18px] text-primary">add_circle</span>
                        Define New Domain
                    </button>
                </div>

                <div className="mb-12">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-outline-variant mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">grid_view</span>
                        Predefined Universes
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {PREDEFINED_SPHERES.map(sphere => {
                            const isSubscribed = subscribedSpheres.find(s => s.name === sphere.name);
                            return (
                                <div
                                    key={sphere.name}
                                    className={`p-4 rounded-2xl cursor-pointer border-2 transition-all duration-300 flex flex-col items-center gap-3 ${isSubscribed ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(208,149,255,0.2)]' : 'border-outline-variant/10 bg-surface-container hover:border-outline-variant/30 hover:bg-surface-container-high'}`}
                                    onClick={() => handleToggleSphereSelection(sphere)}
                                >
                                    <div className="w-5 h-5 rounded-full shadow-lg" style={{ backgroundColor: sphere.color, boxShadow: `0 0 10px ${sphere.color}` }}></div>
                                    <span className="font-bold text-sm text-on-surface">{sphere.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-outline-variant mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">cell_tower</span>
                        Current Feed Actuators
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {subscribedSpheres.map(sphere => {
                            const isActive = activatedSpheres.some(s => s.name === sphere.name);
                            return (
                                <div
                                    key={sphere.name}
                                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${isActive ? 'bg-surface-variant border-primary/50 shadow-md' : 'bg-surface border-outline-variant/10 hover:border-outline-variant/30 opacity-70 hover:opacity-100'}`}
                                    onClick={() => onToggleActivation(sphere)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sphere.color || '#334155', boxShadow: isActive ? `0 0 10px ${sphere.color || '#334155'}` : 'none' }}></div>
                                        <span className="font-bold text-on-surface">#{sphere.name.toUpperCase()}</span>
                                    </div>
                                    <div className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${isActive ? 'text-primary border-primary/30 bg-primary/10' : 'text-outline-variant border-outline-variant/20 bg-surface-container'}`}>
                                        {isActive ? 'Transmitting' : 'Dormant'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Create Custom Sphere Modal */}
            {isCreating && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                    <div className="glass-panel w-full max-w-sm p-8 rounded-[2rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-primary"></div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-headline font-bold text-on-surface">Initialize Domain</h3>
                            <button onClick={() => setIsCreating(false)} className="text-outline-variant hover:text-on-surface transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-outline-variant mb-2">Domain Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-surface-container rounded-xl px-4 py-3 text-on-surface border border-outline-variant/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                    value={newSphereName}
                                    onChange={(e) => setNewSphereName(e.target.value)}
                                    placeholder="e.g. Quantum Mechanics"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-outline-variant mb-3">Aura Resonance (Color)</label>
                                <div className="flex gap-3 justify-between">
                                    {colors.map(color => (
                                        <div
                                            key={color}
                                            className={`w-10 h-10 rounded-full cursor-pointer transition-transform ${selectedColor === color ? 'scale-125 ring-2 ring-offset-2 ring-offset-background ring-primary' : 'hover:scale-110'}`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => setSelectedColor(color)}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button className="flex-1 py-3 border border-outline-variant/20 text-on-surface rounded-xl font-bold hover:bg-surface-container transition-colors" onClick={() => setIsCreating(false)}>Cancel</button>
                                <button className="flex-[2] py-3 bg-gradient-to-br from-primary to-primary-fixed text-on-primary rounded-xl font-bold shadow-lg disabled:opacity-50 hover:scale-[1.02] active:scale-95 transition-transform" onClick={handleCreate} disabled={loading || !newSphereName.trim()}>
                                    {loading ? 'Initializing...' : 'Construct Sphere'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;

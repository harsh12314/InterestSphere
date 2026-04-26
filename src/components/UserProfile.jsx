import React, { useState, useRef, useEffect } from 'react';
import { db, auth, storage } from '../firebase';
import { doc, updateDoc, getDoc, arrayUnion, arrayRemove, collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile, signOut } from 'firebase/auth';

const PREDEFINED_SPHERES = [
    { name: 'AI', color: '#A78BFA' },
    { name: 'Web Dev', color: '#22D3EE' },
    { name: 'Finance', color: '#34D399' },
    { name: 'Gaming', color: '#F472B6' },
    { name: 'Space', color: '#FBBF24' }
];

const UserProfile = ({ user, currentUserData, subscribedSpheres, activatedSpheres, onToggleActivation, onCreateSphere, onUpdateSpheres, bio, onUpdateBio, viewingUserId, onViewProfile, onBack, onMessage }) => {
    const isOwnProfile = !viewingUserId || viewingUserId === user?.uid;
    
    const [profileData, setProfileData] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('spheres'); // 'spheres', 'followers', 'following'
    const [followersList, setFollowersList] = useState([]);
    const [followingList, setFollowingList] = useState([]);
    const [listLoading, setListLoading] = useState(false);

    // Own profile states
    const [isCreating, setIsCreating] = useState(false);
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [tempBio, setTempBio] = useState(bio || '');
    const [newSphereName, setNewSphereName] = useState('');
    const [selectedColor, setSelectedColor] = useState('#A78BFA');
    const [loading, setLoading] = useState(false);
    const [localPhotoURL, setLocalPhotoURL] = useState(user?.photoURL);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const fileInputRef = useRef(null);
    const colors = ['#A78BFA', '#22D3EE', '#F472B6', '#34D399', '#FBBF24'];

    // Fetch other user's profile
    useEffect(() => {
        if (!isOwnProfile && viewingUserId) {
            setProfileLoading(true);
            getDoc(doc(db, 'users', viewingUserId)).then(snap => {
                if (snap.exists()) setProfileData({ uid: viewingUserId, ...snap.data() });
                setProfileLoading(false);
            });
        }
    }, [viewingUserId, isOwnProfile]);

    // Check follow status
    useEffect(() => {
        if (!isOwnProfile && viewingUserId && currentUserData?.following) {
            setIsFollowing(currentUserData.following.includes(viewingUserId));
        }
    }, [viewingUserId, currentUserData, isOwnProfile]);

    // Load followers/following lists
    useEffect(() => {
        const targetData = isOwnProfile ? currentUserData : profileData;
        if (!targetData) return;
        if (activeTab === 'followers' || activeTab === 'following') {
            const ids = activeTab === 'followers' ? (targetData.followers || []) : (targetData.following || []);
            if (ids.length === 0) { activeTab === 'followers' ? setFollowersList([]) : setFollowingList([]); return; }
            setListLoading(true);
            Promise.all(ids.map(id => getDoc(doc(db, 'users', id)).then(s => s.exists() ? { uid: id, ...s.data() } : null)))
                .then(users => {
                    const filtered = users.filter(Boolean);
                    activeTab === 'followers' ? setFollowersList(filtered) : setFollowingList(filtered);
                    setListLoading(false);
                });
        }
    }, [activeTab, currentUserData, profileData, isOwnProfile]);

    const handleFollow = async () => {
        if (!user || !viewingUserId || followLoading) return;
        setFollowLoading(true);
        try {
            await updateDoc(doc(db, 'users', user.uid), { following: arrayUnion(viewingUserId) });
            await updateDoc(doc(db, 'users', viewingUserId), { followers: arrayUnion(user.uid) });
            setIsFollowing(true);
        } catch (err) { console.error("Follow error:", err); }
        finally { setFollowLoading(false); }
    };

    const handleUnfollow = async () => {
        if (!user || !viewingUserId || followLoading) return;
        setFollowLoading(true);
        try {
            await updateDoc(doc(db, 'users', user.uid), { following: arrayRemove(viewingUserId) });
            await updateDoc(doc(db, 'users', viewingUserId), { followers: arrayRemove(user.uid) });
            setIsFollowing(false);
        } catch (err) { console.error("Unfollow error:", err); }
        finally { setFollowLoading(false); }
    };

    const saveToFirestore = async (updates) => {
        if (!user) return;
        setLoading(true);
        try { await updateDoc(doc(db, 'users', user.uid), updates); }
        catch (err) { console.error("Firestore sync error:", err); }
        finally { setLoading(false); }
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
        if (exists) { newSpheres = subscribedSpheres.filter(s => s.name !== sphere.name); }
        else { newSpheres = [...subscribedSpheres, sphere]; }
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
        } finally { setUploadingPhoto(false); }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    // --- VIEWING OTHER USER'S PROFILE ---
    if (!isOwnProfile) {
        if (profileLoading) return <div className="flex items-center justify-center py-20"><div className="text-primary font-headline font-bold animate-pulse">Loading profile...</div></div>;
        if (!profileData) return <div className="text-center py-20 text-outline-variant">User not found.</div>;

        const displayData = profileData;
        return (
            <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
                {onBack && (
                    <button onClick={onBack} className="flex items-center gap-2 text-outline-variant hover:text-on-surface transition-colors mb-4">
                        <span className="material-symbols-outlined">arrow_back</span>
                        <span className="text-sm font-bold">Back to Feed</span>
                    </button>
                )}
                <div className="glass-panel p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                        <div className="w-32 h-32 rounded-[2rem] border-4 border-surface-variant overflow-hidden shadow-[0_0_30px_rgba(208,149,255,0.2)] flex-shrink-0 bg-surface-container flex items-center justify-center text-4xl">
                            {displayData.photoURL ? (
                                <img src={displayData.photoURL} alt="User" className="w-full h-full object-cover" />
                            ) : (
                                <span>{displayData.displayName?.charAt(0) || '👤'}</span>
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <div>
                                    <h2 className="text-3xl font-headline font-extrabold text-on-surface mb-1">{displayData.displayName || 'Explorer'}</h2>
                                    <div className="text-sm text-outline-variant font-bold">@{displayData.username || 'unknown'}</div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={isFollowing ? handleUnfollow : handleFollow}
                                        disabled={followLoading}
                                        className={`px-6 py-3 rounded-full font-bold text-sm transition-all shadow-lg ${isFollowing
                                            ? 'bg-surface-container border border-outline-variant/30 text-on-surface hover:bg-error-container hover:text-on-error-container hover:border-error/50'
                                            : 'bg-gradient-to-br from-pink-500 to-primary text-white hover:scale-105 shadow-primary/30'
                                        } disabled:opacity-50`}
                                    >
                                        {followLoading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
                                    </button>
                                    {onMessage && (
                                        <button
                                            onClick={() => onMessage({ id: viewingUserId, ...displayData })}
                                            className="px-6 py-3 rounded-full font-bold text-sm bg-surface-container border border-outline-variant/30 text-on-surface hover:border-primary/50 hover:bg-primary/10 transition-all flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                                            Message
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-6 mb-4">
                                <div className="text-center cursor-pointer" onClick={() => setActiveTab('followers')}>
                                    <div className="text-2xl font-bold text-on-surface">{displayData.followers?.length || 0}</div>
                                    <div className="text-xs text-outline-variant uppercase tracking-widest">Followers</div>
                                </div>
                                <div className="text-center cursor-pointer" onClick={() => setActiveTab('following')}>
                                    <div className="text-2xl font-bold text-on-surface">{displayData.following?.length || 0}</div>
                                    <div className="text-xs text-outline-variant uppercase tracking-widest">Following</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-on-surface">{displayData.spheres?.length || 0}</div>
                                    <div className="text-xs text-outline-variant uppercase tracking-widest">Domains</div>
                                </div>
                            </div>
                            <div className="bg-surface-container/50 p-4 rounded-2xl border border-outline-variant/10">
                                <p className="text-on-surface-variant leading-relaxed">{displayData.bio || 'No bio set.'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Domains */}
                {displayData.spheres && displayData.spheres.length > 0 && (
                    <div className="glass-panel p-6 rounded-[2rem]">
                        <h3 className="text-lg font-headline font-bold text-on-surface mb-4">Domains</h3>
                        <div className="flex flex-wrap gap-3">
                            {displayData.spheres.map(s => (
                                <span key={s.name} className="px-4 py-2 rounded-full text-sm font-bold border border-outline-variant/20 bg-surface-container text-on-surface" style={{ borderColor: `${s.color}40` }}>
                                    <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: s.color }}></span>
                                    {s.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Followers / Following Lists */}
                {(activeTab === 'followers' || activeTab === 'following') && (
                    <div className="glass-panel p-6 rounded-[2rem]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-headline font-bold text-on-surface capitalize">{activeTab}</h3>
                            <button onClick={() => setActiveTab('spheres')} className="text-outline-variant hover:text-on-surface"><span className="material-symbols-outlined text-sm">close</span></button>
                        </div>
                        {listLoading ? <p className="text-outline-variant animate-pulse">Loading...</p> : (
                            <div className="space-y-3">
                                {(activeTab === 'followers' ? followersList : followingList).map(u => (
                                    <div key={u.uid} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container cursor-pointer transition-colors" onClick={() => onViewProfile?.(u.uid)}>
                                        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-sm border border-outline-variant/20">
                                            {u.photoURL ? <img src={u.photoURL} alt="" className="w-full h-full rounded-full object-cover" /> : u.displayName?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-on-surface">{u.displayName}</div>
                                            <div className="text-xs text-outline-variant">@{u.username || 'user'}</div>
                                        </div>
                                    </div>
                                ))}
                                {(activeTab === 'followers' ? followersList : followingList).length === 0 && <p className="text-outline-variant text-sm">No {activeTab} yet.</p>}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // --- OWN PROFILE ---
    const ownData = currentUserData || {};
    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
            <div className="glass-panel p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                    <div className="relative w-32 h-32 rounded-[2rem] border-4 border-surface-variant overflow-hidden shadow-[0_0_30px_rgba(208,149,255,0.2)] flex-shrink-0 bg-surface-container flex items-center justify-center text-4xl cursor-pointer group/avatar" onClick={() => fileInputRef.current?.click()}>
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
                        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoChange} />
                    </div>
                    <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div>
                                <h2 className="text-3xl font-headline font-extrabold text-on-surface mb-1">{user?.displayName || 'Obsidian Scholar'}</h2>
                                <div className="text-sm text-outline-variant font-bold">@{ownData.username || 'user'} · {user?.email}</div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-6 py-2 rounded-full font-bold text-sm bg-surface-container border border-outline-variant/30 text-error hover:bg-error-container hover:text-on-error-container hover:border-error/50 transition-all flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">logout</span>
                                Logout
                            </button>
                        </div>
                        {/* Follower/Following counts */}
                        <div className="flex gap-6 mb-4">
                            <div className="text-center cursor-pointer" onClick={() => setActiveTab('followers')}>
                                <div className="text-2xl font-bold text-on-surface">{ownData.followers?.length || 0}</div>
                                <div className="text-xs text-outline-variant uppercase tracking-widest">Followers</div>
                            </div>
                            <div className="text-center cursor-pointer" onClick={() => setActiveTab('following')}>
                                <div className="text-2xl font-bold text-on-surface">{ownData.following?.length || 0}</div>
                                <div className="text-xs text-outline-variant uppercase tracking-widest">Following</div>
                            </div>
                        </div>
                        <div className="bg-surface-container/50 p-6 rounded-2xl border border-outline-variant/10">
                            {isEditingBio ? (
                                <div className="flex flex-col gap-4">
                                    <textarea className="w-full bg-surface rounded-xl p-4 text-on-surface border border-outline-variant/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none" value={tempBio} onChange={(e) => setTempBio(e.target.value)} rows={3} placeholder="Enter your professional bio..." />
                                    <div className="flex gap-3">
                                        <button className="px-6 py-2 bg-primary text-on-primary rounded-full font-bold text-sm shadow-lg" onClick={handleSaveBio} disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
                                        <button className="px-6 py-2 border border-outline-variant/30 text-on-surface-variant rounded-full font-bold text-sm" onClick={() => setIsEditingBio(false)}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div onClick={() => setIsEditingBio(true)} className="cursor-pointer group/bio relative">
                                    <h4 className="text-xs font-bold uppercase text-outline-variant tracking-widest mb-2 flex items-center gap-2"><span>Bio</span><span className="material-symbols-outlined text-[14px] opacity-0 group-hover/bio:opacity-100 transition-opacity">edit</span></h4>
                                    <p className="text-on-surface-variant leading-relaxed">{bio || "Click to add a bio..."}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Followers / Following Lists for own profile */}
            {(activeTab === 'followers' || activeTab === 'following') && (
                <div className="glass-panel p-6 rounded-[2rem]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-headline font-bold text-on-surface capitalize">{activeTab}</h3>
                        <button onClick={() => setActiveTab('spheres')} className="text-outline-variant hover:text-on-surface"><span className="material-symbols-outlined text-sm">close</span></button>
                    </div>
                    {listLoading ? <p className="text-outline-variant animate-pulse">Loading...</p> : (
                        <div className="space-y-3">
                            {(activeTab === 'followers' ? followersList : followingList).map(u => (
                                <div key={u.uid} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container cursor-pointer transition-colors" onClick={() => onViewProfile?.(u.uid)}>
                                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-sm border border-outline-variant/20">
                                        {u.photoURL ? <img src={u.photoURL} alt="" className="w-full h-full rounded-full object-cover" /> : u.displayName?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-on-surface">{u.displayName}</div>
                                        <div className="text-xs text-outline-variant">@{u.username || 'user'}</div>
                                    </div>
                                </div>
                            ))}
                            {(activeTab === 'followers' ? followersList : followingList).length === 0 && <p className="text-outline-variant text-sm">No {activeTab} yet.</p>}
                        </div>
                    )}
                </div>
            )}

            {/* Domains Hub Section */}
            <div className="glass-panel p-8 rounded-[2rem] shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-outline-variant/10">
                    <div>
                        <h3 className="text-2xl font-headline font-bold text-on-surface">Domain Construction Hub</h3>
                        <p className="text-outline-variant text-sm mt-1">Manage your active spheres</p>
                    </div>
                    <button className="flex items-center gap-2 px-6 py-3 bg-surface-container border border-outline-variant/20 hover:border-primary/50 rounded-full text-sm font-bold text-on-surface transition-all" onClick={() => setIsCreating(true)}>
                        <span className="material-symbols-outlined text-[18px] text-primary">add_circle</span>
                        Define New Domain
                    </button>
                </div>
                <div className="mb-12">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-outline-variant mb-6">Predefined Universes</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {PREDEFINED_SPHERES.map(sphere => {
                            const isSubscribed = subscribedSpheres?.find(s => s.name === sphere.name);
                            return (
                                <div key={sphere.name} className={`p-4 rounded-2xl cursor-pointer border-2 transition-all duration-300 flex flex-col items-center gap-3 ${isSubscribed ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(208,149,255,0.2)]' : 'border-outline-variant/10 bg-surface-container hover:border-outline-variant/30'}`} onClick={() => handleToggleSphereSelection(sphere)}>
                                    <div className="w-5 h-5 rounded-full shadow-lg" style={{ backgroundColor: sphere.color }}></div>
                                    <span className="font-bold text-sm text-on-surface">{sphere.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-outline-variant mb-6">Current Feed Actuators</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {subscribedSpheres?.map(sphere => {
                            const isActive = activatedSpheres?.some(s => s.name === sphere.name);
                            return (
                                <div key={sphere.name} className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${isActive ? 'bg-surface-variant border-primary/50 shadow-md' : 'bg-surface border-outline-variant/10 opacity-70 hover:opacity-100'}`} onClick={() => onToggleActivation?.(sphere)}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sphere.color || '#334155' }}></div>
                                        <span className="font-bold text-on-surface">#{sphere.name.toUpperCase()}</span>
                                    </div>
                                    <div className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${isActive ? 'text-primary border-primary/30 bg-primary/10' : 'text-outline-variant border-outline-variant/20'}`}>{isActive ? 'Transmitting' : 'Dormant'}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {isCreating && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                    <div className="glass-panel w-full max-w-sm p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-primary"></div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-headline font-bold text-on-surface">Initialize Domain</h3>
                            <button onClick={() => setIsCreating(false)} className="text-outline-variant hover:text-on-surface"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-outline-variant mb-2">Domain Name</label>
                                <input type="text" className="w-full bg-surface-container rounded-xl px-4 py-3 text-on-surface border border-outline-variant/20 focus:border-primary outline-none" value={newSphereName} onChange={(e) => setNewSphereName(e.target.value)} placeholder="e.g. Quantum Mechanics" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-outline-variant mb-3">Color</label>
                                <div className="flex gap-3 justify-between">
                                    {colors.map(color => (<div key={color} className={`w-10 h-10 rounded-full cursor-pointer transition-transform ${selectedColor === color ? 'scale-125 ring-2 ring-offset-2 ring-offset-background ring-primary' : 'hover:scale-110'}`} style={{ backgroundColor: color }} onClick={() => setSelectedColor(color)} />))}
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button className="flex-1 py-3 border border-outline-variant/20 text-on-surface rounded-xl font-bold" onClick={() => setIsCreating(false)}>Cancel</button>
                                <button className="flex-[2] py-3 bg-gradient-to-br from-primary to-primary-fixed text-on-primary rounded-xl font-bold shadow-lg disabled:opacity-50" onClick={handleCreate} disabled={loading || !newSphereName.trim()}>{loading ? 'Initializing...' : 'Construct Sphere'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;

import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

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

    const badges = [
        { id: 1, name: 'AI Expert', icon: '🤖', color: 'var(--accent-lavender)' },
        { id: 2, name: 'Vite Architect', icon: '⚡', color: 'var(--accent-cyan)' },
        { id: 3, name: 'Sphere Founder', icon: '🌐', color: '#34D399' }
    ];

    return (
        <div className="profile-container animate-in">
            <div className="profile-header glass-panel">
                <div className="avatar-large">
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || '👤'}
                </div>
                <div className="profile-header-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                        <div>
                            <h2 style={{ marginBottom: '0' }}>{user?.displayName || 'Obsidian Scholar'}</h2>
                            <div style={{ fontSize: '0.85rem', opacity: 0.6 }}>{user?.email}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {badges.map(badge => (
                                <span
                                    key={badge.id}
                                    title={badge.name}
                                    className="badge-item"
                                    style={{ border: `1px solid ${badge.color}` }}
                                >
                                    {badge.icon}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="bio-section">
                        {isEditingBio ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <textarea
                                    className="bio-input"
                                    value={tempBio}
                                    onChange={(e) => setTempBio(e.target.value)}
                                    rows={3}
                                    placeholder="Enter your professional bio..."
                                />
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="btn-post" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={handleSaveBio} disabled={loading}>
                                        {loading ? 'Saving...' : 'Save Bio'}
                                    </button>
                                    <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => setIsEditingBio(false)}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div onClick={() => setIsEditingBio(true)} style={{ cursor: 'pointer' }}>
                                <p className="bio-text" style={{ fontWeight: '500', color: 'var(--text-heading)' }}>Professional Bio</p>
                                <p className="bio-text">{bio || "Describe your expertise in specific domains..."}</p>
                                <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>Click to personalize your profile</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="spheres-hub glass-panel">
                <div className="spheres-header">
                    <h3>Domain Construction Hub</h3>
                    <button className="btn-secondary" onClick={() => setIsCreating(true)}>
                        + Define New Domain
                    </button>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', opacity: 0.8 }}>Predefined Universes</h4>
                    <div className="signup-spheres-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
                        {PREDEFINED_SPHERES.map(sphere => {
                            const isSubscribed = subscribedSpheres.find(s => s.name === sphere.name);
                            return (
                                <div
                                    key={sphere.name}
                                    className={`signup-sphere-tile ${isSubscribed ? 'selected' : ''}`}
                                    onClick={() => handleToggleSphereSelection(sphere)}
                                    style={{ padding: '0.75rem' }}
                                >
                                    <div className="sphere-dot" style={{ backgroundColor: sphere.color }}></div>
                                    <span style={{ fontSize: '0.85rem' }}>{sphere.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem', opacity: 0.8 }}>Current Feed Actuators</h4>
                <div className="spheres-grid">
                    {subscribedSpheres.map(sphere => {
                        const isActive = activatedSpheres.some(s => s.name === sphere.name);
                        return (
                            <div
                                key={sphere.name}
                                className={`sphere-card ${isActive ? 'active' : ''}`}
                                onClick={() => onToggleActivation(sphere)}
                            >
                                <div className="sphere-name">
                                    <div className="sphere-color" style={{ backgroundColor: sphere.color || '#334155' }}></div>
                                    {sphere.name}
                                </div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                                    {isActive ? 'Transmitting' : 'Dormant'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {isCreating && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel">
                        <h3 style={{ marginBottom: '1.5rem' }}>Create Custom Sphere</h3>
                        <div className="input-group">
                            <label>Domain Name</label>
                            <input
                                type="text"
                                className="input-field"
                                value={newSphereName}
                                onChange={(e) => setNewSphereName(e.target.value)}
                                placeholder="Quantum Mechanics..."
                            />
                        </div>
                        <div className="input-group">
                            <label>Aura Color</label>
                            <div className="color-options">
                                {colors.map(color => (
                                    <div
                                        key={color}
                                        className={`color-swatch ${selectedColor === color ? 'selected' : ''}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setSelectedColor(color)}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setIsCreating(false)}>Cancel</button>
                            <button className="btn-post" onClick={handleCreate} disabled={loading}>
                                {loading ? 'Syncing...' : 'Initialize'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;

import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    serverTimestamp,
    orderBy,
    getDocs,
    doc,
    setDoc
} from 'firebase/firestore';

const ChatView = ({ user }) => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const [media, setMedia] = useState([]);

    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
    const [showChatOnMobile, setShowChatOnMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobileView(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch User Directory
    useEffect(() => {
        const fetchUsers = async () => {
            const usersRef = collection(db, 'users');
            const snapshot = await getDocs(usersRef);
            const userList = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(u => u.id !== user?.uid); // Exclude self
            setUsers(userList);
            setLoading(false);
        };
        fetchUsers();
    }, [user]);

    // Conversation ID Logic (sorted UIDs)
    const getConvId = (uid1, uid2) => {
        return [uid1, uid2].sort().join('_');
    };

    // Real-time Message Listener
    useEffect(() => {
        if (!selectedUser || !user) return;

        const convId = getConvId(user.uid, selectedUser.id);
        const messagesRef = collection(db, 'conversations', convId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, [selectedUser, user]);

    const handleSelectUser = (u) => {
        setSelectedUser(u);
        if (isMobileView) {
            setShowChatOnMobile(true);
        }
    };

    const handleBackToList = () => {
        setShowChatOnMobile(false);
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        // In a real app, we would upload these to Firebase Storage and get URLs
        const newMedia = files.map(file => ({
            url: URL.createObjectURL(file),
            type: file.type,
            name: file.name
        }));
        setMedia([...media, ...newMedia]);
    };

    const handleSendMessage = async () => {
        if ((!inputText.trim() && media.length === 0) || !selectedUser || !user) return;

        const convId = getConvId(user.uid, selectedUser.id);
        const messagesRef = collection(db, 'conversations', convId, 'messages');

        const messageData = {
            text: inputText,
            senderId: user.uid,
            senderName: user.displayName || user.email,
            timestamp: serverTimestamp(),
            media: media
        };

        setInputText('');
        setMedia([]);

        try {
            await addDoc(messagesRef, messageData);
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const filteredUsers = users.filter(u =>
        u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return <div className="chat-view-container glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="status-indicator">Initializing Connection...</div>
        </div>;
    }

    return (
        <div className={`chat-view-container glass-panel animate-in ${isMobileView ? 'mobile-mode' : ''} ${showChatOnMobile ? 'show-chat' : 'show-list'}`}>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                multiple
            />
            {/* Sidebar: User List */}
            <div className="chat-sidebar">
                <div className="chat-search-container">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search Explorers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="chat-list">
                    {filteredUsers.length === 0 ? (
                        <div style={{ padding: '1.5rem', opacity: 0.5, fontSize: '0.9rem', textAlign: 'center' }}>
                            No other explorers found in this sector.
                        </div>
                    ) : (
                        filteredUsers.map((u, index) => (
                            <div
                                key={u.id}
                                className={`chat-item ${selectedUser?.id === u.id ? 'active' : ''}`}
                                onClick={() => handleSelectUser(u)}
                                style={{ '--item-index': index }}
                            >
                                <div className="chat-item-avatar" style={{ backgroundColor: `hsl(${index * 40}, 70%, 50%)` }}>
                                    {u.displayName?.charAt(0) || u.email?.charAt(0)}
                                </div>
                                <div className="chat-item-info">
                                    <div className="chat-item-header">
                                        <span className="chat-item-name">{u.displayName || 'Anonymous'}</span>
                                    </div>
                                    <div className="chat-item-preview">
                                        {u.bio ? u.bio.substring(0, 30) + '...' : u.email}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            {selectedUser ? (
                <div className="chat-main animate-in">
                    <div className="chat-main-header">
                        <div className="chat-contact-info">
                            {isMobileView && (
                                <button className="chat-back-btn" onClick={handleBackToList}>
                                    ←
                                </button>
                            )}
                            <div className="chat-item-avatar" style={{ backgroundColor: 'var(--accent-lavender)' }}>
                                {selectedUser.displayName?.charAt(0) || selectedUser.email?.charAt(0)}
                            </div>
                            <div>
                                <div className="chat-item-name">{selectedUser.displayName || 'Explorer'}</div>
                                <div className="status-indicator">
                                    <div className="status-dot"></div>
                                    <span>Direct Frequency Enabled</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="chat-main-messages">
                        {messages.length === 0 && (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3, flexDirection: 'column', gap: '15px' }}>
                                <span style={{ fontSize: '3rem' }}>💬</span>
                                <p>Start a secured conversation with {selectedUser.displayName || 'this explorer'}.</p>
                            </div>
                        )}
                        {messages.map(msg => (
                            <div key={msg.id} className={`message ${msg.senderId === user.uid ? 'user' : 'other'}`}>
                                {msg.media && msg.media.length > 0 && (
                                    <div className="media-preview-container" style={{ marginBottom: '8px' }}>
                                        {msg.media.map((m, i) => (
                                            m.type?.startsWith('image/') ? (
                                                <img key={i} src={m.url} alt="chat-media" style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '4px' }} />
                                            ) : (
                                                <div key={i} className="file-attachment" style={{ background: 'rgba(0,0,0,0.2)' }}>
                                                    <span>📄 {m.name}</span>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                )}
                                <div>{msg.text}</div>
                                <div style={{ fontSize: '0.6rem', opacity: 0.5, textAlign: 'right', marginTop: '2px' }}>
                                    {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-footer">
                        <div className="chat-input-wrapper" style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '8px' }}>
                            {media.length > 0 && (
                                <div className="media-previews" style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px' }}>
                                    {media.map((m, idx) => (
                                        <div key={idx} style={{ position: 'relative' }}>
                                            {m.type?.startsWith('image/') ? (
                                                <img src={m.url} style={{ height: '40px', borderRadius: '4px' }} />
                                            ) : (
                                                <div style={{ padding: '4px 8px', background: 'var(--glass-border)', borderRadius: '4px', fontSize: '0.7rem' }}>📄</div>
                                            )}
                                            <button
                                                onClick={() => setMedia(media.filter((_, i) => i !== idx))}
                                                style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', borderRadius: '50%', width: '15px', height: '15px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <button className="attachment-btn" title="Send Media" onClick={() => fileInputRef.current.click()}>📎</button>
                                <input
                                    type="text"
                                    className="chat-input"
                                    placeholder={`Message ${selectedUser.displayName || 'Explorer'}...`}
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                />
                            </div>
                        </div>
                        <button
                            className="btn-post"
                            onClick={handleSendMessage}
                            disabled={!inputText.trim() && media.length === 0}
                        >
                            Send
                        </button>
                    </div>
                </div>
            ) : (
                <div className="chat-main animate-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5, flexDirection: 'column', gap: '20px' }}>
                    <div style={{ fontSize: '4rem' }}>📡</div>
                    <h3>Select an explorer to open a direct frequency</h3>
                    <p style={{ fontSize: '0.9rem' }}>All transmissions are secured via InterestSphere protocols.</p>
                </div>
            )}
        </div>
    );

};

export default ChatView;

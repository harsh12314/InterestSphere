import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import {
    collection,
    query,
    onSnapshot,
    addDoc,
    serverTimestamp,
    orderBy,
    getDocs,
    doc,
    setDoc
} from 'firebase/firestore';

const ChatView = ({ user, spheres, currentUserData, directChatUser }) => {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const [media, setMedia] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

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

    // If directChatUser is provided, auto-select them
    useEffect(() => {
        if (directChatUser) {
            setSelectedUser(directChatUser);
            if (isMobileView) setShowChatOnMobile(true);
        }
    }, [directChatUser, isMobileView]);

    // Fetch contacts: only followed users + users with chat history (Real-time for both users and conversations)
    useEffect(() => {
        let unsubUsers = () => {};
        let unsubConvs = () => {};

        const initChatList = () => {
            if (!user) return;
            
            const followingList = currentUserData?.following || [];

            let currentAllUsers = [];
            let currentChatPartnerIds = new Set();

            const updateList = () => {
                const followingList = currentUserData?.following || [];
                const filtered = currentAllUsers.filter(u => {
                    const isFollowed = followingList.includes(u.id);
                    const hasChatted = currentChatPartnerIds.has(u.id);
                    return isFollowed || hasChatted;
                });

                if (directChatUser && !filtered.find(u => u.id === directChatUser.id)) {
                    filtered.unshift(directChatUser);
                }

                setUsers(filtered);
                setLoading(false);
            };

            // Real-time listener for ALL users (so brand new registrations appear)
            const usersRef = collection(db, 'users');
            unsubUsers = onSnapshot(usersRef, (snapshot) => {
                currentAllUsers = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(u => u.id !== user?.uid);
                updateList();
            }, (err) => console.error("Users listener error:", err));

            // Real-time listener for conversations
            const convsRef = collection(db, 'conversations');
            unsubConvs = onSnapshot(convsRef, (convsSnap) => {
                const newPartnerIds = new Set();
                convsSnap.docs.forEach(d => {
                    const parts = d.id.split('_');
                    if (parts.includes(user.uid)) {
                        parts.forEach(p => { if (p !== user.uid) newPartnerIds.add(p); });
                    }
                });
                currentChatPartnerIds = newPartnerIds;
                updateList();
            }, (err) => console.error("Conversations listener error:", err));
        };

        initChatList();

        return () => {
            unsubUsers();
            unsubConvs();
        };
    }, [user, currentUserData, directChatUser]);

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
        const newMedia = files.map(file => ({
            file,
            url: URL.createObjectURL(file),
            type: file.type,
            name: file.name
        }));
        setMedia([...media, ...newMedia]);
    };

    const handleSendMessage = async () => {
        if ((!inputText.trim() && media.length === 0) || !selectedUser || !user || isSending) return;
        setIsSending(true);
        setUploadProgress(0);

        const convId = getConvId(user.uid, selectedUser.id);
        const messagesRef = collection(db, 'conversations', convId, 'messages');
        const convRef = doc(db, 'conversations', convId);

        try {
            const uploadedMedia = await Promise.all(media.map(async (m) => {
                if (m.file) {
                    const safeName = m.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
                    const storageRef = ref(storage, `chats/${Date.now()}_${safeName}`);
                    
                    return new Promise((resolve, reject) => {
                        const uploadTask = uploadBytesResumable(storageRef, m.file);
                        uploadTask.on('state_changed', 
                            (snapshot) => {
                                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                                setUploadProgress(progress);
                            }, 
                            (error) => {
                                console.error("Chat upload error:", m.name, error);
                                reject(error);
                            }, 
                            async () => {
                                const url = await getDownloadURL(uploadTask.snapshot.ref);
                                resolve({ url, name: m.name, type: m.type });
                            }
                        );
                    });
                }
                return m;
            }));

            const messageData = {
                text: inputText,
                senderId: user.uid,
                senderName: user.displayName || user.email,
                timestamp: serverTimestamp(),
                media: uploadedMedia
            };

            setInputText('');
            setMedia([]);

            await setDoc(convRef, { participants: [user.uid, selectedUser.id], lastUpdated: serverTimestamp() }, { merge: true });
            await addDoc(messagesRef, messageData);
        } catch (error) {
            console.error("Error sending message:", error);
            let msg = "Send failed. ";
            if (error.code === 'storage/unauthorized') {
                msg += "Update your Firebase Storage Rules to allow uploads.";
            } else {
                msg += error.message || "Check your connection.";
            }
            alert(msg);
        } finally {
            setIsSending(false);
            setUploadProgress(0);
        }
    };

    const filteredUsers = users.filter(u =>
        u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-8rem)] glass-panel rounded-3xl items-center justify-center">
                <div className="text-primary font-headline font-bold animate-pulse text-lg">Initializing Connection...</div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-8rem)] glass-panel rounded-[2rem] overflow-hidden shadow-2xl pb-16 md:pb-0">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                multiple
            />
            {/* Sidebar: User List */}
            <div className={`w-full md:w-80 border-r border-outline-variant/10 flex flex-col bg-surface-container/30 transition-transform ${isMobileView && showChatOnMobile ? 'hidden' : 'flex'}`}>
                <div className="p-4 border-b border-outline-variant/10 bg-surface/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center bg-surface-container rounded-xl px-4 py-2 border border-outline-variant/20 focus-within:border-primary transition-colors">
                        <span className="material-symbols-outlined text-outline-variant mr-2 text-sm">search</span>
                        <input
                            type="text"
                            className="w-full bg-transparent border-none focus:ring-0 text-sm placeholder:text-outline-variant outline-none text-on-surface"
                            placeholder="Search Explorers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {filteredUsers.length === 0 ? (
                        <div className="p-6 text-center text-outline-variant/70 text-sm italic">
                            No other explorers found in this sector.
                        </div>
                    ) : (
                        filteredUsers.map((u, index) => (
                            <div
                                key={u.id}
                                className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all mb-1 ${selectedUser?.id === u.id ? 'bg-primary/20 shadow-[0_0_15px_rgba(208,149,255,0.15)] border border-primary/30' : 'hover:bg-surface-container-high border border-transparent'}`}
                                onClick={() => handleSelectUser(u)}
                            >
                                <div className="w-12 h-12 rounded-full flex items-center justify-center text-on-surface font-bold text-lg shadow-inner flex-shrink-0" style={{ backgroundColor: `hsl(${index * 40}, 70%, 20%)`, border: `1px solid hsl(${index * 40}, 70%, 50%)` }}>
                                    {u.displayName?.charAt(0) || u.email?.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-on-surface text-sm truncate">{u.displayName || 'Anonymous'}</div>
                                    <div className="text-xs text-outline-variant truncate mt-0.5">
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
                <div className={`flex-1 flex flex-col bg-surface/50 transition-transform ${isMobileView && !showChatOnMobile ? 'hidden' : 'flex'}`}>
                    <div className="h-[72px] px-6 border-b border-outline-variant/10 bg-surface-container/50 backdrop-blur-md flex items-center gap-4 flex-shrink-0">
                        {isMobileView && (
                            <button className="text-on-surface-variant hover:text-on-surface transition-colors p-2 -ml-2" onClick={handleBackToList}>
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                        )}
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface font-bold border border-primary/50 shadow-[0_0_10px_rgba(208,149,255,0.2)] bg-primary/20">
                            {selectedUser.displayName?.charAt(0) || selectedUser.email?.charAt(0)}
                        </div>
                        <div>
                            <div className="font-bold text-on-surface text-sm">{selectedUser.displayName || 'Explorer'}</div>
                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-primary mt-0.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                                Direct Frequency Enabled
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                        {messages.length === 0 && (
                            <div className="flex-1 flex flex-col items-center justify-center opacity-30 gap-4 text-center">
                                <span className="material-symbols-outlined text-[64px]">forum</span>
                                <p className="text-sm font-headline">Start a secured conversation with {selectedUser.displayName || 'this explorer'}.</p>
                            </div>
                        )}
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex flex-col max-w-[80%] ${msg.senderId === user.uid ? 'self-end items-end' : 'self-start items-start'}`}>
                                {msg.media && msg.media.length > 0 && (
                                    <div className="flex flex-col gap-2 mb-2">
                                        {msg.media.map((m, i) => (
                                            m.type?.startsWith('image/') ? (
                                                <img key={i} src={m.url} alt="chat-media" className="max-w-[240px] rounded-2xl border border-outline-variant/20 shadow-lg" />
                                            ) : m.type?.startsWith('video/') ? (
                                                <video 
                                                    key={i} 
                                                    src={m.url} 
                                                    controls 
                                                    loop 
                                                    muted 
                                                    playsInline 
                                                    autoPlay
                                                    className="max-w-[240px] rounded-2xl border border-outline-variant/20 shadow-lg bg-black" 
                                                />
                                            ) : (
                                                <div key={i} className="flex items-center gap-2 bg-surface-variant/50 px-3 py-2 rounded-lg border border-outline-variant/10 text-xs text-on-surface">
                                                    <span className="material-symbols-outlined text-sm">description</span> {m.name}
                                                </div>
                                            )
                                        ))}
                                    </div>
                                )}
                                <div className={`px-4 py-3 text-sm rounded-2xl shadow-sm ${msg.senderId === user.uid ? 'bg-gradient-to-br from-primary to-primary-fixed text-on-primary rounded-tr-sm' : 'bg-surface-variant text-on-surface-variant rounded-tl-sm border border-outline-variant/10'}`}>
                                    {msg.text}
                                </div>
                                <div className="text-[10px] text-outline-variant/50 mt-1 font-bold">
                                    {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 border-t border-outline-variant/10 bg-surface-container/30">
                        <div className="flex flex-col gap-2">
                            {media.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-2 px-1">
                                    {media.map((m, idx) => (
                                        <div key={idx} className="relative group">
                                            {m.type?.startsWith('image/') ? (
                                                <img src={m.url} className="h-12 w-12 object-cover rounded-lg border border-outline-variant/30 shadow-sm" />
                                            ) : m.type?.startsWith('video/') ? (
                                                <div className="h-12 w-12 rounded-lg border border-outline-variant/30 overflow-hidden bg-black shadow-sm relative">
                                                    <video src={m.url} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                        <span className="material-symbols-outlined text-[12px] text-white">play_arrow</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-12 w-12 flex items-center justify-center bg-surface-variant rounded-lg border border-outline-variant/30 shadow-sm">
                                                    <span className="material-symbols-outlined text-sm">description</span>
                                                </div>
                                            )}
                                            <button
                                                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-error text-on-error rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                                onClick={() => setMedia(media.filter((_, i) => i !== idx))}
                                            >
                                                <span className="material-symbols-outlined text-[10px]">close</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <button className="w-10 h-10 rounded-full flex items-center justify-center text-outline-variant hover:text-primary hover:bg-primary/10 transition-colors" title="Send Media" onClick={() => fileInputRef.current.click()}>
                                    <span className="material-symbols-outlined text-[20px]">attach_file</span>
                                </button>
                                <div className="flex-1 flex items-center bg-surface rounded-full px-4 py-2 border border-outline-variant/20 focus-within:border-primary transition-colors">
                                    <input
                                        type="text"
                                        className="w-full bg-transparent border-none focus:ring-0 text-sm outline-none text-on-surface placeholder:text-outline-variant"
                                        placeholder={`Message ${selectedUser.displayName || 'Explorer'}...`}
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    />
                                </div>
                                <button
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${((!inputText.trim() && media.length === 0) || isSending) ? 'bg-surface-variant text-outline-variant/50 cursor-not-allowed' : 'bg-primary text-on-primary shadow-[0_0_15px_rgba(208,149,255,0.4)] hover:scale-105 active:scale-95'}`}
                                    onClick={handleSendMessage}
                                    disabled={(!inputText.trim() && media.length === 0) || isSending}
                                >
                                    {isSending ? (
                                        <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <span className="material-symbols-outlined text-[18px]">send</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={`flex-1 flex flex-col items-center justify-center gap-6 opacity-50 transition-transform ${isMobileView ? 'hidden' : 'flex'}`}>
                    <span className="material-symbols-outlined text-[80px] text-primary animate-pulse">satellite_alt</span>
                    <div className="text-center">
                        <h3 className="text-xl font-headline font-bold text-on-surface">Select an explorer to open a direct frequency</h3>
                        <p className="text-sm text-outline-variant mt-2">All transmissions are secured via InterestSphere protocols.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatView;

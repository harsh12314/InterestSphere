import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import {
    collection,
    query,
    onSnapshot,
    addDoc,
    serverTimestamp,
    orderBy,
    limit
} from 'firebase/firestore';

const ChatSection = ({ user, fullView }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen || fullView) scrollToBottom();
    }, [messages, isOpen, fullView]);

    // Global Chat Real-time Listener
    useEffect(() => {
        const messagesRef = collection(db, 'global_chat');
        const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(50));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, []);

    const handleSend = async () => {
        if (input.trim() && user) {
            const messageData = {
                text: input,
                senderId: user.uid,
                senderName: user.displayName || user.email,
                timestamp: serverTimestamp()
            };

            setInput('');
            try {
                await addDoc(collection(db, 'global_chat'), messageData);
            } catch (error) {
                console.error("Error sending global message:", error);
            }
        }
    };

    if (fullView) {
        return (
            <div className="chat-view-container glass-panel animate-in" style={{ height: 'calc(100vh - 10rem)', marginTop: '1rem', display: 'flex', flexDirection: 'column' }}>
                <div className="chat-header" style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', background: 'var(--accent-cyan)', borderRadius: '50%', boxShadow: '0 0 8px var(--accent-cyan)' }}></div>
                        <span style={{ fontWeight: '600', color: 'var(--text-heading)' }}>Global Interlink (Full Frequency)</span>
                    </div>
                </div>

                <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {messages.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.3, fontSize: '0.8rem' }}>
                            No signals in the global interlink...
                        </div>
                    )}
                    {messages.map(msg => (
                        <div key={msg.id} className={`message ${msg.senderId === user?.uid ? 'user' : 'other'}`}>
                            {msg.senderId !== user?.uid && (
                                <div style={{ fontSize: '0.65rem', opacity: 0.6, marginBottom: '2px', fontWeight: '600', color: 'var(--accent-lavender)' }}>
                                    {msg.senderName}
                                </div>
                            )}
                            <div>{msg.text}</div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-container" style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            className="chat-input"
                            placeholder={user ? "Signal the global hub..." : "Sign in to chat"}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            disabled={!user}
                            style={{ flex: 1 }}
                        />
                        <button
                            className={`btn-post ${!input.trim() || !user ? 'disabled' : ''}`}
                            style={{ padding: '0 15px', height: '36px', minWidth: 'auto' }}
                            onClick={handleSend}
                            disabled={!input.trim() || !user}
                        >
                            ➤
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-widget-container">
            {isOpen && (
                <div className="chat-window glass-panel">
                    <div className="chat-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', background: 'var(--accent-cyan)', borderRadius: '50%', boxShadow: '0 0 8px var(--accent-cyan)' }}></div>
                            <span style={{ fontWeight: '600', color: 'var(--text-heading)' }}>Global Interlink</span>
                        </div>
                        <button
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-body)', cursor: 'pointer', fontSize: '1.2rem' }}
                            onClick={() => setIsOpen(false)}
                        >
                            ×
                        </button>
                    </div>

                    <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {messages.length === 0 && (
                            <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.3, fontSize: '0.8rem' }}>
                                No signals in the global interlink...
                            </div>
                        )}
                        {messages.map(msg => (
                            <div key={msg.id} className={`message ${msg.senderId === user?.uid ? 'user' : 'other'}`}>
                                {msg.senderId !== user?.uid && (
                                    <div style={{ fontSize: '0.65rem', opacity: 0.6, marginBottom: '2px', fontWeight: '600', color: 'var(--accent-lavender)' }}>
                                        {msg.senderName}
                                    </div>
                                )}
                                <div>{msg.text}</div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input-container">
                        <input
                            type="text"
                            className="chat-input"
                            placeholder={user ? "Signal the global hub..." : "Sign in to chat"}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            disabled={!user}
                        />
                        <button
                            className={`btn-post ${!input.trim() || !user ? 'disabled' : ''}`}
                            style={{ padding: '0 15px', height: '36px', minWidth: 'auto' }}
                            onClick={handleSend}
                            disabled={!input.trim() || !user}
                        >
                            ➤
                        </button>
                    </div>
                </div>
            )}

            <div
                className="chat-trigger"
                onClick={() => setIsOpen(!isOpen)}
                title="Global Hub Chat"
            >
                {isOpen ? '✕' : '💬'}
            </div>
        </div>
    );
};

export default ChatSection;

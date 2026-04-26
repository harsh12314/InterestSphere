import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import {
    collection,
    query,
    onSnapshot,
    addDoc,
    serverTimestamp,
    orderBy,
    limit,
    deleteDoc,
    doc
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

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to retract this signal?")) {
            try {
                await deleteDoc(doc(db, 'global_chat', id));
            } catch (error) {
                console.error("Error deleting global message:", error);
            }
        }
    };

    if (fullView) {
        return (
            <div className="flex flex-col h-[calc(100vh-12rem)] glass-panel rounded-3xl overflow-hidden mt-4">
                <div className="p-6 border-b border-outline-variant/10 flex items-center gap-3 bg-surface-container/50">
                    <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_10px_#8397ff]"></div>
                    <span className="font-headline font-bold text-lg text-on-surface">Global Interlink <span className="text-sm font-normal text-outline-variant">(Full Frequency)</span></span>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                    {messages.length === 0 && (
                        <div className="text-center py-12 text-outline-variant italic font-headline">
                            No signals in the global interlink...
                        </div>
                    )}
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex flex-col max-w-[80%] group ${msg.senderId === user?.uid ? 'self-end items-end' : 'self-start items-start'}`}>
                            {msg.senderId !== user?.uid && (
                                <span className="text-xs font-bold text-primary mb-1 ml-1">{msg.senderName}</span>
                            )}
                            <div className="flex items-center gap-2 group/msg">
                                {msg.senderId === user?.uid && (
                                    <button 
                                        onClick={() => handleDelete(msg.id)}
                                        className="opacity-0 group-hover/msg:opacity-100 text-outline-variant hover:text-error transition-all order-first"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                )}
                                <div className={`px-4 py-3 rounded-2xl ${msg.senderId === user?.uid ? 'bg-primary text-on-primary rounded-tr-sm' : 'bg-surface-variant text-on-surface-variant rounded-tl-sm'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-outline-variant/10 bg-surface-container/30">
                    <div className="flex items-center gap-4 bg-surface rounded-full px-6 py-3 border border-outline-variant/20 focus-within:border-primary transition-colors">
                        <input
                            type="text"
                            className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-on-surface placeholder:text-outline-variant"
                            placeholder={user ? "Signal the global hub..." : "Sign in to chat"}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            disabled={!user}
                        />
                        <button
                            className={`text-primary hover:text-primary-fixed-dim transition-colors ${(!input.trim() || !user) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={handleSend}
                            disabled={!input.trim() || !user}
                        >
                            <span className="material-symbols-outlined">send</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-24 right-8 z-50 flex flex-col items-end md:bottom-8">
            {isOpen && (
                <div className="w-80 h-96 glass-panel rounded-2xl mb-4 flex flex-col overflow-hidden shadow-2xl animate-in">
                    <div className="p-4 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container/80">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_10px_#8397ff]"></div>
                            <span className="font-bold text-on-surface text-sm">Global Interlink</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-outline-variant hover:text-on-surface">
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                        {messages.length === 0 && (
                            <div className="text-center py-8 text-xs text-outline-variant italic">
                                No signals in the global interlink...
                            </div>
                        )}
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex flex-col max-w-[85%] group ${msg.senderId === user?.uid ? 'self-end items-end' : 'self-start items-start'}`}>
                                {msg.senderId !== user?.uid && (
                                    <span className="text-[10px] font-bold text-primary mb-0.5 ml-1">{msg.senderName}</span>
                                )}
                                <div className="flex items-center gap-1.5 group/msg">
                                    {msg.senderId === user?.uid && (
                                        <button 
                                            onClick={() => handleDelete(msg.id)}
                                            className="opacity-0 group-hover/msg:opacity-100 text-outline-variant hover:text-error transition-all order-first"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">delete</span>
                                        </button>
                                    )}
                                    <div className={`px-3 py-2 text-sm rounded-xl ${msg.senderId === user?.uid ? 'bg-primary text-on-primary rounded-tr-sm' : 'bg-surface-variant text-on-surface-variant rounded-tl-sm'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-3 border-t border-outline-variant/10 bg-surface-container/50">
                        <div className="flex items-center gap-2 bg-surface rounded-full px-4 py-2 border border-outline-variant/20 focus-within:border-primary">
                            <input
                                type="text"
                                className="flex-1 bg-transparent border-none text-xs outline-none text-on-surface placeholder:text-outline-variant"
                                placeholder={user ? "Message..." : "Sign in to chat"}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                disabled={!user}
                            />
                            <button
                                className={`text-primary hover:text-primary-fixed-dim transition-colors ${(!input.trim() || !user) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={handleSend}
                                disabled={!input.trim() || !user}
                            >
                                <span className="material-symbols-outlined text-sm">send</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <button
                className="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-[0_0_20px_rgba(208,149,255,0.4)] hover:scale-110 transition-transform z-50"
                onClick={() => setIsOpen(!isOpen)}
                title="Global Hub Chat"
            >
                <span className="material-symbols-outlined">{isOpen ? 'close' : 'forum'}</span>
            </button>
        </div>
    );
};

export default ChatSection;

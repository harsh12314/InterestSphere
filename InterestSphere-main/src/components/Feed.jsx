import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

const PostCard = ({ post, onViewProfile, currentUserData }) => {
    const isLiked = currentUserData && post.likedBy?.includes(currentUserData.uid);
    const likesCount = post.likedBy?.length || post.likes || 0;
    const isOwnPost = currentUserData && post.authorId === currentUserData.uid;
    const commentsList = post.commentsList || [];
    
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    
    const [isEditing, setIsEditing] = useState(false);
    const [editBody, setEditBody] = useState(post.body);
    
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editCommentText, setEditCommentText] = useState('');

    const handleLike = async () => {
        if (!currentUserData?.uid || !post.id) return;
        const postRef = doc(db, 'posts', post.id);
        try {
            if (isLiked) {
                await updateDoc(postRef, { likedBy: arrayRemove(currentUserData.uid) });
            } else {
                await updateDoc(postRef, { likedBy: arrayUnion(currentUserData.uid) });
            }
        } catch (error) {
            console.error("Error updating like:", error);
        }
    };

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this transmission?")) {
            try {
                await deleteDoc(doc(db, 'posts', post.id));
            } catch (error) {
                console.error("Error deleting post:", error);
            }
        }
    };

    const handleSaveEdit = async () => {
        try {
            await updateDoc(doc(db, 'posts', post.id), { body: editBody });
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating post:", error);
        }
    };

    const handleAddComment = async () => {
        if (commentText.trim() && currentUserData?.uid) {
            const newComment = {
                id: Date.now(),
                author: currentUserData.displayName || currentUserData.email || 'Explorer',
                authorId: currentUserData.uid,
                text: commentText
            };
            
            setCommentText(''); // Optimistically clear input
            
            try {
                await updateDoc(doc(db, 'posts', post.id), {
                    commentsList: arrayUnion(newComment)
                });
            } catch (error) {
                console.error("Error adding comment:", error);
            }
        }
    };

    const handleDeleteComment = async (comment) => {
        if (window.confirm("Are you sure you want to delete this reply?")) {
            try {
                await updateDoc(doc(db, 'posts', post.id), {
                    commentsList: arrayRemove(comment)
                });
            } catch (error) {
                console.error("Error deleting comment:", error);
            }
        }
    };

    const handleSaveCommentEdit = async (commentId) => {
        try {
            const updatedComments = commentsList.map(c => 
                c.id === commentId ? { ...c, text: editCommentText } : c
            );
            await updateDoc(doc(db, 'posts', post.id), {
                commentsList: updatedComments
            });
            setEditingCommentId(null);
        } catch (error) {
            console.error("Error updating comment:", error);
        }
    };

    return (
        <article className="relative group mb-12">
            <div className="absolute -inset-4 glass-panel rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
            <div className="flex gap-6">
                <div className="flex flex-col items-center gap-4">
                    <img 
                        alt={post.author} 
                        className="w-14 h-14 rounded-2xl border-2 border-outline-variant/30 object-cover shadow-lg" 
                        src={`https://ui-avatars.com/api/?name=${post.author}&background=272339&color=d095ff`}
                    />
                    <div className="w-px h-full bg-gradient-to-b from-outline-variant/40 to-transparent"></div>
                </div>
                
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-lg text-on-surface hover:text-primary cursor-pointer transition-colors" onClick={() => post.authorId && onViewProfile?.(post.authorId)}>{post.author}</span>
                            <span className="text-xs text-outline-variant font-medium uppercase">{post.time}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            {isOwnPost && (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setIsEditing(!isEditing)} className="text-outline-variant hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                    </button>
                                    <button onClick={handleDelete} className="text-outline-variant hover:text-error transition-colors">
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                </div>
                            )}
                            <div className="px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em] bg-secondary-container/30 text-secondary border border-secondary/20 uppercase sphere-badge">
                                #{post.domain.toUpperCase()}
                            </div>
                        </div>
                    </div>
                    
                    {isEditing ? (
                        <div className="mb-6">
                            <textarea
                                className="w-full bg-surface-container rounded-xl p-3 border border-outline-variant/30 text-on-surface focus:border-primary outline-none resize-none"
                                rows="3"
                                value={editBody}
                                onChange={(e) => setEditBody(e.target.value)}
                            />
                            <div className="flex justify-end gap-3 mt-2">
                                <button onClick={() => { setIsEditing(false); setEditBody(post.body); }} className="text-sm font-bold text-outline-variant hover:text-on-surface transition-colors">Cancel</button>
                                <button onClick={handleSaveEdit} className="text-sm font-bold text-primary hover:text-primary-fixed-dim transition-colors">Save</button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-on-surface-variant text-lg leading-relaxed mb-6 whitespace-pre-wrap">
                            {post.body}
                        </p>
                    )}

                    {post.media && post.media.length > 0 && (
                        <div className="mb-6">
                            {post.media.map((m, idx) => (
                                <div key={idx}>
                                    {m.type?.startsWith('image/') ? (
                                        <div className="relative rounded-3xl overflow-hidden shadow-2xl group/img">
                                            <img src={m.url} alt={m.name} className="w-full h-auto object-cover group-hover/img:scale-105 transition-transform duration-700" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent"></div>
                                        </div>
                                    ) : (
                                        <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="material-symbols-outlined text-primary">description</span>
                                                <div>
                                                    <div className="font-bold text-sm text-on-surface">{m.name}</div>
                                                    <div className="text-xs text-outline-variant uppercase">{m.type?.split('/').pop()}</div>
                                                </div>
                                            </div>
                                            <button onClick={() => window.open(m.url)} className="text-xs font-bold text-primary hover:text-primary-fixed-dim transition-colors">View</button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-6 mt-4">
                        <button 
                            onClick={handleLike}
                            className={`flex items-center gap-2 transition-colors ${isLiked ? 'text-primary text-glow' : 'text-outline-variant hover:text-on-surface'}`}
                        >
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                            <span className="text-sm font-bold">{likesCount}</span>
                        </button>
                        <button 
                            onClick={() => setShowComments(!showComments)}
                            className={`flex items-center gap-2 transition-colors ${showComments ? 'text-secondary text-glow' : 'text-outline-variant hover:text-on-surface'}`}
                        >
                            <span className="material-symbols-outlined">chat_bubble</span>
                            <span className="text-sm font-bold">{commentsList.length}</span>
                        </button>
                        <button className="flex items-center gap-2 text-outline-variant hover:text-on-surface transition-colors">
                            <span className="material-symbols-outlined">share</span>
                            <span className="text-sm font-bold">Share</span>
                        </button>
                    </div>

                    {showComments && (
                        <div className="mt-6 glass-panel rounded-2xl p-4 animate-in">
                            <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2">
                                {commentsList.length === 0 ? (
                                    <p className="text-sm text-outline-variant italic">No transmissions yet. Be the first.</p>
                                ) : (
                                    commentsList.map(c => {
                                        const isOwnComment = currentUserData && (
                                            c.authorId === currentUserData.uid || 
                                            (!c.authorId && c.author === (currentUserData.displayName || currentUserData.email))
                                        );
                                        return (
                                        <div key={c.id} className="flex gap-3 group/comment py-2">
                                            <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-xs font-bold text-on-surface shrink-0">
                                                {c.author.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <div className="font-bold text-sm text-on-surface">{c.author}</div>
                                                    {isOwnComment && (
                                                        <div className="flex items-center gap-2 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                                                            <button onClick={() => { setEditingCommentId(c.id); setEditCommentText(c.text); }} className="text-outline-variant hover:text-primary transition-colors">
                                                                <span className="material-symbols-outlined text-[14px]">edit</span>
                                                            </button>
                                                            <button onClick={() => handleDeleteComment(c)} className="text-outline-variant hover:text-error transition-colors">
                                                                <span className="material-symbols-outlined text-[14px]">delete</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                {editingCommentId === c.id ? (
                                                    <div className="mt-1">
                                                        <input 
                                                            type="text" 
                                                            className="w-full bg-surface-container rounded-xl p-2 border border-outline-variant/30 text-sm text-on-surface focus:border-primary outline-none"
                                                            value={editCommentText}
                                                            onChange={(e) => setEditCommentText(e.target.value)}
                                                            onKeyPress={(e) => e.key === 'Enter' && handleSaveCommentEdit(c.id)}
                                                            autoFocus
                                                        />
                                                        <div className="flex justify-end gap-2 mt-1">
                                                            <button onClick={() => setEditingCommentId(null)} className="text-[10px] font-bold text-outline-variant hover:text-on-surface transition-colors">CANCEL</button>
                                                            <button onClick={() => handleSaveCommentEdit(c.id)} className="text-[10px] font-bold text-primary hover:text-primary-fixed-dim transition-colors">SAVE</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-on-surface-variant break-words">{c.text}</div>
                                                )}
                                            </div>
                                        </div>
                                    )})
                                )}
                            </div>
                            <div className="flex items-center gap-2 border-t border-outline-variant/10 pt-4">
                                <input
                                    type="text"
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder:text-outline-variant outline-none"
                                    placeholder="Transmit a reply..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                                />
                                <button 
                                    onClick={handleAddComment}
                                    className="text-primary hover:text-primary-fixed-dim transition-colors"
                                >
                                    <span className="material-symbols-outlined">send</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
};

const Feed = ({ posts, activatedSpheres, onViewProfile, currentUserData }) => {
    const filteredPosts = posts.filter(p =>
        activatedSpheres.some(sphere => sphere.name.trim().toLowerCase() === p.domain?.trim().toLowerCase())
    );

    if (filteredPosts.length === 0) {
        return (
            <div className="text-center py-12 text-outline-variant italic font-headline">
                No signals detected in your active spheres.
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-20">
            {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} onViewProfile={onViewProfile} currentUserData={currentUserData} />
            ))}
        </div>
    );
};

export default Feed;

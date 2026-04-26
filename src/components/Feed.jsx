import React, { useState } from 'react';

const PostCard = ({ post, onViewProfile }) => {
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(post.likes);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState(post.commentsList || []);

    const handleLike = () => {
        setLiked(!liked);
        setLikesCount(prev => liked ? prev - 1 : prev + 1);
    };

    const handleAddComment = () => {
        if (commentText.trim()) {
            const newComment = {
                id: Date.now(),
                author: 'You',
                text: commentText
            };
            setComments([...comments, newComment]);
            setCommentText('');
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
                        <div className="px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em] bg-secondary-container/30 text-secondary border border-secondary/20 uppercase sphere-badge">
                            #{post.domain.toUpperCase()}
                        </div>
                    </div>
                    
                    <p className="text-on-surface-variant text-lg leading-relaxed mb-6">
                        {post.body}
                    </p>

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
                            className={`flex items-center gap-2 transition-colors ${liked ? 'text-primary text-glow' : 'text-outline-variant hover:text-on-surface'}`}
                        >
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                            <span className="text-sm font-bold">{likesCount}</span>
                        </button>
                        <button 
                            onClick={() => setShowComments(!showComments)}
                            className={`flex items-center gap-2 transition-colors ${showComments ? 'text-secondary text-glow' : 'text-outline-variant hover:text-on-surface'}`}
                        >
                            <span className="material-symbols-outlined">chat_bubble</span>
                            <span className="text-sm font-bold">{comments.length}</span>
                        </button>
                        <button className="flex items-center gap-2 text-outline-variant hover:text-on-surface transition-colors">
                            <span className="material-symbols-outlined">share</span>
                            <span className="text-sm font-bold">Share</span>
                        </button>
                    </div>

                    {showComments && (
                        <div className="mt-6 glass-panel rounded-2xl p-4 animate-in">
                            <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2">
                                {comments.length === 0 ? (
                                    <p className="text-sm text-outline-variant italic">No transmissions yet. Be the first.</p>
                                ) : (
                                    comments.map(c => (
                                        <div key={c.id} className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-xs font-bold text-on-surface">
                                                {c.author.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-on-surface">{c.author}</div>
                                                <div className="text-sm text-on-surface-variant">{c.text}</div>
                                            </div>
                                        </div>
                                    ))
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
                <PostCard key={post.id} post={post} onViewProfile={onViewProfile} />
            ))}
        </div>
    );
};

export default Feed;

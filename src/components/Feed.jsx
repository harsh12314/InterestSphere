import React, { useState } from 'react';

const PostCard = ({ post }) => {
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(post.likes);
    const [showShare, setShowShare] = useState(false);
    const [shareNotif, setShareNotif] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState(post.commentsList || []);

    const handleLike = () => {
        setLiked(!liked);
        setLikesCount(prev => liked ? prev - 1 : prev + 1);
    };

    const handleShare = (msg) => {
        setShareNotif(msg);
        setShowShare(false);
        setTimeout(() => setShareNotif(false), 2000);
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
        <article className="post-card glass-panel stagger-item" style={{ position: 'relative' }}>
            {shareNotif && (
                <div className="share-notification glass-panel animate-in">
                    {shareNotif}
                </div>
            )}

            <div className="post-header">
                <div className="user-info">
                    <div className="avatar">{post.author.charAt(0)}</div>
                    <div className="meta">
                        <span className="name">{post.author}</span>
                        <span className="time">{post.time}</span>
                    </div>
                </div>
                <span className="domain-tag">[{post.domain}]</span>
            </div>

            <p className="post-body">{post.body}</p>

            {post.media && post.media.length > 0 && (
                <div className="media-container">
                    {post.media.map((m, idx) => (
                        <div key={idx} className="post-media">
                            {m.type?.startsWith('image/') ? (
                                <img src={m.url} alt={m.name} style={{ borderRadius: '12px', width: '100%', display: 'block' }} />
                            ) : (
                                <div className="file-attachment">
                                    <div className="file-info">
                                        <span>📄</span>
                                        <div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{m.name}</div>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{m.type?.split('/').pop().toUpperCase()} File</div>
                                        </div>
                                    </div>
                                    <button className="btn-download" onClick={() => window.open(m.url)}>View File</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className="post-actions">
                <button
                    className={`action-btn ${liked ? 'liked-animation' : ''}`}
                    onClick={handleLike}
                    style={{ color: liked ? 'var(--accent-cyan)' : 'inherit' }}
                >
                    <span style={{ transition: 'transform 0.2s' }}>👍</span> {likesCount}
                </button>
                <button
                    className={`action-btn ${showComments ? 'active' : ''}`}
                    onClick={() => setShowComments(!showComments)}
                    style={{ color: showComments ? 'var(--accent-lavender)' : 'inherit' }}
                >
                    <span>💬</span> {comments.length}
                </button>
                <button className="action-btn" onClick={() => setShowShare(!showShare)}>
                    <span>🔄</span> Share
                </button>
            </div>

            {showComments && (
                <div className="comment-section animate-in">
                    <div className="comment-list">
                        {comments.length === 0 ? (
                            <p style={{ fontSize: '0.8rem', opacity: 0.5, padding: '10px 0' }}>No comments yet. Start the conversation!</p>
                        ) : (
                            comments.map(c => (
                                <div key={c.id} className="comment-item">
                                    <div className="comment-avatar">{c.author.charAt(0)}</div>
                                    <div className="comment-content">
                                        <div className="comment-author">{c.author}</div>
                                        <div className="comment-text">{c.text}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="comment-input-area">
                        <input
                            type="text"
                            className="comment-input"
                            placeholder="Add a comment..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                        />
                        <button className="btn-send-comment" onClick={handleAddComment}>➤</button>
                    </div>
                </div>
            )}

            {showShare && (
                <div className="share-modal glass-panel animate-in" style={{ zIndex: 1001 }}>
                    <div className="share-option" onClick={() => handleShare('🔗 Link Copied to Clipboard!')}>
                        🔗 Copy Link
                    </div>
                    <div className="share-option" onClick={() => handleShare('🌐 Shared to your Domain Universe!')}>
                        🌐 Send to a Sphere
                    </div>
                    <button
                        className="btn-secondary"
                        style={{ border: 'none', width: '100%', marginTop: '10px', fontSize: '0.8rem' }}
                        onClick={() => setShowShare(false)}
                    >
                        Cancel
                    </button>
                </div>
            )}
        </article>
    );
};

const Feed = ({ posts, activatedSpheres }) => {
    const filteredPosts = posts.filter(p =>
        activatedSpheres.some(sphere => sphere.name === p.domain)
    );

    if (filteredPosts.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-body)' }}>
                No activity detected in your active spheres.
            </div>
        );
    }

    return (
        <div className="feed-list">
            {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} />
            ))}
        </div>
    );
};

export default Feed;

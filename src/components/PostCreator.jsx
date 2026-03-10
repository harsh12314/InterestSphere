import React, { useState, useRef } from 'react';

const PostCreator = ({ availableDomains, onPost }) => {
    const [content, setContent] = useState('');
    const [selectedDomain, setSelectedDomain] = useState('');
    const [media, setMedia] = useState([]);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const newMedia = files.map(file => ({
            file,
            id: Math.random().toString(36).substr(2, 9),
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
            name: file.name,
            type: file.type
        }));
        setMedia([...media, ...newMedia]);
    };

    const removeMedia = (id) => {
        setMedia(media.filter(m => m.id !== id));
    };

    const handlePost = () => {
        if (!selectedDomain) return;

        onPost({
            author: 'You',
            domain: selectedDomain,
            body: content,
            time: 'Just now',
            likes: 0,
            comments: 0,
            media: media.map(m => ({
                url: m.preview || '#', // in real app, these are uploaded URLs
                name: m.name,
                type: m.type
            }))
        });

        setContent('');
        setSelectedDomain('');
        setMedia([]);
    };

    return (
        <div className="post-creator glass-panel">
            <textarea
                placeholder="Share a focused thought..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
            />

            {media.length > 0 && (
                <div className="media-preview-container">
                    {media.map(m => (
                        <div key={m.id} className="media-preview">
                            {m.preview ? (
                                <img src={m.preview} alt="preview" />
                            ) : (
                                <div className="file-icon">
                                    <span>📄</span>
                                    <span style={{ fontSize: '0.5rem' }}>{m.name.split('.').pop().toUpperCase()}</span>
                                </div>
                            )}
                            <button className="remove-media" onClick={() => removeMedia(m.id)}>×</button>
                        </div>
                    ))}
                </div>
            )}

            <div className="creator-actions">
                <div className="creator-left">
                    <input
                        type="file"
                        multiple
                        hidden
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />
                    <button
                        className="attachment-btn"
                        onClick={() => fileInputRef.current.click()}
                        title="Add Media/Files"
                    >
                        📎
                    </button>
                    <select
                        className="domain-select"
                        value={selectedDomain}
                        onChange={(e) => setSelectedDomain(e.target.value)}
                    >
                        <option value="" disabled>Select Domain</option>
                        {availableDomains.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>
                <button
                    className="btn-post"
                    disabled={!selectedDomain || content.trim().length === 0}
                    onClick={handlePost}
                >
                    Post
                </button>
            </div>
        </div>
    );
};

export default PostCreator;

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
        if (!selectedDomain || content.trim().length === 0) return;

        onPost({
            author: 'You',
            domain: selectedDomain,
            body: content,
            time: 'Just now',
            likes: 0,
            commentsList: [],
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
        <section className="glass-panel rounded-3xl p-6 mb-12 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none"></div>
            <div className="flex gap-4 items-start relative z-10">
                <img 
                    alt="Avatar" 
                    className="w-12 h-12 rounded-full border border-primary/20" 
                    src="https://ui-avatars.com/api/?name=You&background=272339&color=d095ff"
                />
                <div className="flex-1 flex flex-col">
                    <textarea 
                        className="w-full bg-transparent border-none text-xl font-medium focus:ring-0 placeholder:text-outline-variant resize-none outline-none text-on-surface" 
                        placeholder="Transmit a thought to the sphere..." 
                        rows={2}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    ></textarea>

                    {media.length > 0 && (
                        <div className="flex gap-4 mt-4 overflow-x-auto pb-2">
                            {media.map(m => (
                                <div key={m.id} className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden border border-outline-variant/30 group/media">
                                    {m.preview ? (
                                        <img src={m.preview} alt="preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-surface-variant flex flex-col items-center justify-center p-2 text-center">
                                            <span className="material-symbols-outlined text-outline-variant mb-1">description</span>
                                            <span className="text-[8px] font-bold text-on-surface truncate w-full">{m.name}</span>
                                        </div>
                                    )}
                                    <button 
                                        className="absolute top-1 right-1 w-6 h-6 bg-error/80 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover/media:opacity-100 transition-opacity"
                                        onClick={() => removeMedia(m.id)}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-outline-variant/10">
                        <div className="flex gap-4 text-primary">
                            <input
                                type="file"
                                multiple
                                hidden
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                            <span 
                                className="material-symbols-outlined cursor-pointer hover:text-primary-fixed-dim transition-colors"
                                onClick={() => fileInputRef.current.click()}
                                title="Attach Image or File"
                            >
                                image
                            </span>
                            
                            <select
                                className="bg-surface-variant text-on-surface text-xs font-bold px-3 py-1 rounded-full outline-none border-none cursor-pointer appearance-none ml-2"
                                value={selectedDomain}
                                onChange={(e) => setSelectedDomain(e.target.value)}
                            >
                                <option value="" disabled>Select Sphere</option>
                                {availableDomains.map(d => (
                                    <option key={d} value={d}>#{d.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                        <button 
                            className={`px-8 py-2 rounded-full font-bold text-sm transition-all ${(!selectedDomain || content.trim().length === 0) ? 'bg-surface-variant text-outline-variant cursor-not-allowed' : 'bg-primary text-on-primary hover:shadow-[0_0_15px_rgba(208,149,255,0.4)]'}`}
                            disabled={!selectedDomain || content.trim().length === 0}
                            onClick={handlePost}
                        >
                            Launch
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PostCreator;

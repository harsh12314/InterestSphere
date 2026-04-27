import React, { useState, useRef } from 'react';
import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

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

    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handlePost = async () => {
        if (!selectedDomain || content.trim().length === 0) return;
        setIsUploading(true);
        setUploadProgress(0);

        try {
            const uploadedMedia = await Promise.all(media.map(async (m) => {
                if (m.file) {
                    // Sanitize filename: remove spaces and special chars
                    const safeName = m.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
                    const storageRef = ref(storage, `posts/${Date.now()}_${safeName}`);
                    
                    return new Promise((resolve, reject) => {
                        const metadata = { contentType: m.file.type };
                        const uploadTask = uploadBytesResumable(storageRef, m.file, metadata);
                        uploadTask.on('state_changed', 
                            (snapshot) => {
                                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                                setUploadProgress(progress);
                            }, 
                            (error) => {
                                console.error("Upload error for file:", m.name, error);
                                reject(error);
                            }, 
                            async () => {
                                const url = await getDownloadURL(uploadTask.snapshot.ref);
                                resolve({ url, name: m.name, type: m.type });
                            }
                        );
                    });
                }
                return { url: m.url || '#', name: m.name, type: m.type };
            }));

            onPost({
                author: 'You',
                domain: selectedDomain,
                body: content,
                time: 'Just now',
                likes: 0,
                commentsList: [],
                media: uploadedMedia
            });

            setContent('');
            setSelectedDomain('');
            setMedia([]);
        } catch (error) {
            console.error("Critical Upload error:", error);
            let msg = "Upload failed. ";
            if (error.code === 'storage/unauthorized') {
                msg += "Please update your Firebase Storage Rules (see my instructions).";
            } else if (error.code === 'storage/retry-limit-exceeded') {
                msg += "Connection timed out. Check your internet.";
            } else {
                msg += error.message || "Unknown error.";
            }
            alert(msg);
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
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
                            className={`px-8 py-2 rounded-full font-bold text-sm transition-all flex items-center gap-2 relative overflow-hidden ${(!selectedDomain || content.trim().length === 0 || isUploading) ? 'bg-surface-variant text-outline-variant cursor-not-allowed' : 'bg-primary text-on-primary hover:shadow-[0_0_15px_rgba(208,149,255,0.4)]'}`}
                            disabled={!selectedDomain || content.trim().length === 0 || isUploading}
                            onClick={handlePost}
                        >
                            {isUploading && (
                                <div 
                                    className="absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-300" 
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            )}
                            {isUploading && <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>}
                            {isUploading ? `Transmitting (${Math.round(uploadProgress)}%)...` : 'Launch'}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PostCreator;

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

// Your Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyCekQbi44Ps62OFgYEDY0KtJ8Eng9j-y9I",
    authDomain: "interestsphere-6e899.firebaseapp.com",
    projectId: "interestsphere-6e899",
    storageBucket: "interestsphere-6e899.firebasestorage.app",
    messagingSenderId: "946870584799",
    appId: "1:946870584799:web:f26e1aca671ebd6f7ff06a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const seedData = async () => {
    console.log("Starting to seed InterestSphere database...");

    const spheres = ['AI', 'Web Dev', 'Finance', 'Space', 'Gaming'];
    
    const posts = [
        // AI Posts
        { author: 'Dr. Turing', domain: 'AI', body: 'The integration of multimodal LLMs into robotics is reaching a tipping point. We are seeing unprecedented zero-shot performance in spatial reasoning.', likes: 142 },
        { author: 'Neural_Explorer', domain: 'AI', body: 'Just finished a benchmark on the latest reasoning-optimized models. The logical consistency in complex mathematical proofs is staggering.', likes: 89 },
        { author: 'AI_Ethics', domain: 'AI', body: 'As we move towards AGI, the focus must shift from pure capability to robust alignment and safety frameworks. Perspective matters.', likes: 210 },
        
        // Web Dev Posts
        { author: 'React_Master', domain: 'Web Dev', body: 'React 19’s "Actions" and "use" hook are fundamentally changing how we handle server-side state. The DX is getting incredibly smooth.', likes: 76 },
        { author: 'Vite_Fast', domain: 'Web Dev', body: 'If you aren’t using HMR with Vite yet, you’re missing out on 50% of your potential productivity. Instant feedback is a game changer.', likes: 54 },
        { author: 'Tailwind_Fan', domain: 'Web Dev', body: 'Glassmorphism + Tailwind’s arbitrary values = Pure Magic. InterestSphere’s UI is a great example of this aesthetic.', likes: 112 },
        
        // Finance Posts
        { author: 'Market_Watch', domain: 'Finance', body: 'The Q1 interest rate projections are in. It looks like we’re in for a period of stabilization before any significant cuts.', likes: 65 },
        { author: 'Crypto_Insight', domain: 'Finance', body: 'Decentralized Finance (DeFi) is moving towards "Institutional Grade" infrastructure. Expect major players to enter the sphere this year.', likes: 128 },
        { author: 'Index_Investor', domain: 'Finance', body: 'Consistency beats timing. A simple DCA strategy into diversified ETFs remains the most robust path for long-term wealth.', likes: 45 },
        
        // Space Posts
        { author: 'Mars_Pioneer', domain: 'Space', body: 'The latest telemetry from the Jovian moons suggests a subsurface ocean with high chemical potential. Life might be closer than we think.', likes: 320 },
        { author: 'Orbital_Tech', domain: 'Space', body: 'Reusable launch systems have dropped the cost-to-orbit by nearly 90%. We are entering a new era of space industrialization.', likes: 198 },
        { author: 'Stellar_Observer', domain: 'Space', body: 'The James Webb Telescope just captured a high-res spectrum of an exoplanet atmosphere. Methane and Water vapor detected!', likes: 542 },
        
        // Gaming Posts
        { author: 'Gamer_X', domain: 'Gaming', body: 'The world design in "Elders Reach" is a masterclass in environmental storytelling. Every ruin tells a story without a single dialogue.', likes: 87 },
        { author: 'Retro_Vibe', domain: 'Gaming', body: 'Indie devs are pushing the boundaries of pixel art. "Neon Drift" is proof that style and gameplay matter more than polygon counts.', likes: 43 },
        { author: 'Pro_Streamer', domain: 'Gaming', body: 'The competition in the current eSports meta is insane. Strategy is evolving faster than the players can keep up!', likes: 62 },
    ];

    try {
        for (const post of posts) {
            await addDoc(collection(db, 'posts'), {
                ...post,
                authorId: 'system_seed_user',
                createdAt: serverTimestamp(),
                likedBy: [],
                commentsList: []
            });
            console.log(`Added post from ${post.author} in ${post.domain}`);
        }

        // Add some global messages
        const messages = [
            { senderName: 'InterestSphere Bot', text: 'Welcome to the InterestSphere! Connect with experts in your domain.', sphereId: 'global' },
            { senderName: 'Dr. Turing', text: 'Hello AI enthusiasts! Excited to be part of this sphere.', sphereId: 'AI' },
            { senderName: 'React_Master', text: 'Anyone up for a deep dive into React Server Components?', sphereId: 'Web Dev' }
        ];

        for (const msg of messages) {
            await addDoc(collection(db, 'messages'), {
                ...msg,
                senderId: 'system_seed_user',
                timestamp: serverTimestamp()
            });
            console.log(`Added message: ${msg.text}`);
        }

        console.log("\nDatabase Seeding Completed Successfully!");
    } catch (error) {
        console.error("Error seeding database:", error);
    }
};

seedData();

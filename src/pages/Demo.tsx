import React, { useRef, useState } from 'react';
import { useObjectDetection } from '../hooks/useObjectDetection';
import { useTraffic } from '../context/TrafficContext';
import { SignalLight } from '../components/SignalLight';
import { Upload } from 'lucide-react';
import styles from './Demo.module.css';

export const Demo = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaRef = useRef<HTMLImageElement | HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { detect, loading } = useObjectDetection();
    const { updateCounts } = useTraffic();

    const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
    const [mediaSrc, setMediaSrc] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Stats for demo
    const [demoStats, setDemoStats] = useState({ p: 0, v: 0 });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        setMediaSrc(url);
        if (file.type.startsWith('video/')) {
            setMediaType('video');
        } else {
            setMediaType('image');
        }
        // Reset
        setDemoStats({ p: 0, v: 0 });
        updateCounts(0, 0);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    };

    const handleMediaLoaded = () => {
        if (mediaType === 'image') {
            runDetection();
        }
    };

    const runDetection = async () => {
        if (!mediaRef.current || !canvasRef.current || loading) return;

        setIsProcessing(true);

        if (mediaType === 'image') {
            await detect(mediaRef.current, canvasRef.current, (p, v) => {
                setDemoStats({ p, v });
                updateCounts(p, v);
            });
            setIsProcessing(false);
        } else {
            // Video loop
            const video = mediaRef.current as HTMLVideoElement;
            video.play();

            const loop = () => {
                if (video.paused || video.ended) return;
                detect(video, canvasRef.current!, (p, v) => {
                    setDemoStats({ p, v });
                    updateCounts(p, v);
                });
                requestAnimationFrame(loop);
            };
            loop();
            setIsProcessing(false); // It's running loop
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.title}>
                    <Upload className="w-6 h-6 text-purple-400" />
                    <h1 className="text-xl font-bold">Demo Mode</h1>
                </div>
                <p className="text-sm text-gray-400">Upload an image or video to test the detection system.</p>
            </header>

            <div className={styles.uploadArea}>
                <div className="flex gap-4">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*,video/*"
                        className="hidden"
                        style={{ display: 'none' }}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="btn btn-primary"
                    >
                        <Upload size={18} /> Select File
                    </button>

                    <button
                        onClick={() => {
                            setMediaSrc('/sample.png');
                            setMediaType('image');
                            setDemoStats({ p: 0, v: 0 });
                            updateCounts(0, 0);
                        }}
                        className="btn"
                        style={{ backgroundColor: '#475569', color: 'white' }}
                    >
                        Load Sample Image
                    </button>
                </div>
            </div>

            {mediaSrc && (
                <div className={styles.previewArea}>
                    <div className={`${styles.mediaWrapper} glass-panel`}>
                        {mediaType === 'image' ? (
                            <img
                                ref={(el) => { mediaRef.current = el; }}
                                src={mediaSrc}
                                className={styles.media}
                                onLoad={handleMediaLoaded}
                                alt="Upload preview"
                            />
                        ) : (
                            <video
                                ref={(el) => { mediaRef.current = el; }}
                                src={mediaSrc}
                                className={styles.media}
                                controls
                                onPlay={() => runDetection()} // Trigger detection on play
                            />
                        )}
                        <canvas ref={canvasRef} className={styles.canvas} />
                    </div>

                    <div className={`${styles.results} glass-panel`}>
                        <h3 className="font-semibold mb-2 text-gray-300">Detection Results</h3>
                        <div className="flex gap-4 mb-4">
                            <div className="flex flex-col items-center p-3 bg-white/5 rounded-lg w-24">
                                <span className="text-xs text-gray-400">HUMANS</span>
                                <span className="text-2xl font-bold text-green-400">{demoStats.p}</span>
                            </div>
                            <div className="flex flex-col items-center p-3 bg-white/5 rounded-lg w-24">
                                <span className="text-xs text-gray-400">VEHICLES</span>
                                <span className="text-2xl font-bold text-red-400">{demoStats.v}</span>
                            </div>
                        </div>

                        <div className="w-full border-t border-white/10 pt-4 flex flex-col items-center">
                            <h4 className="text-sm font-semibold text-gray-400 mb-2">Signal Status</h4>
                            <div className="scale-75 origin-top">
                                <SignalLight />
                            </div>
                            <div className="mt-2 text-center text-xs text-gray-500">
                                Signal responds to detection counts over time.
                            </div>
                        </div>

                        {isProcessing && <div className="mt-4 text-xs animate-pulse text-blue-300">Processing...</div>}
                    </div>
                </div>
            )}
        </div>
    );
};

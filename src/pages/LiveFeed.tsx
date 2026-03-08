import { useEffect, useRef, useState } from 'react';
import { useObjectDetection } from '../hooks/useObjectDetection';
import { useTraffic } from '../context/TrafficContext';
import { SignalLight } from '../components/SignalLight';
import { Camera, AlertCircle } from 'lucide-react';
import styles from './LiveFeed.module.css';

export const LiveFeed = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { model, loading, detect } = useObjectDetection();
    const { updateCounts, pedestrianCount, vehicleCount, signalState, thresholds } = useTraffic();
    const [error, setError] = useState<string>('');
    const requestRef = useRef<number>(0);

    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment', width: 640, height: 480 },
                    audio: false
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current?.play();
                        requestRef.current = requestAnimationFrame(loop);
                    };
                }
            } catch (err) {
                console.error("Error accessing webcam:", err);
                setError("Unable to access camera. Please ensure you have granted permission.");
            }
        };

        startCamera();

        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [model]); // Restart if model loads? No, camera starts independent. But loop needs model.

    const loop = () => {
        if (model && videoRef.current && canvasRef.current && !videoRef.current.paused && !videoRef.current.ended) {
            detect(videoRef.current, canvasRef.current, updateCounts);
        }
        requestRef.current = requestAnimationFrame(loop);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.title}>
                    <Camera className="w-6 h-6 text-blue-400" />
                    <h1 className="text-xl font-bold">Live Traffic Monitor</h1>
                </div>
                <div className={styles.status}>
                    {loading ? (
                        <span className="text-yellow-400 text-sm animate-pulse">Loading AI Model...</span>
                    ) : (
                        <span className="text-green-400 text-sm">System Active</span>
                    )}
                </div>
            </header>

            {error && (
                <div className="bg-red-500/20 text-red-200 p-4 rounded-lg flex items-center gap-2 mb-4 mx-4">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            <div className={styles.grid}>
                <div className={`${styles.cameraFeed} glass-panel`}>
                    <div className={styles.videoWrapper}>
                        <video
                            ref={videoRef}
                            className={styles.video}
                            muted
                            playsInline
                        />
                        <canvas
                            ref={canvasRef}
                            className={styles.canvas}
                        />
                    </div>
                    <div className={styles.statsRow}>
                        <div className={styles.stat}>
                            <span className={styles.statLabel}>Pedestrians</span>
                            <span className={styles.statValue}>{pedestrianCount}</span>
                        </div>
                        <div className={styles.stat}>
                            <span className={styles.statLabel}>Vehicles</span>
                            <span className={styles.statValue}>{vehicleCount}</span>
                        </div>
                    </div>
                </div>

                <div className={`${styles.signalPanel} glass-panel`}>
                    <h2 className="text-lg font-semibold mb-4 text-center">Traffic Control</h2>
                    <SignalLight />
                    <div className={styles.decision}>
                        <p className="text-sm text-gray-400 mb-1">Current State</p>
                        <p className={`text-xl font-bold ${signalState === 'red' ? 'text-green-400' : 'text-red-400'}`}>
                            {signalState === 'red' ? 'STOP (Vehicles)' : 'GO (Vehicles)'}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                            Values: P={pedestrianCount} V={vehicleCount}<br />
                            Logic: {pedestrianCount * thresholds.pedestrianMultiplier} vs {vehicleCount * thresholds.vehicleMultiplier}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

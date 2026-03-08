import { useState, useEffect } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

export interface DetectionResult {
    class: string;
    score: number;
    bbox: [number, number, number, number];
}

export const useObjectDetection = () => {
    const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadModel = async () => {
            try {
                const loadedModel = await cocoSsd.load();
                setModel(loadedModel);
                setLoading(false);
            } catch (err) {
                console.error("Failed to load model", err);
                setLoading(false);
            }
        };
        loadModel();
    }, []);

    const detect = async (
        video: HTMLVideoElement | HTMLImageElement,
        canvas: HTMLCanvasElement,
        updateCounts?: (pedestrians: number, vehicles: number) => void
    ) => {
        if (!model) return;

        const predictions = await model.detect(video);

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Match canvas size to video size
        const videoWidth = video instanceof HTMLVideoElement ? video.videoWidth : video.width;
        const videoHeight = video instanceof HTMLVideoElement ? video.videoHeight : video.height;

        if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
            canvas.width = videoWidth;
            canvas.height = videoHeight;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '16px sans-serif';
        ctx.textBaseline = 'top';

        let persons = 0;
        let vehicles = 0; // car, bus, truck, motorcycle, bicycle

        predictions.forEach(prediction => {
            const [x, y, width, height] = prediction.bbox;
            const label = prediction.class;

            // Filter classes
            if (label === 'person') {
                persons++;
                ctx.strokeStyle = '#22c55e'; // Green
                ctx.fillStyle = '#22c55e';
            } else if (['car', 'bus', 'truck', 'motorcycle', 'bicycle'].includes(label)) {
                vehicles++;
                ctx.strokeStyle = '#ef4444'; // Red
                ctx.fillStyle = '#ef4444';
            } else {
                return; // Skip other objects for this app
            }

            ctx.lineWidth = 4;
            ctx.strokeRect(x, y, width, height);
            ctx.globalAlpha = 0.6;
            ctx.fillRect(x, y, width, 20);
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`${label} ${Math.round(prediction.score * 100)}%`, x + 5, y + 2);
        });

        if (updateCounts) {
            updateCounts(persons, vehicles);
        }
    };

    return { model, loading, detect };
};

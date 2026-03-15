import { useState, useEffect } from 'react';
import * as ort from 'onnxruntime-web';

export interface DetectionResult {
    class: string;
    score: number;
    bbox: [number, number, number, number]; // [x, y, width, height]
}

const YOLO_CLASSES = [
    'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
    'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat',
    'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack',
    'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
    'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
    'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
    'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair',
    'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse',
    'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator',
    'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
];

export const useObjectDetection = () => {
    const [session, setSession] = useState<ort.InferenceSession | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadModel = async () => {
            try {
                // Set the correct backend, using WebGL or WASM
                ort.env.wasm.numThreads = 1; 
                ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';

                // Load the YOLOv8 ONNX model from the public directory
                const session = await ort.InferenceSession.create('/yolov8n.onnx', {
                    executionProviders: ['wasm'],
                    graphOptimizationLevel: 'all'
                });
                
                setSession(session);
                setLoading(false);
            } catch (err) {
                console.error("Failed to load ONNX model", err);
                setLoading(false);
            }
        };
        loadModel();
    }, []);

    // Helper to extract non-max-suppressed bounding boxes from YOLOv8 output
    const processYoloOutput = (outputTensor: ort.Tensor, scale: number, padX: number, padY: number): DetectionResult[] => {
        const data = outputTensor.data as Float32Array;
        // Output shape: [1, 84, 8400]
        const numClasses = 80;
        const numAnchors = 8400;

        const results: DetectionResult[] = [];

        // Iterate through all anchors to find valid predictions
        for (let i = 0; i < numAnchors; i++) {
            let maxScore = 0;
            let classIdx = -1;

            // Find max class score for this anchor
            for (let c = 0; c < numClasses; c++) {
                const score = data[(4 + c) * numAnchors + i];
                if (score > maxScore) {
                    maxScore = score;
                    classIdx = c;
                }
            }

            // Confidence Threshold
            if (maxScore > 0.45) {
                const cx = data[0 * numAnchors + i];
                const cy = data[1 * numAnchors + i];
                const w = data[2 * numAnchors + i];
                const h = data[3 * numAnchors + i];

                // Map coordinates back to original image size
                // x = (cx - padX) / scale
                const x_center = (cx - padX) / scale;
                const y_center = (cy - padY) / scale;
                const width = w / scale;
                const height = h / scale;

                const x = x_center - width / 2;
                const y = y_center - height / 2;

                results.push({
                    class: YOLO_CLASSES[classIdx],
                    score: maxScore,
                    bbox: [x, y, width, height]
                });
            }
        }

        // Apply simplistic Non-Max Suppression (NMS)
        return applyNMS(results, 0.45);
    };

    const applyNMS = (boxes: DetectionResult[], iouThreshold: number): DetectionResult[] => {
        const sorted = [...boxes].sort((a, b) => b.score - a.score);
        const selected: DetectionResult[] = [];

        for (const box of sorted) {
            let keep = true;
            for (const other of selected) {
                if (box.class === other.class && calculateIoU(box.bbox, other.bbox) > iouThreshold) {
                    keep = false;
                    break;
                }
            }
            if (keep) {
                selected.push(box);
            }
        }
        return selected;
    };

    const calculateIoU = (box1: [number, number, number, number], box2: [number, number, number, number]): number => {
        const [x1, y1, w1, h1] = box1;
        const [x2, y2, w2, h2] = box2;

        const xA = Math.max(x1, x2);
        const yA = Math.max(y1, y2);
        const xB = Math.min(x1 + w1, x2 + w2);
        const yB = Math.min(y1 + h1, y2 + h2);

        const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
        const box1Area = w1 * h1;
        const box2Area = w2 * h2;

        return interArea / (box1Area + box2Area - interArea);
    };

    const detect = async (
        video: HTMLVideoElement | HTMLImageElement,
        canvas: HTMLCanvasElement,
        updateCounts?: (pedestrians: number, vehicles: number) => void
    ) => {
        if (!session) return;

        const videoWidth = video instanceof HTMLVideoElement ? video.videoWidth : video.width;
        const videoHeight = video instanceof HTMLVideoElement ? video.videoHeight : video.height;

        if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
            canvas.width = videoWidth;
            canvas.height = videoHeight;
        }

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        // Draw current frame to canvas to get image data
        ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
        
        // --- PREPROCESS FOR YOLOv8 ---
        // Create an offscreen canvas specifically for resizing to 640x640 with padding (letterbox)
        const targetSize = 640;
        const scale = Math.min(targetSize / videoWidth, targetSize / videoHeight);
        const newW = Math.round(videoWidth * scale);
        const newH = Math.round(videoHeight * scale);
        const padX = (targetSize - newW) / 2;
        const padY = (targetSize - newH) / 2;

        const offCanvas = document.createElement('canvas');
        offCanvas.width = targetSize;
        offCanvas.height = targetSize;
        const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
        if (!offCtx) return;

        // Fill padded area with gray (optional but common for YOLO)
        offCtx.fillStyle = '#777777';
        offCtx.fillRect(0, 0, targetSize, targetSize);
        offCtx.drawImage(video, 0, 0, videoWidth, videoHeight, padX, padY, newW, newH);

        const imgData = offCtx.getImageData(0, 0, targetSize, targetSize);
        const pixels = imgData.data;

        // Convert NHWC to NCHW and normalize 0-255 to 0.0-1.0
        const floatData = new Float32Array(1 * 3 * targetSize * targetSize);
        for (let y = 0; y < targetSize; y++) {
            for (let x = 0; x < targetSize; x++) {
                const idx = (y * targetSize + x) * 4;
                const r = pixels[idx] / 255.0;
                const g = pixels[idx + 1] / 255.0;
                const b = pixels[idx + 2] / 255.0;

                // NCHW layout: C0, C1, C2
                floatData[0 * targetSize * targetSize + y * targetSize + x] = r;
                floatData[1 * targetSize * targetSize + y * targetSize + x] = g;
                floatData[2 * targetSize * targetSize + y * targetSize + x] = b;
            }
        }

        const inputTensor = new ort.Tensor('float32', floatData, [1, 3, targetSize, targetSize]);

        // --- INFERENCE ---
        const feeds: Record<string, ort.Tensor> = {};
        feeds[session.inputNames[0]] = inputTensor;
        const outputData = await session.run(feeds);
        const outputKey = session.outputNames[0];
        const outputTensor = outputData[outputKey];

        // --- POSTPROCESS ---
        const detections = processYoloOutput(outputTensor, scale, padX, padY);

        // --- RENDER ---
        ctx.clearRect(0, 0, canvas.width, canvas.height); // clear the original frame draw
        ctx.font = '16px sans-serif';
        ctx.textBaseline = 'top';

        let persons = 0;
        let vehicles = 0; // car, bus, truck, motorcycle, bicycle

        detections.forEach(prediction => {
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

    return { model: session, loading, detect };
};

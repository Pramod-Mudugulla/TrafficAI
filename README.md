# 🚦 YOLO-Based Pedestrian Analytics System

Rapid urbanization has increased traffic congestion and raised concerns about pedestrian safety at road intersections. Conventional traffic signal systems operate on fixed timing mechanisms and fail to adapt to real-time pedestrian movement. To overcome this limitation, this project presents a YOLO-based real-time pedestrian analytics system for adaptive traffic signal control. 

The proposed system processes live video streams captured from traffic surveillance cameras to detect and count pedestrians using the YOLO deep learning algorithm. Based on pedestrian density and crossing demand, traffic signal timings are dynamically adjusted to ensure safer and more efficient pedestrian movement. The YOLO model provides high detection accuracy with low latency, making it suitable for real-time traffic environments. The proposed system enhances pedestrian safety, minimizes unnecessary waiting time, and improves overall traffic efficiency. This project demonstrates the practical application of computer vision and deep learning techniques in intelligent transportation systems and smart city infrastructure.

**Keywords**: YOLO, Pedestrian Detection, Adaptive Traffic Signals, Real-Time Analytics, Deep Learning, Smart Transportation

---

## ✨ Features

- **🎥 Live Feed** — Real-time webcam-based detection of pedestrians and vehicles with bounding boxes and confidence scores using YOLOv8 ONNX model.
- **📤 Demo Mode** — Upload images or videos to test detection without a camera.
- **🚦 Smart Signal Control** — Automated traffic light logic based on YOLO pedestrian density.
- **⚙️ Configurable Settings** — Adjust priority weights and signal durations.

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9
- A modern browser with **webcam access** for Live Feed mode

### Installation
```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at **http://localhost:5173**

## 🛠️ Tech Stack
- **React** with **TypeScript** & **Vite**
- **ONNX Runtime Web** (`onnxruntime-web`)
- **YOLOv8** (Deep Learning Model exported to ONNX format)
- **CSS Modules** & **Lucide React**

---

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments
- **Ultralytics YOLO** for state-of-the-art object detection
- Built for smarter, safer pedestrian crossings using Deep Learning.

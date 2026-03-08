import { useTraffic } from '../context/TrafficContext';
import { Settings as SettingsIcon, Sliders, Timer } from 'lucide-react';
import styles from './Settings.module.css';

export const Settings = () => {
    const { thresholds, updateThresholds } = useTraffic();

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.title}>
                    <SettingsIcon className="w-6 h-6 text-gray-400" />
                    <h1 className="text-xl font-bold">System Settings</h1>
                </div>
                <p className="text-sm text-gray-400">Adjust the traffic control logic parameters.</p>
            </header>

            <div className={`${styles.panel} glass-panel`}>
                <div className={styles.sectionHeader}>
                    <Sliders size={18} />
                    <h2>Priority Weights</h2>
                </div>

                <div className={styles.controlGroup}>
                    <label className={styles.label}>
                        <span>Pedestrian Weight Multiplier</span>
                        <span className={styles.value}>{thresholds.pedestrianMultiplier.toFixed(1)}x</span>
                    </label>
                    <input
                        type="range"
                        min="0.5"
                        max="5"
                        step="0.1"
                        value={thresholds.pedestrianMultiplier}
                        onChange={(e) => updateThresholds('pedestrianMultiplier', parseFloat(e.target.value))}
                        className={styles.range}
                    />
                    <p className={styles.helper}>Higher value makes the system favor pedestrians more easily.</p>
                </div>

                <div className={styles.controlGroup}>
                    <label className={styles.label}>
                        <span>Vehicle Weight Multiplier</span>
                        <span className={styles.value}>{thresholds.vehicleMultiplier.toFixed(1)}x</span>
                    </label>
                    <input
                        type="range"
                        min="0.5"
                        max="5"
                        step="0.1"
                        value={thresholds.vehicleMultiplier}
                        onChange={(e) => updateThresholds('vehicleMultiplier', parseFloat(e.target.value))}
                        className={styles.range}
                    />
                    <p className={styles.helper}>Higher value makes the system favor vehicle flow.</p>
                </div>
                <div className={`${styles.panel} glass-panel`} style={{ marginTop: '2rem' }}>
                    <div className={styles.sectionHeader}>
                        <Timer size={18} />
                        <h2>Signal Durations</h2>
                    </div>

                    <div className={styles.controlGroup}>
                        <label className={styles.label}>
                            <span>Minimum Green Time</span>
                            <span className={styles.value}>{(thresholds.minGreenTime / 1000).toFixed(1)}s</span>
                        </label>
                        <input
                            type="range"
                            min="100" // Allow going down to 0.1s
                            max="20000"
                            step="100"
                            value={thresholds.minGreenTime}
                            onChange={(e) => updateThresholds('minGreenTime', parseFloat(e.target.value))}
                            className={styles.range}
                        />
                        <p className={styles.helper}>Minimum time light stays Green for vehicles.</p>
                    </div>

                    <div className={styles.controlGroup}>
                        <label className={styles.label}>
                            <span>Yellow Light Duration</span>
                            <span className={styles.value}>{(thresholds.yellowTime / 1000).toFixed(1)}s</span>
                        </label>
                        <input
                            type="range"
                            min="100" // Allow going down to 0.1s
                            max="5000"
                            step="100"
                            value={thresholds.yellowTime}
                            onChange={(e) => updateThresholds('yellowTime', parseFloat(e.target.value))}
                            className={styles.range}
                        />
                        <p className={styles.helper}>Duration of the Yellow warning light.</p>
                    </div>

                    <div className={styles.controlGroup}>
                        <label className={styles.label}>
                            <span>Minimum Red Time</span>
                            <span className={styles.value}>{(thresholds.minRedTime / 1000).toFixed(1)}s</span>
                        </label>
                        <input
                            type="range"
                            min="100" // Allow going down to 0.1s
                            max="20000"
                            step="100"
                            value={thresholds.minRedTime}
                            onChange={(e) => updateThresholds('minRedTime', parseFloat(e.target.value))}
                            className={styles.range}
                        />
                        <p className={styles.helper}>Minimum time light stays Red (Pedestrian Crossing time).</p>
                    </div>

                    <div className={styles.controlGroup}>
                        <label className={styles.label}>
                            <span>Max Pedestrian Crossing Time</span>
                            <span className={styles.value}>{(thresholds.maxRedTime / 1000).toFixed(1)}s</span>
                        </label>
                        <input
                            type="range"
                            min="5000"
                            max="60000"
                            step="1000"
                            value={thresholds.maxRedTime}
                            onChange={(e) => updateThresholds('maxRedTime', parseFloat(e.target.value))}
                            className={styles.range}
                        />
                        <p className={styles.helper}>Force Green after this time, even if pedestrians are present.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

import { useTraffic } from '../context/TrafficContext';
import styles from './SignalLight.module.css';

export const SignalLight = () => {
    const { signalState } = useTraffic();

    return (
        <div className={styles.signalPost}>
            <div className={styles.signalHousing}>
                <div className={`${styles.light} ${signalState === 'red' ? styles.redActive : ''}`} />
                <div className={`${styles.light} ${signalState === 'yellow' ? styles.yellowActive : ''}`} />
                <div className={`${styles.light} ${signalState === 'green' ? styles.greenActive : ''}`} />
            </div>
            <div className={styles.pole} />
        </div>
    );
};

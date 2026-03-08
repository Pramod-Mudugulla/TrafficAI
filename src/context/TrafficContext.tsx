import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface TrafficState {
    pedestrianCount: number;
    vehicleCount: number;
    signalState: 'red' | 'yellow' | 'green'; // Red for vehicles means pedestrians can cross
    thresholds: {
        minPedestrians: number;
        maxVehicles: number; // If vehicles are less than this, favor pedestrians? Or if vehicles > max, favor vehicles?
        // Let's stick to the user rule: "more pedestrians and less vehicles then let the signal be red for vehicles"
        // So logic: if (pedestrianCount > vehicleCount) -> RED for vehicles (Humans cross)
        // else -> GREEN for vehicles
        // The settings can adjust "sensitivity" or maybe minimum thresholds.
        // User said: "number of vehicles or number of humans can be adjusted in the settings tab"
        // I interpreted this as simulation or threshold adjustment. Let's assume threshold adjustment.
        pedestrianMultiplier: number; // Weight for pedestrians
        vehicleMultiplier: number; // Weight for vehicles
        minGreenTime: number;
        minRedTime: number;
        maxRedTime: number;
        yellowTime: number;
    };
}

interface TrafficContextType extends TrafficState {
    updateCounts: (pedestrians: number, vehicles: number) => void;
    updateThresholds: (key: keyof TrafficState['thresholds'], value: number) => void;
}

const TrafficContext = createContext<TrafficContextType | undefined>(undefined);

export const TrafficProvider = ({ children }: { children: ReactNode }) => {
    const [counts, setCounts] = useState({ pedestrianCount: 0, vehicleCount: 0 });
    const [signalState, setSignalState] = useState<'red' | 'yellow' | 'green'>('green');
    const [lastSwitchTime, setLastSwitchTime] = useState(Date.now());

    const [thresholds, setThresholds] = useState({
        minPedestrians: 1,
        maxVehicles: 5,
        pedestrianMultiplier: 1.0,
        vehicleMultiplier: 1.0,
        minGreenTime: 5000, // 5 seconds
        minRedTime: 5000,   // 5 seconds
        maxRedTime: 15000,  // 15 seconds (Force green after this)
        yellowTime: 3000    // 3 seconds
    });

    // Refs to hold latest values for the interval closure
    const stateRef = useRef({ counts, signalState, lastSwitchTime, thresholds });
    const previousSignalStateRef = useRef<'red' | 'green' | 'yellow'>('green');

    useEffect(() => {
        stateRef.current = { counts, signalState, lastSwitchTime, thresholds };
    }, [counts, signalState, lastSwitchTime, thresholds]);

    useEffect(() => {
        const checkLogic = () => {
            const { counts, signalState, lastSwitchTime, thresholds } = stateRef.current;
            const now = Date.now();
            const timeSinceSwitch = now - lastSwitchTime;

            const weightedPedestrians = counts.pedestrianCount * thresholds.pedestrianMultiplier;
            const weightedVehicles = counts.vehicleCount * thresholds.vehicleMultiplier;
            const isPedestrianPriority = weightedPedestrians > weightedVehicles;

            if (signalState === 'green') {
                // If it's been green long enough AND pedestrians need to cross
                if (timeSinceSwitch >= thresholds.minGreenTime && isPedestrianPriority) {
                    previousSignalStateRef.current = 'green';
                    setSignalState('yellow');
                    setLastSwitchTime(now);
                    // console.log("Switching Green -> Yellow");
                }
            } else if (signalState === 'yellow') {
                // Yellow always transitions to Red after fixed time
                if (timeSinceSwitch >= thresholds.yellowTime) {
                    // Check where we came from
                    if (previousSignalStateRef.current === 'green') {
                        setSignalState('red');
                        // console.log("Switching Yellow -> Red");
                    } else {
                        // We came from Red, intending to go Green.
                        // SAFETY CHECK: If a pedestrian appeared during Yellow, ABORT and go back to Red.
                        if (isPedestrianPriority) {
                            setSignalState('red');
                            // console.log("Safety Abort: Yellow -> Red (Pedestrian detected)");
                        } else {
                            setSignalState('green');
                            // console.log("Switching Yellow -> Green");
                        }
                    }
                    setLastSwitchTime(now);
                }
            } else if (signalState === 'red') {
                // Determine if we should switch back to Green
                const minRedTimePassed = timeSinceSwitch >= thresholds.minRedTime;
                const maxRedTimePassed = timeSinceSwitch >= thresholds.maxRedTime; // Force switch
                const vehiclesPriority = !isPedestrianPriority || counts.pedestrianCount === 0;

                if (minRedTimePassed) {
                    if (maxRedTimePassed || vehiclesPriority) {
                        previousSignalStateRef.current = 'red';
                        setSignalState('yellow'); // Go to Yellow first
                        setLastSwitchTime(now);
                        // console.log("Switching Red -> Yellow");
                    }
                }
            }
        };

        const interval = setInterval(checkLogic, 100); // Check every 100ms
        return () => clearInterval(interval);
    }, []); // Empty dependency array ensures interval is never reset

    const updateCounts = (pedestrians: number, vehicles: number) => {
        setCounts({ pedestrianCount: pedestrians, vehicleCount: vehicles });
    };

    const updateThresholds = (key: keyof TrafficState['thresholds'], value: number) => {
        setThresholds(prev => ({ ...prev, [key]: value }));
    };

    return (
        <TrafficContext.Provider value={{
            ...counts,
            signalState,
            thresholds,
            updateCounts,
            updateThresholds
        }}>
            {children}
        </TrafficContext.Provider>
    );
};

export const useTraffic = () => {
    const context = useContext(TrafficContext);
    if (!context) throw new Error('useTraffic must be used within a TrafficProvider');
    return context;
};

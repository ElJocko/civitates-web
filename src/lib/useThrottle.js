import { useRef, useEffect, useMemo } from 'react';
import throttle from 'lodash.throttle';

const useThrottle = (callback) => {
    const ref = useRef();

    useEffect(() => {
        ref.current = callback;
    }, [callback]);

    const throttledCallback = useMemo(() => {
        const func = (param) => {
            ref.current?.(param);
        };

        return throttle(func, 100, { leading: true, trailing: true });
    }, []);

    return throttledCallback;
};

export default useThrottle;
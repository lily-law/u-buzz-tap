import React, { useEffect } from 'react';
import {beep, stop} from './sound';
import './BigButton.css';

export default function BigButton({buzz, muted}) {
    const handleButtonPress = e => {
        e.preventDefault();
        buzz();
        !muted && beep();
        window && window.navigator.vibrate(10000);
    }
    const handleButtonRelease = () => {
        !muted && stop();
        window && window.navigator.vibrate(0);
    }
    useEffect(() => {
        return () => {
            !muted && stop();
            window && window.navigator.vibrate(0);
        }
    }, [muted]);
    return <button className="big-button" onMouseDown={handleButtonPress} onMouseUp={handleButtonRelease}></button>
}
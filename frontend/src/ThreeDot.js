import React from 'react';
import './ThreeDot.css';

const ThreeDot = ({ variant, color, size, text, textColor }) => {
    return (
        <div className={`three-dot ${variant} ${size}`}>
            <div className="dot" style={{ backgroundColor: color }}></div>
            <div className="dot" style={{ backgroundColor: color }}></div>
            <div className="dot" style={{ backgroundColor: color }}></div>
            {text && <div className="loading-text" style={{ color: textColor }}>{text}</div>}
        </div>
    );
};

export default ThreeDot;

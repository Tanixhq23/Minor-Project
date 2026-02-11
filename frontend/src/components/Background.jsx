import React from 'react';
import './Background.css';

const Background = () => {
  return (
    <div className="dynamic-background">
      <div className="shape shape-1"></div>
      <div className="shape shape-2"></div>
      <div className="shape shape-3"></div>
      <div className="blur-overlay"></div>
    </div>
  );
};

export default Background;

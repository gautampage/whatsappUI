"use client";
import lottie from "lottie-web";
import React, { useEffect, useRef } from "react";

const LottieWrapper = ({ animationData, width, height }) => {
  const htmlElementRef = useRef(null);
  const lottieJsonInstance = useRef();

  useEffect(() => {
    if (htmlElementRef.current) {
      lottieJsonInstance.current = lottie.loadAnimation({
        animationData,
        container: htmlElementRef.current,
      });
    }
    return () => {
      lottieJsonInstance.current?.destroy();
    };
  }, [animationData]);

  return <div style={{ width, height }} ref={htmlElementRef}></div>;
};

export default LottieWrapper;

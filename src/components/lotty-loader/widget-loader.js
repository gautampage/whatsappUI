import React from "react";
import LottieWrapper from "./lotty-wrapper";
import ThreeDotRevolvingLottieJSON from "./three-dot-revolving-loader.json";

export const WidgetLoader = ({ isLoading = false }) => {
  return (
    <div
      style={{
        position: "absolute",
        height: "100%",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#e6f5f590",
        opacity: 10,
        zIndex: 103,
      }}
    >
      {isLoading ? (
        <>
          <div className="res150-overlay fixed overflow-hidden bg-gray-700 opacity-75 flex flex-col items-center justify-center z-[1000]"></div>
          <div className="res150-overlay fixed overflow-hidden opacity-100 flex flex-col items-center justify-center z-[1050]">
            <LottieWrapper
              animationData={ThreeDotRevolvingLottieJSON}
              width={"90px"}
              height={"90px"}
            />
          </div>
        </>
      ) : null}
    </div>
  );
};

export default WidgetLoader;

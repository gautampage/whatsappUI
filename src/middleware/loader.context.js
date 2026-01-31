"use client";
import React, { createContext, useContext, useState } from "react";
import FullScreenBackdropLoader from "./../components/lotty-loader/full-screen-backdrop-loader";
const LoaderContext = createContext();

// Create the provider component
export const LoaderProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);

  const showLoader = () => {
    setIsLoading(true);
  };
  const hideLoader = () => {
    setIsLoading(false);
  };

  return (
    <LoaderContext.Provider
      value={{ isLoading, showLoader, hideLoader }}
      data-testid="loader-provider"
    >
      <FullScreenBackdropLoader isLoading={isLoading} />
      {children}
    </LoaderContext.Provider>
  );
};

// Custom hook to use the LoaderContext
export const useLoader = () => {
  return useContext(LoaderContext);
};

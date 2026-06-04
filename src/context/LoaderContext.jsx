import React, { createContext, useContext, useState } from "react";
import Loading from "./Loading";

// Create a context for the loader
const LoaderContext = createContext();

// Create a provider component
export const LoaderProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);

  // Functions to show/hide loader
  const showLoader = () => setLoading(true);
  const hideLoader = () => setLoading(false);

  return (
    <LoaderContext.Provider value={{ loading, showLoader, hideLoader }}>
      {loading && <Loading />}
      {children}
    </LoaderContext.Provider>
  );
};

// Custom hook to use loader anywhere
export const useLoader = () => useContext(LoaderContext);

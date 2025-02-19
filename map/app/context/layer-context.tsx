import { createContext, useState } from "react";

type LayerOptions = {
  showFlux: boolean;
  showTransit: boolean;
  showBikeLanes: boolean;
};

type LayerSetters = {
  setShowFlux: (show: boolean) => void;
  setShowTransit: (show: boolean) => void;
  setShowBikeLanes: (show: boolean) => void;
};

type LayerContextType = LayerOptions & LayerSetters;

/**
 * Context for managing the layer state
 */
export const LayerContext = createContext<LayerContextType>({
  showFlux: true,
  showTransit: true,
  showBikeLanes: true,
  setShowFlux: () => {},
  setShowTransit: () => {},
  setShowBikeLanes: () => {},
});

export const LayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [showFlux, setShowFlux] = useState(true);
  const [showTransit, setShowTransit] = useState(true);
  const [showBikeLanes, setShowBikeLanes] = useState(true);

  return (
    <LayerContext.Provider
      value={{
        showFlux,
        showTransit,
        showBikeLanes,
        setShowFlux,
        setShowTransit,
        setShowBikeLanes,
      }}
    >
      {children}
    </LayerContext.Provider>
  );
};

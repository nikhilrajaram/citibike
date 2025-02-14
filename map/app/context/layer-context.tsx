import { createContext, useState } from "react";

type LayerOptions = {
  showFlux: boolean;
  showBikeLanes: boolean;
};

type LayerSetters = {
  setShowFlux: (show: boolean) => void;
  setShowBikeLanes: (show: boolean) => void;
};

type LayerContextType = LayerOptions & LayerSetters;

export const LayerContext = createContext<LayerContextType>({
  showFlux: true,
  showBikeLanes: true,
  setShowFlux: () => {},
  setShowBikeLanes: () => {},
});

export const LayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [showFlux, setShowFlux] = useState(true);
  const [showBikeLanes, setShowBikeLanes] = useState(true);

  return (
    <LayerContext.Provider
      value={{ showFlux, showBikeLanes, setShowFlux, setShowBikeLanes }}
    >
      {children}
    </LayerContext.Provider>
  );
};

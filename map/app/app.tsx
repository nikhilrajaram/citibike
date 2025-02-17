"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BikeMap } from "./components/bike-map";
import { FluxProvider } from "./context/flux-context";
import { LayerProvider } from "./context/layer-context";
import { Sidebar } from "./sidebar/sidebar";

const queryClient = new QueryClient();

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LayerProvider>
        <FluxProvider>
          <div>
            <Sidebar />
            <div className="w-full h-full z-0">
              <BikeMap />
            </div>
          </div>
        </FluxProvider>
      </LayerProvider>
    </QueryClientProvider>
  );
};

"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider, theme } from "antd";
import { BikeMap } from "./components/bike-map";
import { Sidebar } from "./components/sidebar/sidebar";
import { FluxProvider } from "./context/flux-context";
import { LayerProvider } from "./context/layer-context";

const queryClient = new QueryClient();

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
        }}
      >
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
      </ConfigProvider>
    </QueryClientProvider>
  );
};

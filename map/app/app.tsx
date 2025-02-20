"use client";
import { BikeMap } from "@/app/components/bike-map";
import { Sidebar } from "@/app/components/sidebar/sidebar";
import { FluxProvider } from "@/app/context/flux-context";
import { LayerProvider } from "@/app/context/layer-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider, theme } from "antd";

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

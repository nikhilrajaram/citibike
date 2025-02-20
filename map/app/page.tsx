import { App } from "@/app/app";

export default function Home() {
  return (
    <div>
      <link
        href="https://api.mapbox.com/mapbox-gl-js/v2.6.1/mapbox-gl.css"
        rel="stylesheet"
      ></link>
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <App />
      </main>
    </div>
  );
}

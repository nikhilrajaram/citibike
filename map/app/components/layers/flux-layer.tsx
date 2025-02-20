import { Typography } from "antd";
import Title from "antd/es/typography/Title";
import * as d3 from "d3";
import { useCallback, useContext, useEffect, useState } from "react";
import { Layer, MapMouseEvent, Source, useMap } from "react-map-gl";
import { FluxContext } from "../../context/flux-context";
import { FluxProperties, useFlux } from "../../hooks/use-flux";
import { clamp } from "../../util/clamp";
import { BikeStationPopupContent } from "../popup/bike-station-popup-content";
import { CloseablePopup } from "../popup/closeable-popup";
import { LAYERS } from "./layers";

export const FluxLayer = () => {
  const { startDate, endDate, startTime, endTime, daysOfWeek } =
    useContext(FluxContext);

  const {
    isPending,
    fluxCollection: fluxCollection,
    minFlux,
    maxFlux,
    maxRides,
  } = useFlux({
    startDate,
    endDate,
    startTime,
    endTime,
    daysOfWeek,
  });

  const map = useMap();
  const [hoveredStation, setHoveredStation] = useState<{
    longitude: number;
    latitude: number;
    properties: FluxProperties;
  } | null>(null);
  const [pinnedStations, setPinnedStations] = useState<
    {
      longitude: number;
      latitude: number;
      properties: FluxProperties;
    }[]
  >([]);
  const [cursor, setCursor] = useState<"default" | "pointer">("default");

  const onMouseEnter = useCallback(
    (e: MapMouseEvent) => {
      const shouldShowPopup = (map.current?.getZoom() || -Infinity) >= 12;
      if (!shouldShowPopup) {
        return;
      }
      const station = e.features?.[0] as GeoJSON.Feature<
        GeoJSON.Point,
        GeoJSON.GeoJsonProperties
      >;
      // if the station is pinned, don't render a hover popup
      if (
        pinnedStations.find(
          (s) => s.properties.stationId === station.properties?.stationId
        )
      ) {
        return;
      }
      setCursor("pointer");
      if (!hoveredStation && station) {
        setHoveredStation({
          longitude: station.geometry.coordinates[0],
          latitude: station.geometry.coordinates[1],
          properties: station.properties as FluxProperties,
        });
      }
    },
    [map, pinnedStations, hoveredStation]
  );

  const onMouseLeave = useCallback(() => {
    setCursor("default");
    setHoveredStation(null);
  }, []);

  const onClick = useCallback(
    (e: MapMouseEvent) => {
      if (e.features && e.features.length > 0) {
        // Prevent click from propagating to the map
        e.originalEvent.stopPropagation();
        const station = e.features[0] as GeoJSON.Feature<
          GeoJSON.Point,
          GeoJSON.GeoJsonProperties
        >;
        const matchingPinnedStation = pinnedStations.find(
          (s) => s.properties.stationId === station.properties?.stationId
        );
        if (matchingPinnedStation) {
          // if the station is already pinned, unpin it
          setHoveredStation(matchingPinnedStation);
          setPinnedStations((prev) =>
            prev.filter(
              (s) => s.properties.stationId !== station.properties?.stationId
            )
          );
        } else {
          setPinnedStations((prev) => [
            ...prev,
            {
              longitude: station.geometry.coordinates[0],
              latitude: station.geometry.coordinates[1],
              properties: station.properties as FluxProperties,
            },
          ]);
          setHoveredStation(null);
        }
      }
    },
    [pinnedStations]
  );

  const removePinnedStation = (index: number) => {
    setPinnedStations((prev) => prev.filter((_, i) => i !== index));
    return true;
  };

  useEffect(() => {
    const currMap = map.current;
    if (!currMap) {
      return;
    }

    currMap.on("mouseenter", LAYERS.FLUX, onMouseEnter);
    currMap.on("mouseleave", LAYERS.FLUX, onMouseLeave);
    currMap.on("click", LAYERS.FLUX, onClick);

    return () => {
      currMap.off("mouseenter", LAYERS.FLUX, onMouseEnter);
      currMap.off("mouseleave", LAYERS.FLUX, onMouseLeave);
      currMap.off("click", LAYERS.FLUX, onClick);
    };
  }, [map, onMouseEnter, onMouseLeave, onClick]);

  useEffect(() => {
    const currMap = map.current;
    if (!currMap) {
      return;
    }
    currMap.getCanvas().style.cursor = cursor;
  }, [cursor, map]);

  if (isPending || !fluxCollection) {
    return null;
  }

  const fluxes = fluxCollection.features.map((f) => f.properties.flux);

  if (
    maxRides === undefined ||
    minFlux === undefined ||
    maxFlux === undefined ||
    maxRides === 0 ||
    (minFlux === 0 && maxFlux === 0)
  ) {
    // no information
    // todo: show message
    return null;
  }

  const absExtent = Math.max(Math.abs(minFlux), Math.abs(maxFlux));

  // todo: better binning/color grading
  // currently just uses a heuristic for binning with some hard-coded behavior
  // relies on d3.ticks to produce "nice" bins
  // uses a symmetric linear scale centered around zero for color grading
  // undesirable consequences:
  //  - no midpoint bins centered about zero as bins border zero
  //  - bin numbers vary and can reach up to 7
  const nBins = clamp(Math.round((maxFlux - minFlux) / 5), 2, 5);
  const ticks = d3.ticks(minFlux, maxFlux, nBins);
  const bins = d3.bin().thresholds(ticks)(fluxes);

  /**
   * Used to color grade the station markers on the map based on net flux
   */
  const fluxColorScale = d3
    .scaleLinear<string>()
    .domain([-absExtent, 0, absExtent])
    .range(["red", "rgb(255, 237, 148)", "rgb(0, 209, 0)"]);
  // extend the outer bins to the domain of the color scale
  const fluxColorScaleDomain = fluxColorScale.domain();
  bins[0].x0 = fluxColorScaleDomain[0];
  bins[bins.length - 1].x1 =
    fluxColorScaleDomain[fluxColorScaleDomain.length - 1];

  /**
   * Returns the color value for a flux value
   */
  const colorGradeFlux = (flux: number) => {
    // hard code yellow value
    if (flux === 0) {
      return "rgb(255, 237, 148)";
    }
    // clamp the value within the domain of the scale
    const bucketValue =
      flux <= -absExtent
        ? -absExtent
        : flux >= absExtent
        ? absExtent
        : (bins.find((b) => (b.x0 as number) <= flux && flux < (b.x1 as number))
            ?.x0 as number);
    return fluxColorScale(bucketValue);
  };

  const FluxLegend = () => {
    if (
      !fluxColorScale ||
      !bins ||
      !Number.isFinite(minFlux) ||
      !Number.isFinite(maxFlux) ||
      minFlux === maxFlux
    ) {
      return null;
    }

    return (
      <div
        className="fixed top-4 right-4 p-4 rounded shadow-lg z-1 backdrop-filter backdrop-blur-sm blur-border"
        style={{ border: "1px solid #515050" }}
      >
        <div className="flex flex-col items-end justify-between transition-all duration-500">
          <Title level={5}>Net Flow</Title>
          {bins.map((bin, i) => {
            // get bucket endpoints
            const left = bin.x0 as number;
            const right = bin.x1 as number;

            const absLeft = Math.abs(left);
            const absRight = Math.abs(right);
            return (
              <div
                className="w-full items-center flex flex-row justify-between"
                key={`flux-legend-${i}`}
              >
                <div
                  style={{
                    backgroundColor: colorGradeFlux((left + right) / 2),
                    width: "15px",
                    height: "15px",
                    borderRadius: "50%",
                    display: "inline-block",
                    marginRight: "8px",
                  }}
                />
                <div>
                  {i === 0 ? (
                    <Typography.Text>
                      {`${
                        right > 0
                          ? `< ${absRight} arriving`
                          : `> ${absRight} departing`
                      }`}
                    </Typography.Text>
                  ) : i === bins.length - 1 ? (
                    <Typography.Text>
                      {`${
                        left >= 0
                          ? `> ${absLeft} arriving`
                          : `< ${absLeft} departing`
                      }`}
                    </Typography.Text>
                  ) : (
                    <Typography.Text>
                      {Math.min(absLeft, absRight)} -{" "}
                      {Math.max(absLeft, absRight)}{" "}
                      {left <= 0 && right <= 0 ? "departing" : "arriving"}
                    </Typography.Text>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <Source id="flux-data" type="geojson" data={fluxCollection}>
        <Layer
          id={LAYERS.FLUX}
          source="flux-data"
          type="circle"
          paint={{
            "circle-color": [
              "interpolate",
              ["linear"],
              ["get", "flux"],
              -absExtent,
              "red",
              0,
              "rgb(255, 237, 148)",
              absExtent,
              "rgb(0, 209, 0)",
            ],
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["get", "rides"],
              0,
              2,
              maxRides,
              10,
            ],
          }}
        />
        {hoveredStation && (
          <CloseablePopup
            longitude={hoveredStation.longitude}
            latitude={hoveredStation.latitude}
            showCloseButton={false}
            closeButton={false}
            closeOnClick={false}
            anchor="left"
            offset={[10, 0]}
          >
            <BikeStationPopupContent {...hoveredStation.properties} />
          </CloseablePopup>
        )}
        {pinnedStations.map((station, i) => (
          <CloseablePopup
            key={`pinned-station-${i}`}
            longitude={station.longitude}
            latitude={station.latitude}
            anchor="left"
            offset={[10, 0]}
            showCloseButton
            onClose={() => removePinnedStation(i)}
          >
            <BikeStationPopupContent {...station.properties} />
          </CloseablePopup>
        ))}
      </Source>
      <FluxLegend />
    </>
  );
};

import { View } from "react-native";

import BikeMap from "../components/bike-map";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <BikeMap />
    </View>
  );
}

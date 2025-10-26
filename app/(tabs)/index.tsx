import { Image } from "expo-image";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Alert,
} from "react-native";
import { BlurView } from "expo-blur";
import { LineChart } from "react-native-chart-kit";
import { useState, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default function HomeScreen() {
  const [countries, setCountries] = useState<string[]>([]);
  const [likelihoods, setLikelihoods] = useState<number[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<any>(null);

  const API_KEY = "AIzaSyBrk67tUu8xZvgr29jmU1UgRQ9WkVoabM0";
  const genAI = new GoogleGenerativeAI(API_KEY);

  const link =
    "http://carbonflo.ddns.net:8000/climate_prediction_algo?country=all";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(link);
        const data = await response.json();
        const countryNames = Object.keys(data);
        const likelihoodValues = countryNames.map((c) => data[c].likelihood);
        const yearValues = countryNames.map((c) => data[c].year);

        setCountries(countryNames);
        setLikelihoods(likelihoodValues);
        setYears(yearValues);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDataPointClick = async (data: any) => {
    const index = data.index;
    const country = countries[index];
    const likelihood = likelihoods[index];
    const year = years[index];

    // Show temporary tooltip
    setTooltip({
      country,
      likelihood,
      year,
      insight: "Loading AI insight...",
      x: data.x,
      y: data.y,
    });

    try {
      const response = await fetch(
        `http://carbonflo.ddns.net:8000/gemini?text=Generate a short AI insight about why ${country} has a ${likelihood}% likelihood of meeting Paris Agreement goals by ${year}, under 260 characters.`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Fetch as raw text first (not JSON)
      const text = await response.text();
      let result;

      try {
        // Try parsing once
        result = JSON.parse(text);

        // If result is still a stringified JSON, parse again
        if (typeof result === "string") {
          result = JSON.parse(result);
        }
      } catch (err) {
        console.error("Failed to parse AI insight:", err);
        result = { insight: text }; // fallback if not JSON
      }

      setTooltip({
        country,
        likelihood,
        year,
        insight: result.insight || "No AI insight found.",
        x: data.x,
        y: data.y,
      });
    } catch (error) {
      console.error("Error fetching AI insight:", error);
      setTooltip({
        country,
        likelihood,
        year,
        insight: "Error getting AI insight.",
        x: data.x,
        y: data.y,
      });
    }
  };

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#000" />
        <Text>Loading Climate Data...</Text>
      </View>
    );

  const chartWidth = Dimensions.get("window").width - 16;

  return (
    <ScrollView style={{ backgroundColor: "#F5F5DC" }}>
      {/* Header */}
      <BlurView style={{ margin: 1, height: 300 }} intensity={0} tint="dark">
        <Image
          source={require("@/assets/images/Logo.png")}
          style={styles.reactLogo}
        />
        <Text style={{ fontSize: 36, fontWeight: "bold", top: 150, margin: 2 }}>
          CarbonFlo
        </Text>
        <Text style={{ fontSize: 16, fontWeight: "bold", top: 170 }}>
          The World's Commitment Tracker
        </Text>
      </BlurView>

      <View
        style={{
          backgroundColor: "#87CEEB",
          paddingVertical: 10,
          alignItems: "center",
          height: 500,
        }}
      >
        <Text
          style={{
            color: "white",
            fontWeight: "bold",
            fontSize: 18,
            marginBottom: 10,
          }}
        >
          Climate Prediction Likelihoods
        </Text>

        <LineChart
          data={{
            labels: [
              "                                                                               Click on a Dot to find out a detailed AI analysis!",
            ],
            datasets: [{ data: likelihoods.slice(0, 40) }],
          }}
          width={chartWidth}
          height={260}
          yAxisSuffix="%"
          chartConfig={{
            backgroundColor: "transparent",
            backgroundGradientFrom: "#87CEEB",
            backgroundGradientTo: "#87CEEB",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            propsForDots: { r: "3", strokeWidth: "2", stroke: "#ffa726" },
          }}
          bezier
          style={{ marginVertical: 8, borderRadius: 16 }}
          onDataPointClick={(data) => handleDataPointClick(data)}
        />

        {tooltip && tooltip.country && (
          <View
            key={`${tooltip.country}-${tooltip.year}-${tooltip.insight}`}
            style={{
              marginTop: 12,
              backgroundColor: "rgba(0,0,0,0.8)",
              padding: 12,
              borderRadius: 8,
              width: "90%",
              alignSelf: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>
              {tooltip.country}
            </Text>
            <Text style={{ color: "white" }}>
              Likelihood: {tooltip.likelihood}%
            </Text>
            <Text style={{ color: "white" }}>Year: {tooltip.year}</Text>
            <Text style={{ color: "lightgreen", marginTop: 5 }}>
              {tooltip.insight}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  reactLogo: {
    height: 300,
    width: 300,
    left: 160,
    top: 40,
    position: "absolute",
  },
});

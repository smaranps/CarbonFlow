import { Image } from "expo-image";
import {
  Alert,
  StyleSheet,
  TextInput,
  View,
  Button,
  ActivityIndicator,
  Text,
} from "react-native";
import { useState, useEffect } from "react";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts } from "@/constants/theme";
import { Picker } from "@react-native-picker/picker";
import { MotiView, MotiText } from "moti";

export default function TabTwoScreen() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [actions, setActions] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<string[]>([]);

  const api =
    "http://carbonflo.ddns.net:8000/climate_prediction_algo?country=all";

  // Fetch countries from your backend
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch(api);
        const data = await res.json();
        const countryList = Object.keys(data);
        setCountries(countryList);
      } catch (err) {
        console.error("Error fetching countries:", err);
        Alert.alert("Error", "Could not load countries. Check your backend.");
      }
    };
    fetchCountries();
  }, []);

  const handleSubmit = async () => {
    if (!selectedCountry || !actions.trim()) {
      Alert.alert(
        "Missing input",
        "Please select a country and describe your actions."
      );
      return;
    }

    setLoading(true);
    setAiResponse(null);

    try {
      const response = await fetch(
        `http://carbonflo.ddns.net:8000/gemini?text=${encodeURIComponent(
          `Given that the user is from ${selectedCountry} and has done the following actions to benefit the environment: ${actions}, estimate realistic statistics about their contribution to the country's Paris Agreement goal. 
      Show values like: "You contributed around 0.0004% to your country's goal and sped up progress by 0.2 seconds. (Don't use the same prompt, change the numbers to match the amount of actions the user has done)"  
      Follow this with an encouraging message that acknowledges the small impact and motivates them, and include one short piece of feedback on how they can improve. 
      Keep the response under 500 characters and make it sound natural. If the input is negative for the envirnoment, I want you to give me honest and mean feedback on how to improve. Always respond in English. The more detailed or the more impacts that are listed, the higher the % would grow and the more time would be saved. `
        )}`
      );

      const text = await response.text();
      console.log("Raw response:", text);

      let insight = "No AI insight found.";
      try {
        const parsed = JSON.parse(text);

        insight = parsed.insight || parsed.message || parsed || text;
      } catch {
        insight = text;
      }

      setAiResponse(insight);
    } catch (err) {
      console.error("Error getting AI response:", err);
      setAiResponse("Error getting AI insight.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#F5F5DC", dark: "#F5F5DC" }}
      headerImage={
        <Image
          source={require("@/assets/images/Logo.png")}
          style={{ width: 300, height: 300, left: 160, top: 40 }}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={{ fontFamily: Fonts.rounded }}>
          Your Contribution
        </ThemedText>
      </ThemedView>

      <ThemedText style={{ fontFamily: Fonts.rounded }}>
        Enter Actions Here:
      </ThemedText>

      <TextInput
        placeholder="List things you did to benefit the environment"
        value={actions}
        onChangeText={setActions}
        multiline
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 10,
          marginVertical: 10,
          borderRadius: 8,
          color: "white",
        }}
      />

      <ThemedText style={styles.label}>Select Your Country</ThemedText>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedCountry}
          onValueChange={(itemValue) => setSelectedCountry(itemValue)}
        >
          <Picker.Item label="-- Choose a country --" value={null} />
          {countries.map((country) => (
            <Picker.Item key={country} label={country} value={country} />
          ))}
        </Picker>
      </View>

      <View
        style={{
          marginVertical: 10,
          backgroundColor: "#87CEEB",
          padding: 10,
          borderRadius: 20,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Button
          title={loading ? "Analyzing..." : "Analyze my Contributions"}
          onPress={handleSubmit}
          disabled={loading}
          color={"#black"}
        />
      </View>

      {loading && (
        <View style={{ alignItems: "center", marginVertical: 10 }}>
          <ActivityIndicator size="large" color="#00BFA5" />
        </View>
      )}

      {aiResponse && (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600 }}
          style={{
            marginTop: 20,
            padding: 15,
            borderRadius: 10,
            backgroundColor: "rgba(255,255,255,0.1)",
            borderWidth: 1,
            borderColor: "#ccc",
          }}
        >
          <MotiText
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 200, duration: 500 }}
            style={{
              color: "white",
              fontSize: 16,
              lineHeight: 22,
            }}
          >
            {aiResponse}
          </MotiText>
        </MotiView>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
  },
  pickerContainer: {
    borderRadius: 8,
    marginVertical: 0,
    borderWidth: 0,
  },
});

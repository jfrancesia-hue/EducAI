import { Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-apoyoai-50 px-6">
      <Text className="text-center font-semibold text-2xl text-apoyoai-600">ApoyoAI</Text>
      <Text className="mt-3 text-center text-base text-slate-600">
        Tutor IA para alumnos, con canal WhatsApp seguro y seguimiento familiar.
      </Text>
    </View>
  );
}

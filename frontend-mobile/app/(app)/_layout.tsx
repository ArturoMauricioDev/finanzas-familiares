import { Stack } from "expo-router";

import { Loading } from "../../components/ui";
import { useAuthGuard } from "../../hooks/useAuthGuard";

export default function AppLayout() {
  const { session, ready } = useAuthGuard(true);

  if (!ready || !session) return <Loading />;

  return <Stack screenOptions={{ headerShown: false }} />;
}

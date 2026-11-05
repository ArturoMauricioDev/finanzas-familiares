import { useRouter } from "expo-router";
import { useEffect } from "react";

import { Loading } from "../../../components/ui";

export default function HomeScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/family/members");
  }, [router]);

  return <Loading />;
}

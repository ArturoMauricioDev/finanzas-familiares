import { useRouter } from "expo-router";
import { useEffect } from "react";

import { Loading, Page } from "../components/ui";
import { getSession } from "../lib/session";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      const session = await getSession();

      if (!session?.access_token) {
        router.replace("/auth/login");
      } else if (session.needs_profile_setup) {
        router.replace("/profile/setup");
      } else if (session.needs_family_setup) {
        router.replace("/family/select");
      } else {
        router.replace("/family/members");
      }
    };

    redirect();
  }, [router]);

  return (
    <Page title="Finanzas Familiares">
      <Loading />
    </Page>
  );
}

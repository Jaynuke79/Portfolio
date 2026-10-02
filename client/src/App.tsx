import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/home";
import Scheduler from "@/components/scheduler";
import ScheduleAdmin from "@/components/schedule-admin";
import { routeForHash } from "@/lib/hash-route";

function App() {
  const [route, setRoute] = useState(() => routeForHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setRoute(routeForHash(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <>
      {route === "schedule" && <Scheduler />}
      {route === "schedule-admin" && <ScheduleAdmin />}
      {route === "home" && <Home />}
      <Toaster />
    </>
  );
}

export default App;

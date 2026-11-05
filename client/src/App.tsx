import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/home";
import Scheduler from "@/components/scheduler";
import ScheduleAdmin from "@/components/schedule-admin";
import { mayLeave, routeForHash } from "@/lib/hash-route";

function App() {
  const [route, setRoute] = useState(() => routeForHash(window.location.hash));

  useEffect(() => {
    let currentHash = window.location.hash;
    const onHashChange = () => {
      const next = window.location.hash;
      if (routeForHash(next) !== routeForHash(currentHash) && !mayLeave()) {
        history.pushState(null, "", currentHash || window.location.pathname);
        return;
      }
      currentHash = next;
      setRoute(routeForHash(next));
    };
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

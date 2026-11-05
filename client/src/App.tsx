import { lazy, Suspense, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/home";
import { mayLeave, routeForHash } from "@/lib/hash-route";

const Scheduler = lazy(() => import("@/components/scheduler"));
const ScheduleAdmin = lazy(() => import("@/components/schedule-admin"));

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
      {route === "schedule" && (
        <Suspense fallback={null}>
          <Scheduler />
        </Suspense>
      )}
      {route === "schedule-admin" && (
        <Suspense fallback={null}>
          <ScheduleAdmin />
        </Suspense>
      )}
      {route === "home" && <Home />}
      <Toaster />
    </>
  );
}

export default App;

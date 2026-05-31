import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import BookingGate from "@/components/booking-gate";

function getBookingSlug(): string | null {
  const hash = window.location.hash;
  if (hash.startsWith("#book/")) {
    const slug = hash.slice(6);
    return slug || null;
  }
  return null;
}

function App() {
  const [bookingSlug, setBookingSlug] = useState<string | null>(getBookingSlug);

  useEffect(() => {
    const onHashChange = () => setBookingSlug(getBookingSlug());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <TooltipProvider>
      {bookingSlug !== null ? <BookingGate slug={bookingSlug} /> : <Home />}
      <Toaster />
    </TooltipProvider>
  );
}

export default App;

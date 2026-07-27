import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/home";
import BookingGate from "@/components/booking-gate";
import { parseBookingSlug } from "@/lib/booking-slug";

function getBookingSlug(): string | null {
  return parseBookingSlug(window.location.hash);
}

function App() {
  const [bookingSlug, setBookingSlug] = useState<string | null>(getBookingSlug);

  useEffect(() => {
    const onHashChange = () => setBookingSlug(getBookingSlug());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <>
      {bookingSlug !== null ? <BookingGate slug={bookingSlug} /> : <Home />}
      <Toaster />
    </>
  );
}

export default App;

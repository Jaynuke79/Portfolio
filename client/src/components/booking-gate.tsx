import { useState } from "react";
import { Lock, Calendar, Clock, ArrowLeft, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { appointments } from "@/lib/appointments";
import { decryptBookingUrl } from "@/lib/booking-crypto";

function goHome() {
  history.pushState(null, "", window.location.pathname);
  window.dispatchEvent(new Event("hashchange"));
}

interface Props {
  slug: string;
}

export default function BookingGate({ slug }: Props) {
  const appointment = appointments[slug];
  const [password, setPassword] = useState("");
  const [bookingsUrl, setBookingsUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  if (!appointment || !appointment.cipher) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Page not found.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChecking(true);
    setError(null);
    const url = await decryptBookingUrl(appointment.cipher, password);
    if (url) {
      setBookingsUrl(url);
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      setError("Incorrect password.");
      setPassword("");
    }
    setIsChecking(false);
  };

  if (bookingsUrl) {
    return (
      <div className="min-h-[100dvh] bg-background text-foreground flex items-center justify-center px-4">
        <Card className="w-full max-w-md rounded-lg border-border bg-card shadow-none">
          <CardContent className="p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="w-12 h-12 rounded-md bg-brand-soft flex items-center justify-center mb-4">
                <Calendar className="h-5 w-5 text-brand" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight mb-1">{appointment.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
                <Clock className="h-4 w-4" aria-hidden="true" />
                <span>{appointment.duration} min</span>
              </div>
              <p className="text-muted-foreground text-sm text-center">
                The booking page has opened in a new tab. If it didn't open,{" "}
                <a
                  href={bookingsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand underline underline-offset-4"
                >
                  click here
                </a>
                .
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={goHome}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button asChild className="flex-1">
                <a href={bookingsUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Open again
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex items-center justify-center px-4">
      <Card className="w-full max-w-md rounded-lg border-border bg-card shadow-none">
        <CardContent className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-md bg-brand-soft flex items-center justify-center mb-4">
              <Lock className="h-5 w-5 text-brand" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight mb-1">{appointment.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span>{appointment.duration} min</span>
            </div>
            <p className="text-muted-foreground text-sm text-center">{appointment.description}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="booking-password" className="block mb-2">
                Password
              </Label>
              <Input
                id="booking-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-11"
                placeholder="Enter password"
                autoFocus
                required
              />
              {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            </div>
            <Button
              type="submit"
              disabled={isChecking || !password}
              className="w-full h-11 active:scale-[0.98]"
            >
              {isChecking ? "Verifying..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

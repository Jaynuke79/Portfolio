import { useState } from "react";
import { Lock, Calendar, Clock, ArrowLeft, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { appointments } from "@/lib/appointments";

async function sha256hex(input: string): Promise<string> {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

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
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  if (!appointment || !appointment.passwordHash) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-500">Page not found.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChecking(true);
    setError(null);
    const inputHash = await sha256hex(password);
    if (inputHash === appointment.passwordHash) {
      setUnlocked(true);
      window.open(appointment.bookingsUrl, "_blank", "noopener,noreferrer");
    } else {
      setError("Incorrect password.");
      setPassword("");
    }
    setIsChecking(false);
  };

  if (unlocked) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <Card className="glass-morphism border-gray-800 w-full max-w-md rounded-xl">
          <CardContent className="p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 rounded-full bg-gray-900 border border-green-500/30 flex items-center justify-center mb-4 glow-green">
                <Calendar className="h-6 w-6 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">{appointment.name}</h1>
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                <Clock className="h-4 w-4 text-green-400" />
                <span>{appointment.duration} min</span>
              </div>
              <p className="text-gray-400 text-sm text-center">
                The booking page has opened in a new tab. If it didn't open,{" "}
                <a
                  href={appointment.bookingsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 underline"
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
                className="flex-1 border-gray-600 text-gray-300 hover:text-white hover:border-gray-400"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <a
                href={appointment.bookingsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button className="w-full bg-gradient-to-r from-cyan-500 to-green-500 text-black font-semibold">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open again
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <Card className="glass-morphism border-gray-800 w-full max-w-md rounded-xl">
        <CardContent className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-full bg-gray-900 border border-cyan-500/30 flex items-center justify-center mb-4 glow-blue">
              <Lock className="h-6 w-6 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">{appointment.name}</h1>
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
              <Clock className="h-4 w-4 text-green-400" />
              <span>{appointment.duration} min</span>
            </div>
            <p className="text-gray-400 text-sm text-center">{appointment.description}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="booking-password" className="block text-sm font-medium mb-2 text-gray-300">
                Password
              </Label>
              <Input
                id="booking-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-cyan-500 focus:outline-none transition-colors text-white"
                placeholder="Enter password"
                autoFocus
                required
              />
              {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            </div>
            <Button
              type="submit"
              disabled={isChecking || !password}
              className="w-full bg-gradient-to-r from-cyan-500 to-green-500 text-black py-3 rounded-lg font-semibold hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChecking ? "Verifying..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export interface Appointment {
  name: string;
  duration: number;
  description: string;
  cipher: string;
}

type AppointmentConfig = Omit<Appointment, 'cipher'>;

export function bookingCipherEnvKey(slug: string): string {
  return `VITE_BOOKING_CIPHER_${slug.toUpperCase().replace(/-/g, '_')}`;
}

function withCiphers(config: Record<string, AppointmentConfig>): Record<string, Appointment> {
  const result: Record<string, Appointment> = {};
  for (const [slug, appt] of Object.entries(config)) {
    result[slug] = {
      ...appt,
      cipher: (import.meta.env as Record<string, string>)[bookingCipherEnvKey(slug)] ?? '',
    };
  }
  return result;
}

export const appointments = withCiphers({
  "30minchat": {
    name: '30 Minute Chat',
    duration: 30,
    description: 'A quick chat to discuss your needs and how we can help.',
  },
  "15minchat": {
    name: '15 Minute Chat',
    duration: 15,
    description: 'A quick chat to discuss your needs and how we can help.',
  },
});

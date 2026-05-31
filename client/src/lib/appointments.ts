export interface Appointment {
  name: string;
  duration: number;
  description: string;
  passwordHash: string;
  bookingsUrl: string;
}

type AppointmentConfig = Omit<Appointment, 'passwordHash'>;

function withHashes(config: Record<string, AppointmentConfig>): Record<string, Appointment> {
  const result: Record<string, Appointment> = {};
  for (const [slug, appt] of Object.entries(config)) {
    const key = `VITE_BOOKING_HASH_${slug.toUpperCase().replace(/-/g, '_')}`;
    result[slug] = {
      ...appt,
      passwordHash: (import.meta.env as Record<string, string>)[key] ?? '',
    };
  }
  return result;
}

export const appointments = withHashes({
  "30minchat": {
    name: '30 Minute Chat',
    duration: 30,
    description: 'A quick chat to discuss your needs and how we can help.',
    bookingsUrl: 'https://outlook.office.com/bookwithme/user/eca6ce0f7747483294bd3606a9b7613b@mavs.coloradomesa.edu/meetingtype/ubIjnLGqA0-QD0fuOFp5AA2?anonymous&ismsaljsauthenabled&ep=mLinkFromTile',
  },
  "15minchat": {
    name: '15 Minute Chat',
    duration: 15,
    description: 'A quick chat to discuss your needs and how we can help.',
    bookingsUrl: 'https://outlook.office.com/bookwithme/user/eca6ce0f7747483294bd3606a9b7613b@mavs.coloradomesa.edu/meetingtype/a_lhSDGWxEWXuHJz-maq9A2?anonymous&ismsaljsauthenabled&ep=mLinkFromTile',
  },
});

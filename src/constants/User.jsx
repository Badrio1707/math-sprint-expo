const DEFAULT_USER_DATA = {
  coin: 0, // Koin yang dapat langsung digunakan
  holded_coin: 0, // Koin yang masih ditahan (misalnya pending reward)
  iq: 0, // Total IQ points
  contribute: 0, // Kontribusi pemain (misalnya ke leaderboard/global event)
  stage_level: 1, // Stage atau chapter tertinggi yang telah dibuka
  daily_login: {
    streak: 0, // Login berturut-turut
    last_login: null, // Timestamp login terakhir
    claimed_today: false,
  },
};

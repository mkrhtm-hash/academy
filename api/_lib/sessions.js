export const sessionJson = (s) => ({
  id: s.id,
  title: s.title,
  mentor_name: s.mentor_name,
  start_time: s.start_time,
  duration_minutes: s.duration_minutes,
  capacity: s.capacity,
  seats_left: Math.max(0, s.capacity - s.seats_taken),
  topic: s.topic,
  level: s.level,
  booked: !!s.booked,
})

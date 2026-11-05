export interface MusicTrack {
  id: string
  title: string
  artist: string
  performer?: string
  src?: string
  youtubeId?: string
  cover: string
  mood: "focus" | "quiet" | "personal"
  source?: string
  license?: string
  lyrics?: string
}

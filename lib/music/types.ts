import type { musicMoods } from "./moods.mjs"

export type MusicMood = (typeof musicMoods)[number]

export interface MusicTrack {
  id: string
  title: string
  artist: string
  performer?: string
  src?: string
  youtubeId?: string
  cover: string
  mood: MusicMood
  source?: string
  license?: string
  lyrics?: string
}

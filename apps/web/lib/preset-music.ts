/**
 * Curated royalty-free background music presets — public domain or CC0/CC-BY-SA
 * classical wedding pieces, self-hosted in apps/web/public/music/ (re-encoded to
 * 96kbps MP3) so playback doesn't depend on an external CDN staying up.
 *
 * `credit` is shown wherever a track is listed — satisfies attribution for the
 * two CC BY-SA recordings without needing separate attribution UI elsewhere.
 */
export interface PresetMusicTrack {
  id: string;
  title: string;
  url: string;
  credit?: string;
}

export const PRESET_MUSIC_TRACKS: PresetMusicTrack[] = [
  {
    id: "clair-de-lune",
    title: "Clair de Lune — Debussy",
    url: "/music/clair-de-lune.mp3",
  },
  {
    id: "mendelssohn",
    title: "Wedding March — Mendelssohn",
    url: "/music/mendelssohn.mp3",
  },
  {
    id: "pachelbel",
    title: "Canon in D — Pachelbel",
    url: "/music/pachelbel.mp3",
    credit: "piano: Lee Galloway, CC BY-SA 3.0",
  },
  {
    id: "wagner",
    title: "Bridal Chorus — Wagner",
    url: "/music/wagner.mp3",
    credit: "piano: Jason Han, CC BY-SA 4.0",
  },
];

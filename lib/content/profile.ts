import "server-only"
import source from "@/generated/profile.json"
import type { AuthorProfile } from "./types"

/** Public author information, managed separately from presentation components. */
export const authorProfile: AuthorProfile = source

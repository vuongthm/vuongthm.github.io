import { Mail, MessageCircle } from "lucide-react"
import { Github } from "./github"
import { siteConfig } from "@/lib/site.config"
import socials from "@/site/socials.json"
export function SocialLinks() {
  const links = [
    { id: "github", label: "GitHub", url: siteConfig.github, icon: Github },
    { id: "instagram", label: "Instagram", url: socials.instagram, icon: Instagram },
    { id: "linkedin", label: "LinkedIn", url: socials.linkedin, icon: LinkedIn },
    { id: "facebook", label: "Facebook", url: socials.facebook, icon: Facebook },
    { id: "zalo", label: "Zalo", url: socials.zalo, icon: MessageCircle },
    { id: "email", label: "Email", url: `mailto:${siteConfig.email}`, icon: Mail },
  ]
  return (
    <div className="footer-socials">
      {links
        .filter((link) => link.url && (link.id === "email" || /^https:\/\//.test(link.url)))
        .map(({ id, label, url, icon: Icon }) => (
          <a
            href={url}
            key={id}
            aria-label={label}
            title={label}
            target={id === "email" ? undefined : "_blank"}
            rel={id === "email" ? undefined : "noreferrer"}
          >
            <Icon size={17} />
          </a>
        ))}
    </div>
  )
}

function LinkedIn({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M5.2 8.4H2V22h3.2V8.4ZM3.6 2a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8ZM22 13.5c0-4.1-2.2-5.7-4.7-5.7-2 0-3.1 1.1-3.6 1.9V8.4h-3.2V22h3.2v-7.4c0-2 .9-3.3 2.6-3.3s2.4 1.3 2.4 3.3V22H22v-8.5Z" />
    </svg>
  )
}

function Instagram({ size = 17 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}
function Facebook({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.7 22v-9h3l.5-3.5h-3.5V7.3c0-1 .3-1.7 1.8-1.7h1.9V2.4c-.3 0-1.5-.2-2.8-.2-2.8 0-4.7 1.7-4.7 4.8v2.5H7V13h2.9v9z" />
    </svg>
  )
}

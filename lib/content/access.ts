export interface AccessRule {
  href: string
  back: string
  title: string
  kind: "content" | "vault"
  probe?: string
}

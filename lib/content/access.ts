export interface AccessRule {
  href: string
  back: string
  title: string
  kind: "content" | "vault"
  scope?: string
  probe?: string
}

"use client"
import { useState, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"
import { useTheme } from "next-themes"
import { Check, Monitor, Moon, Palette, Sun, X } from "lucide-react"
import { Dialog } from "@/components/search/dialog"
import { useSite } from "@/components/providers/site-provider"
import { currentPalette, paletteIds, setPalette, subscribePalette } from "@/lib/appearance"
import { appearanceMessages } from "@/lib/i18n/appearance"
import { playSound } from "@/lib/interaction-sound"

export function AppearancePicker() {
  const [open, setOpen] = useState(false)
  const palette = useSyncExternalStore(subscribePalette, currentPalette, () => "winter")
  const { theme, setTheme } = useTheme()
  const { locale, dictionary: m } = useSite(),
    t = appearanceMessages[locale]
  return (
    <>
      <button
        className="icon-button palette-toggle"
        aria-label={t.open}
        title={t.open}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Palette size={18} />
        <span className="palette-indicator" aria-hidden="true" />
      </button>
      {open &&
        createPortal(
          <Dialog label={t.title} className="appearance-dialog" onClose={() => setOpen(false)}>
            <div className="appearance-heading">
              <div>
                <span className="eyebrow">VUONG / PALETTE</span>
                <h2>{t.title}</h2>
                <p>{t.intro}</p>
              </div>
              <button className="icon-button" aria-label={m.close} onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <fieldset className="palette-options">
              <legend>{t.colors}</legend>
              {paletteIds.map((id) => (
                <label key={id} className={`palette-option palette-${id}`} title={t[`${id}Detail`]}>
                  <input
                    type="radio"
                    name="colour-palette"
                    value={id}
                    checked={palette === id}
                    onChange={() => {
                      setPalette(id)
                      playSound("switch")
                    }}
                  />
                  <span className="palette-sample" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                    <span>V.</span>
                  </span>
                  <span className="palette-description">
                    <strong>{t[id]}</strong>
                    <small>{t[`${id}Detail`]}</small>
                  </span>
                  <span className="palette-check" aria-hidden="true">
                    {palette === id && <Check size={15} />}
                  </span>
                </label>
              ))}
            </fieldset>
            <fieldset className="appearance-mode">
              <legend>{t.mode}</legend>
              <div>
                {(["light", "dark", "system"] as const).map((mode) => {
                  const Icon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor
                  return (
                    <label key={mode}>
                      <input
                        type="radio"
                        name="appearance-mode"
                        value={mode}
                        checked={theme === mode}
                        onChange={() => setTheme(mode)}
                      />
                      <span>
                        <Icon size={15} />
                        {t[mode]}
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
            <p className="appearance-saved">{t.saved}</p>
          </Dialog>,
          document.body,
        )}
    </>
  )
}

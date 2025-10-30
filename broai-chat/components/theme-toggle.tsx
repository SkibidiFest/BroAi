"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <Button variant="outline" size="lg" disabled className="gap-2 bg-transparent" />
  }

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="gap-2 rounded-full px-4"
    >
      {theme === "dark" ? (
        <>
          <Sun className="h-5 w-5" />
          <span className="font-medium">Mode Clair</span>
        </>
      ) : (
        <>
          <Moon className="h-5 w-5" />
          <span className="font-medium">Mode Sombre</span>
        </>
      )}
    </Button>
  )
}

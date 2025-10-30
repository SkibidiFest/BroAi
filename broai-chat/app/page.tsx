"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { Upload } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  const [username, setUsername] = useState("")
  const [profileImage, setProfileImage] = useState<string>("")
  const [previewImage, setPreviewImage] = useState<string>("")
  const router = useRouter()

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setProfileImage(result)
        setPreviewImage(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleStart = () => {
    if (!username.trim()) return

    sessionStorage.setItem("broai_username", username)
    if (profileImage) {
      sessionStorage.setItem("broai_profile_image", profileImage)
    }

    // Redirect to chat
    router.push("/chat")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleStart()
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Image
              src="/broai-avatar.png"
              alt="BroAI Avatar"
              width={120}
              height={120}
              className="rounded-none shadow-lg"
              priority
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-balance bg-gradient-to-r from-foreground via-muted-foreground to-foreground/80 bg-clip-text text-transparent">
            BroAI
          </h1>
          <p className="text-xl md:text-2xl font-semibold text-foreground text-pretty">
            L'intelligence artificielle la plus imprévisible
          </p>
        </div>

        <Card className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Pseudo</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Entrez votre pseudo..."
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-image">Image de profil (optionnel)</Label>
            <div className="flex items-center gap-4">
              {previewImage && (
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-border">
                  <Image src={previewImage || "/placeholder.svg"} alt="Profile preview" fill className="object-cover" />
                </div>
              )}
              <div className="flex-1">
                <label htmlFor="profile-image" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border border-input rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">Choisir une image</span>
                  </div>
                  <input
                    id="profile-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          <Button onClick={handleStart} disabled={!username.trim()} className="w-full" size="lg">
            Commencer à discuter
          </Button>
        </Card>
      </div>
    </main>
  )
}

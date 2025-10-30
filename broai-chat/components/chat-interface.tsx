"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send, Loader2 } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase-client"
import Image from "next/image"

type Message = {
  id: string
  content: string
  sender_type: "user" | "admin"
  created_at: string
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [username, setUsername] = useState<string>("Utilisateur")
  const [profileImage, setProfileImage] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = getSupabaseBrowserClient()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isGenerating])

  useEffect(() => {
    const storedUsername = sessionStorage.getItem("broai_username")
    const storedImage = sessionStorage.getItem("broai_profile_image")

    if (storedUsername) setUsername(storedUsername)
    if (storedImage) setProfileImage(storedImage)
  }, [])

  useEffect(() => {
    const archiveConversation = async () => {
      if (conversationId) {
        await supabase.from("conversations").update({ status: "archived" }).eq("id", conversationId)
      }
    }

    const handleBeforeUnload = () => {
      if (conversationId) {
        navigator.sendBeacon(`/api/archive-conversation?id=${conversationId}`)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      archiveConversation()
    }
  }, [conversationId, supabase])

  useEffect(() => {
    async function createConversation() {
      await supabase.rpc("cleanup_empty_conversations")

      const { data, error } = await supabase
        .from("conversations")
        .insert({
          status: "active",
          user_name: username,
          user_avatar: profileImage || null,
        })
        .select()
        .single()

      if (data && !error) {
        setConversationId(data.id)
        console.log("[v0] Conversation created:", data.id)

        const channel = supabase
          .channel(`conversation-${data.id}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `conversation_id=eq.${data.id}`,
            },
            (payload) => {
              console.log("[v0] Realtime message received:", payload)
              const newMessage = payload.new as Message
              if (newMessage.sender_type === "admin") {
                console.log("[v0] Admin message detected, stopping generating")
                setMessages((prev) => {
                  // Check if message already exists
                  if (prev.some((m) => m.id === newMessage.id)) {
                    return prev
                  }
                  return [...prev, newMessage]
                })
                setIsGenerating(false)
              }
            },
          )
          .subscribe()

        const pollInterval = setInterval(async () => {
          console.log("[v0] Polling for new messages...")
          const { data: allMessages } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", data.id)
            .order("created_at", { ascending: true })

          if (allMessages && allMessages.length > 0) {
            console.log("[v0] Found messages:", allMessages.length)
            setMessages((prev) => {
              // Merge messages, avoiding duplicates
              const existingIds = new Set(prev.map((m) => m.id))
              const newMessages = allMessages.filter((m) => !existingIds.has(m.id))

              if (newMessages.length > 0) {
                console.log("[v0] Adding new messages:", newMessages.length)
                // Check if any new message is from admin
                const hasAdminMessage = newMessages.some((m) => m.sender_type === "admin")
                if (hasAdminMessage) {
                  console.log("[v0] Admin message found in poll, stopping generating")
                  setIsGenerating(false)
                }
                return [...prev, ...newMessages]
              }
              return prev
            })
          }
        }, 2000)

        return () => {
          console.log("[v0] Cleaning up conversation listeners")
          supabase.removeChannel(channel)
          clearInterval(pollInterval)
        }
      }
    }

    createConversation()
  }, [supabase, username, profileImage])

  const handleSend = async () => {
    if (!input.trim() || !conversationId || isGenerating) return

    const userMessage = input.trim()
    setInput("")
    setIsGenerating(true)

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      content: userMessage,
      sender_type: "user",
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Card className="flex flex-col h-[600px] shadow-xl">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isGenerating && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-center">
            <p className="text-lg">Bonjour {username} ! Posez-moi n'importe quelle question.</p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender_type === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`flex gap-2 max-w-[80%] ${message.sender_type === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                {message.sender_type === "user" && profileImage ? (
                  <Image
                    src={profileImage || "/placeholder.svg"}
                    alt={username}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                ) : message.sender_type === "user" ? (
                  <span className="text-xs font-semibold">{username[0]?.toUpperCase()}</span>
                ) : (
                  <Image src="/broai-avatar.png" alt="BroAI" width={32} height={32} className="object-cover" />
                )}
              </div>
              <div
                className={`rounded-lg px-4 py-2 ${
                  message.sender_type === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
              </div>
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted text-foreground">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-sm">Generating...</p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Tapez votre message..."
            disabled={isGenerating || !conversationId}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!input.trim() || isGenerating || !conversationId} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

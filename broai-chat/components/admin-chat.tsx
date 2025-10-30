"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Send, Sparkles, Loader2 } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase-client"

type Message = {
  id: string
  content: string
  sender_type: "user" | "admin"
  created_at: string
  is_read: boolean
}

type AdminChatProps = {
  conversationId: string
  onMessageSent?: () => void
}

export function AdminChat({ conversationId, onMessageSent }: AdminChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = getSupabaseBrowserClient()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    loadMessages()
    markMessagesAsRead()

    const pollInterval = setInterval(async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      if (data) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id))
          const newMessages = data.filter((m) => !existingIds.has(m.id))

          if (newMessages.length > 0) {
            // Mark new user messages as read
            if (newMessages.some((m) => m.sender_type === "user")) {
              markMessagesAsRead()
            }
            return data
          }
          return prev
        })
      }
    }, 2000)

    // Subscribe to new messages via Realtime
    const channel = supabase
      .channel(`admin-conversation-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) {
              return prev
            }
            return [...prev, newMessage]
          })
          if (newMessage.sender_type === "user") {
            markMessagesAsRead()
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      clearInterval(pollInterval)
    }
  }, [conversationId, supabase])

  async function loadMessages() {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (data) {
      setMessages(data)
    }
  }

  async function markMessagesAsRead() {
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .eq("sender_type", "user")
      .eq("is_read", false)

    onMessageSent?.()
  }

  const handleAISuggest = async () => {
    if (isLoadingAI || messages.length === 0) return

    setIsLoadingAI(true)
    try {
      const response = await fetch("/api/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      })

      if (response.ok) {
        const { suggestion } = await response.json()
        setInput(suggestion)
      }
    } catch (error) {
      console.error("[v0] Failed to get AI suggestion:", error)
    } finally {
      setIsLoadingAI(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isSending) return

    const messageContent = input.trim()
    setInput("")
    setIsSending(true)

    try {
      const tempMessage: Message = {
        id: crypto.randomUUID(),
        content: messageContent,
        sender_type: "admin",
        created_at: new Date().toISOString(),
        is_read: true,
      }
      setMessages((prev) => [...prev, tempMessage])

      await supabase.from("messages").insert({
        conversation_id: conversationId,
        content: messageContent,
        sender_type: "admin",
      })

      onMessageSent?.()
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Aucun message dans cette conversation</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_type === "admin" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.sender_type === "admin" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.sender_type === "admin" ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {formatTime(message.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex justify-end mb-2">
          <Button
            onClick={handleAISuggest}
            disabled={isLoadingAI || messages.length === 0}
            variant="outline"
            size="sm"
            className="gap-2 bg-transparent"
          >
            {isLoadingAI ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                AI Assist
              </>
            )}
          </Button>
        </div>

        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Tapez votre réponse..."
            disabled={isSending}
            className="flex-1 min-h-[60px] max-h-[120px] resize-none"
          />
          <Button onClick={handleSend} disabled={!input.trim() || isSending} size="icon" className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

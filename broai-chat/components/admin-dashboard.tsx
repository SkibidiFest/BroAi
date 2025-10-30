"use client"

import { useState, useEffect } from "react"
import { ConversationList } from "@/components/conversation-list"
import { AdminChat } from "@/components/admin-chat"
import { getSupabaseBrowserClient } from "@/lib/supabase-client"

type Conversation = {
  id: string
  user_name: string | null
  created_at: string
  status: string
  unread_count?: number
}

export function AdminDashboard() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    loadConversations()
    cleanupEmptyConversations()
    archiveInactiveConversations()
    deleteOldArchivedConversations()

    const channel = supabase
      .channel("conversations-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        () => {
          loadConversations()
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          loadConversations()
        },
      )
      .subscribe()

    const interval = setInterval(() => {
      loadConversations()
      cleanupEmptyConversations()
      archiveInactiveConversations()
      deleteOldArchivedConversations()
    }, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [supabase])

  async function cleanupEmptyConversations() {
    await supabase.rpc("cleanup_empty_conversations")
  }

  async function archiveInactiveConversations() {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()

    const { error } = await supabase
      .from("conversations")
      .update({ status: "archived" })
      .eq("status", "active")
      .lt("last_activity_at", tenMinutesAgo)

    if (!error) {
      loadConversations()
    }
  }

  async function deleteOldArchivedConversations() {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()

    // First delete messages from old archived conversations
    const { data: oldConversations } = await supabase
      .from("conversations")
      .select("id")
      .eq("status", "archived")
      .lt("last_activity_at", tenMinutesAgo)

    if (oldConversations && oldConversations.length > 0) {
      const conversationIds = oldConversations.map((c) => c.id)

      // Delete messages first (due to foreign key constraint)
      await supabase.from("messages").delete().in("conversation_id", conversationIds)

      // Then delete conversations
      await supabase.from("conversations").delete().in("id", conversationIds)

      loadConversations()
    }
  }

  async function loadConversations() {
    const { data: convos } = await supabase.from("conversations").select("*").order("created_at", { ascending: false })

    if (convos) {
      const conversationsWithUnread = await Promise.all(
        convos.map(async (convo) => {
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", convo.id)
            .eq("sender_type", "user")
            .eq("is_read", false)

          return {
            ...convo,
            unread_count: count || 0,
          }
        }),
      )

      setConversations(conversationsWithUnread)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
      <div className="lg:col-span-1">
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversationId}
          onSelect={setSelectedConversationId}
        />
      </div>

      <div className="lg:col-span-2">
        {selectedConversationId ? (
          <AdminChat conversationId={selectedConversationId} onMessageSent={loadConversations} />
        ) : (
          <div className="flex items-center justify-center h-full border rounded-lg bg-muted/20">
            <p className="text-muted-foreground">Sélectionnez une conversation pour commencer</p>
          </div>
        )}
      </div>
    </div>
  )
}

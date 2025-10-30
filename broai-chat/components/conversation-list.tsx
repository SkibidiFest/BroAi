"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Archive } from "lucide-react"
import Image from "next/image"

type Conversation = {
  id: string
  user_name: string | null
  user_avatar: string | null
  created_at: string
  status: string
  unread_count?: number
}

type ConversationListProps = {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  const activeConversations = conversations.filter((c) => c.status === "active")
  const archivedConversations = conversations.filter((c) => c.status === "archived")

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return "Il y a quelques minutes"
    } else if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)}h`
    } else {
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      })
    }
  }

  const renderConversation = (conversation: Conversation) => (
    <button
      key={conversation.id}
      onClick={() => onSelect(conversation.id)}
      className={`w-full text-left p-3 rounded-lg transition-colors ${
        selectedId === conversation.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center">
            {conversation.user_avatar ? (
              <Image
                src={conversation.user_avatar || "/placeholder.svg"}
                alt={conversation.user_name || "User"}
                width={40}
                height={40}
                className="object-cover"
              />
            ) : (
              <span className="text-sm font-semibold">{(conversation.user_name || "U")[0]?.toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{conversation.user_name || "Utilisateur anonyme"}</p>
            <p
              className={`text-xs truncate ${
                selectedId === conversation.id ? "text-primary-foreground/80" : "text-muted-foreground"
              }`}
            >
              {formatDate(conversation.created_at)}
            </p>
          </div>
        </div>
        {conversation.unread_count! > 0 && (
          <Badge variant="destructive" className="shrink-0">
            {conversation.unread_count}
          </Badge>
        )}
      </div>
    </button>
  )

  return (
    <Card className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Conversations ({conversations.length})
        </h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          <div>
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Actives ({activeConversations.length}/3)
            </div>
            <div className="space-y-2 mt-2">
              {activeConversations.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">Aucune conversation active</div>
              ) : (
                activeConversations.map(renderConversation)
              )}
            </div>
          </div>

          {archivedConversations.length > 0 && (
            <div className="pt-4 border-t">
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Archive className="h-3 w-3" />
                Historique ({archivedConversations.length})
              </div>
              <div className="space-y-2 mt-2 opacity-60">{archivedConversations.map(renderConversation)}</div>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  )
}

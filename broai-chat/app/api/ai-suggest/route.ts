import { generateText } from "ai"
import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const { conversationId } = await request.json()

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID required" }, { status: 400 })
    }

    // Get conversation messages
    const supabase = await getSupabaseServerClient()
    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (error || !messages) {
      return NextResponse.json({ error: "Failed to load messages" }, { status: 500 })
    }

    // Build conversation context
    const conversationContext = messages
      .map((msg) => `${msg.sender_type === "user" ? "User" : "Admin"}: ${msg.content}`)
      .join("\n")

    // Generate AI suggestion
    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `You are BroAI, "L'intelligence artificielle la plus imprévisible" (the most unpredictable AI). You help admins respond to user messages in a creative, slightly unpredictable, but helpful way.

Here's the conversation so far:
${conversationContext}

Generate a suggested response for the admin to send to the user. The response should be:
- Helpful and address the user's last message
- Creative and slightly unpredictable (as BroAI's tagline suggests)
- Professional but with personality
- In French if the user is speaking French, otherwise match their language
- Keep it concise (2-3 sentences max)

Only provide the suggested response text, nothing else.`,
    })

    return NextResponse.json({ suggestion: text })
  } catch (error) {
    console.error("[v0] AI suggestion error:", error)
    return NextResponse.json({ error: "Failed to generate suggestion" }, { status: 500 })
  }
}

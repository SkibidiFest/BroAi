import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const conversationId = searchParams.get("id")

  if (!conversationId) {
    return NextResponse.json({ error: "Missing conversation ID" }, { status: 400 })
  }

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {},
    },
  })

  await supabase.from("conversations").update({ status: "archived" }).eq("id", conversationId)

  return NextResponse.json({ success: true })
}

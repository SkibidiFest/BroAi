import { ChatInterface } from "@/components/chat-interface"
import Image from "next/image"
import { ThemeToggle } from "@/components/theme-toggle"

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8 space-y-4">
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
          <h1 className="text-4xl md:text-5xl font-bold text-balance bg-gradient-to-r from-foreground via-muted-foreground to-foreground/80 bg-clip-text text-transparent leading-8">
            BroAI
          </h1>
          <p className="text-xl md:text-2xl font-semibold text-foreground text-pretty">
            L'intelligence artificielle la plus imprévisible
          </p>
        </div>

        <ChatInterface />
      </div>
    </main>
  )
}

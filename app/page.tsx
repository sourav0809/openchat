import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./api/auth/[...nextauth]/route";
import ChatPage from "./chat/page";
import { ChatSidebar } from "../common/components/sidebar/components/chat-sidebar";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ChatSidebar />
      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        <ChatPage />
      </main>
    </div>
  );
}

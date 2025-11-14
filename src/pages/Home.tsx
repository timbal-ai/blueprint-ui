import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { authClient, isAuthEnabled } from "@/auth/provider"
import { useTheme } from "next-themes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Book, ChevronRight, Code } from "lucide-react"

const Home = () => {
  const { theme } = useTheme()

  const handleSignOut = async () => {
    if (authClient) {
      await authClient.auth.signOut()
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden ">
      <div className="flex items-center justify-between w-full py-4 px-8 shadow-sm ">
        <img src={theme === "dark" ? "/timbal_w.svg" : "/timbal_b.svg"} alt="Timbal" className="h-5 w-auto" />
        <div className="flex items-center gap-2">
          <ModeToggle />
          {isAuthEnabled && <Button variant="destructive" onClick={handleSignOut}>Logout</Button>}
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-4 flex-1 max-w-2xl mx-auto w-full px-4">
        <div className="flex flex-col items-center justify-center gap-2">
          <h1 className="text-5xl md:text-6xl font-semibold text-center">Start with Timbal</h1>
          <p className="text-center text-md md:text-lg text-muted-foreground">Create the most advanced AI as a service for your business with a single prompt</p>
        </div>
        <div className="w-full bg-muted rounded-lg p-4 font-mono text-sm text-center my-8">
          <span>Get started with Timbal by editing <span className="font-bold">src/App.tsx</span></span>
        </div>
        <Button onClick={() => toast.info("Send your first prompt to start creating your AI as a service")}>Get started</Button>
      </div>
      <div className="flex md:flex-row flex-col max-w-3xl mx-auto w-full pb-24 gap-4 px-4">
        <Card 
        className="w-full md:w-1/2 group cursor-pointer shadow-none bg-transparent hover:border-primary" 
        onClick={() => window.open("https://www.npmjs.com/package/@timbal-ai/timbal-sdk", "_blank")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="size-4" />
              Timbal Javascript SDK
              <ChevronRight className="size-4 ml-auto group-hover:translate-x-1 transition-transform duration-300" />
            </CardTitle>
            <CardContent className="text-sm text-muted-foreground mt-1">Integrate seamlessly with our knowledge bases, agents and workflows.</CardContent>
          </CardHeader>
        </Card>
        <Card
          className="w-full md:w-1/2 group cursor-pointer shadow-none bg-transparent hover:border-primary"
          onClick={() => window.open("https://docs.timbal.ai", "_blank")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="size-4" />
              Timbal Framework
              <ChevronRight className="size-4 ml-auto group-hover:translate-x-1 transition-transform duration-300" />
            </CardTitle>
            <CardContent className="text-sm text-muted-foreground mt-1">Build and deploy custom agents and workflows quickly</CardContent>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}

export default Home
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { isAuthEnabled, useSession } from "@/auth/provider";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Book, ChevronRight, Code } from "lucide-react";

const Home = () => {
  const { theme, systemTheme } = useTheme();
  const { logout } = useSession();
  const currentTheme = theme === "system" ? systemTheme : theme;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex items-center justify-between w-full py-4 px-8 shadow-sm">
        <img
          src={currentTheme === "dark" ? "/timbal_w.svg" : "/timbal_b.svg"}
          alt="Timbal"
          className="h-5 w-auto"
        />
        <div className="flex items-center gap-2">
          <ModeToggle />
          {isAuthEnabled && (
            <Button variant="destructive" onClick={logout}>
              Logout
            </Button>
          )}
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-4 flex-1 max-w-2xl mx-auto w-full px-4">
        <div className="flex flex-col items-center justify-center gap-2">
          <h1 className="text-5xl md:text-6xl font-semibold text-center">
            Timbal Blueprint
          </h1>
          <p className="text-center text-md md:text-lg text-muted-foreground">
            Your starting point for building AI applications. This template
            includes authentication, theming, and the Timbal client — ready for
            you to make it yours.
          </p>
        </div>
        <div className="w-full bg-muted rounded-lg p-4 font-mono text-sm text-center my-8">
          Edit <span className="font-bold">src/App.tsx</span> to start building
        </div>
      </div>
      <div className="flex md:flex-row flex-col max-w-3xl mx-auto w-full pb-24 gap-4 px-4">
        <Card
          className="w-full md:w-1/2 group cursor-pointer shadow-none bg-transparent hover:border-primary"
          onClick={() =>
            window.open(
              "https://www.npmjs.com/package/@timbal-ai/timbal-sdk",
              "_blank",
            )
          }
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="size-4" />
              JavaScript SDK
              <ChevronRight className="size-4 ml-auto group-hover:translate-x-1 transition-transform duration-300" />
            </CardTitle>
            <CardContent className="text-sm text-muted-foreground mt-1">
              Connect to Timbal agents, knowledge bases, and workflows.
            </CardContent>
          </CardHeader>
        </Card>
        <Card
          className="w-full md:w-1/2 group cursor-pointer shadow-none bg-transparent hover:border-primary"
          onClick={() => window.open("https://docs.timbal.ai", "_blank")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="size-4" />
              Timbal Framework
              <ChevronRight className="size-4 ml-auto group-hover:translate-x-1 transition-transform duration-300" />
            </CardTitle>
            <CardContent className="text-sm text-muted-foreground mt-1">
              Build and deploy custom agents and workflows quickly.
            </CardContent>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default Home;

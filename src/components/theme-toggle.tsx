import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggler() {
  const { resolvedTheme, setTheme } = useTheme();

  function toggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <Button size="icon" variant="ghost" onClick={toggleTheme}>
      {resolvedTheme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}

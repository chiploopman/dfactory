import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ModeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          className="relative"
          aria-label="Toggle theme"
          data-testid="theme-toggle-trigger"
        >
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-32"
        data-testid="theme-toggle-menu"
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          data-testid="theme-toggle-light"
        >
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          data-testid="theme-toggle-dark"
        >
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          data-testid="theme-toggle-system"
        >
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AgentsList from "./pages/AgentsList";
import EnhancedHome from "./pages/EnhancedHome";
import CreateAgent from "./pages/CreateAgent";
import AgentDetail from "./pages/AgentDetail";
import Analytics from "./pages/Analytics";
import Templates from "./pages/Templates";
import ArchitectureExplorer from "./pages/ArchitectureExplorer";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={EnhancedHome} />
      <Route path="/agents" component={AgentsList} />
      <Route path="/create" component={CreateAgent} />
      <Route path="/agent/:id" component={AgentDetail} />
      <Route path="/analytics" component={Analytics} />      <Route path={"/templates"} component={Templates} />
      <Route path={"/architecture"} component={ArchitectureExplorer} />      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

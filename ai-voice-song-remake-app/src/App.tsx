import { AppProvider, useApp } from "./context/AppContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Layout } from "./components/Layout";
import { ToastHost } from "./components/Toast";
import { Dashboard } from "./pages/Dashboard";
import { Upload } from "./pages/Upload";
import { AIStudio } from "./pages/AIStudio";
import { History } from "./pages/History";
import { Settings } from "./pages/Settings";
import { BackendGuide } from "./pages/BackendGuide";

function Shell() {
  const { page } = useApp();
  return (
    <Layout>
      {page === "dashboard" && <Dashboard />}
      {page === "upload" && <Upload />}
      {page === "studio" && <AIStudio />}
      {page === "history" && <History />}
      {page === "settings" && <Settings />}
      {page === "backend" && <BackendGuide />}
      <ToastHost />
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <Shell />
      </AppProvider>
    </ThemeProvider>
  );
}

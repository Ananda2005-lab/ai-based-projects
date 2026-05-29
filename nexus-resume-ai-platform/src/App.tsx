import { StoreProvider } from "./store";
import { ToastProvider } from "./components/AIToast";
import Studio from "./components/Studio";

export default function App() {
  return (
    <ToastProvider>
      <StoreProvider>
        <Studio />
      </StoreProvider>
    </ToastProvider>
  );
}

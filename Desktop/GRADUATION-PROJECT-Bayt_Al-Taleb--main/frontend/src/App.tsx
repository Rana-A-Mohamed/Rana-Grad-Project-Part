import AppLayout from "./layouts/AppLayout";
import { Toaster } from "./components/ui/toaster";
import { AuthProvider } from "./store/AuthContext";

function App() {
  return (
    <>
      <AuthProvider>
        <AppLayout />
        <Toaster />
      </AuthProvider>
    </>
  );
}

export default App;

import { Switch, Route, useLocation } from "wouter";
import { useEffect } from 'react';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./context/AuthContext";
import { QuizProvider } from "./context/QuizContext";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/ui/footer";

// Pages
import Login from "@/pages/login";
import Rules from "@/pages/rules";
import WaitingRoom from "@/pages/waiting-room";
import Quiz from "@/pages/quiz";
import Leaderboard from "@/pages/leaderboard";
import AdminPanel from "@/pages/admin/panel";
import AddQuestion from "@/pages/admin/add-question";
import Questions from "@/pages/admin/questions";
import SuperAdminPanel from "@/pages/superadmin/panel";
import UserManagement from "@/pages/superadmin/user-management";
import NotFound from "@/pages/not-found";
import StudentLeaderboard from "./pages/studentleaderboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/rules" component={Rules} />
      <Route path="/waiting-room" component={WaitingRoom} />
      <Route path="/quiz" component={Quiz} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/studentleaderboard" component={StudentLeaderboard} />

      {/* Admin routes */}
      <Route path="/admin" component={AdminPanel} />
      <Route path="/admin/questions" component={Questions} />
      <Route path="/admin/add-question" component={AddQuestion} />

      {/* Super Admin routes */}
      <Route path="/superadmin" component={SuperAdminPanel} />
      <Route path="/superadmin/users" component={UserManagement} />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location, navigate] = useLocation();
  const isLoginPage = location === "/";
  const isQuizPage = location === "/quiz";
  const isumPage = location === "/superadmin/users";

  useEffect(() => {
    // Store current location before refresh
    const handleBeforeUnload = () => {
      sessionStorage.setItem('currentLocation', location);
    };

    // Retrieve stored location on load
    const storedLocation = sessionStorage.getItem('currentLocation');
    if (storedLocation && location === '/') {
      navigate(storedLocation);
      sessionStorage.removeItem('currentLocation');
    }

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [location, navigate]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <QuizProvider>
          <div className="min-h-screen font-sans">
            {!isLoginPage && <AppHeader />}
            <Router />
            <Toaster />
            {!isLoginPage && !isQuizPage && !isumPage && <Footer />}
          </div>
        </QuizProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
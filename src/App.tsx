import ExploreRoom from "./pages/ExploreRoom";
import MyWorlds from "./pages/MyWorlds";
import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SplashScreen from "./pages/SplashScreen";
import Home from "./pages/Home";
import Login from "./pages/LogIn";
import SignUp from "./pages/SignUp";
import WorldBuilder from "./pages/WorldBuilder";

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/" element={<Home />} />
        <Route path="/world-builder/:worldId?" element={<WorldBuilder />} />
        <Route path="/my-worlds" element={<MyWorlds />} />
        <Route path="/explore/:roomId" element={<ExploreRoom />} />
      </Routes>
    </Router>
  );
}

export default App;

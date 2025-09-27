import { useEffect, useState } from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import SplashScreen from './pages/SplashScreen';
import Home from './pages/Home';
import Login from './pages/LogIn';
import SignUp from './pages/SignUp';
import WorldBuilder from './pages/WorldBuilder';

function App() {
  const[isLoading, setIsLoading] = useState(true);

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
        <Route path="/login" element={<Login/>} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/" element={<Home />} />
        <Route path="/world-builder" element={<WorldBuilder />} />
      </Routes>
    </Router>
  )
}

export default App

import {Route,BrowserRouter as Router,Routes} from "react-router-dom";
import './App.css'
import LandingPage from "./pages/LandingPage.jsx";
import Authentication from "./pages/Authentication.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import VideoMeet from "./pages/VideoMeet.jsx";
import Home from "./pages/Home.jsx";
import { HisProvider } from "./contexts/HistoryContex.jsx";
import HistoryComponent from "./pages/HistoryComponent.jsx";
function App() {


  return (
  <>
  <Router>
    <AuthProvider>
    <HisProvider>
    <Routes>

     <Route path="/" element={<LandingPage/>} /> 
     <Route path="/auth" element={<Authentication/>} /> 
     <Route path="/home" element={<Home/>} />
     <Route path="/history" element={<HistoryComponent/>}/>
     <Route path="/meet/:url" element={<VideoMeet/>} />
    </Routes>
    </HisProvider>
    </AuthProvider>

  </Router>
  
  </>
  )
}

export default App;

//UX, Styling, Design
import { ThemeProvider } from '@mui/material/styles';
import MyTheme from './themes/MyTheme';
import './App.css';
import { Container, AppBar, Toolbar, Typography, IconButton, Button, Avatar, Box } from '@mui/material';
import AccountCircle from "@mui/icons-material/AccountCircle";
import UserContext from './contexts/UserContext';

//Critical Dependancy
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import http from './http';
import { GoogleLogin, googleLogout } from '@react-oauth/google';

// Import pages/components
import Register from './pages/Register';
import Login from './pages/Login';
import ProfileEdit from './pages/ProfileEdit';
import LandingPage from "./pages/LandingPage";
import Addresses from "./pages/Addresses";
import AddAddress from './pages/AddAddress';
import EditAddress from './pages/EditAddress';


function App() {
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      // Get user data from server
      http.get('/user/auth').then((res) => {
        setUser(res.data.user);
      }).catch(err => {
        console.error("Auth error:", err);
        localStorage.clear(); // Clear token if auth fails
      });

      // Get profile data including profile picture
      http.get('/profile').then((res) => {
        setProfileData(res.data.user);
      }).catch(err => {
        console.error("Profile fetch error:", err);
      });
    }
  }, []);

  //Google signin
  const handleGoogleLogin = async (googleResponse) => {
    try {
      const response = await http.post('/googleauth/google', {
        credential: googleResponse.credential
      });

      localStorage.setItem('accessToken', response.data.token);
      setUser(response.data.user);
      window.location = "/landingpage";
    } catch (error) {
      console.error("Google login error:", error);
    }
  };

  const forceGoogleLogout = () => {
    // Clear all local data
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear all cookies
    document.cookie.split(";").forEach(c => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // Hard redirect to Google's logout page
    window.location.href = "https://www.google.com/accounts/Logout?continue=https://appengine.google.com/_ah/logout?continue=" + encodeURIComponent(window.location.origin + "/register");
  };

  // Refresh profile function to update after changes
  const refreshProfile = () => {
    http.get('/profile').then((res) => {
      setProfileData(res.data.user);
    }).catch(err => {
      console.error("Profile refresh error:", err);
    });
  };

  return (
    <UserContext.Provider value={{ user, setUser, profileData, refreshProfile }}>
      <Router>
        <ThemeProvider theme={MyTheme}>

          <AppBar position="static" className='AppBar'>
            <Container>
              <Toolbar disableGutters={true}>

                {user && (
                  <>
                    {/* Left side: Link to home */}
                    <Link to="/landingpage" style={{ textDecoration: "none", color: "inherit" }}>
                      <Typography variant="h6" component="div" sx={{ mr: 2 }}>
                        User Registration & Management System
                      </Typography>
                    </Link>
                    <Link to="/addresses" style={{ textDecoration: "none", color: "inherit" }}>
                      <Button color="inherit">Addresses</Button>
                    </Link>

                    {/* Profile Edit icon on the right */}
                    <Typography sx={{ ml: "auto", mr: 1 }}>
                      Welcome, {profileData?.name || user?.name || "User"}
                    </Typography>

                    <IconButton color="inherit" onClick={() => {
                      window.location.href = "/profileedit";
                    }}  // Navigate to /profile
                      sx={{ p: 0 }}>

                      {profileData?.profilePicture ? (
                        <Avatar
                          src={profileData.profilePicture}
                          alt={profileData.name || "User"}
                          sx={{ width: 40, height: 40 }}
                        />
                      ) : (
                        <AccountCircle sx={{ fontSize: 40 }} />
                      )}
                    </IconButton>
                    <Button onClick={forceGoogleLogout} sx={{ ml: 2 }}>Logout</Button>
                  </>
                )}
                {!user && (
                  <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 2 }}>
                    <Typography variant="h6" component="div" sx={{ mr: 2 }}>
                      User Registration & Management System
                    </Typography>
                    <Link to="/register" style={{ textDecoration: "none", color: "inherit" }}>
                      <Typography>📝 Register</Typography>
                    </Link>
                    <Link to="/login" style={{ textDecoration: "none", color: "inherit" }}>
                      <Typography>🗝️ Login</Typography>
                    </Link>

                    {/* Google Sign-In Button */}
                    <GoogleLogin
                       onSuccess={handleGoogleLogin}
                       onError={() => console.log('Login Failed')}
                       theme="filled_blue"
                       text="signin_with"
                       shape="rectangular"
                       useOneTap={false}
                       prompt="select_account"
                    />
                  </Box>
                )}

              </Toolbar>
            </Container>
          </AppBar>

          <Container>
            <Routes>

              <Route path={"/"} element={<Register />} />
              <Route path={"/landingpage"} element={<LandingPage />} />
              <Route path="/addresses" element={<Addresses />} />
              <Route path="/addaddress" element={<AddAddress />} />
              <Route path="/editaddress/:id" element={<EditAddress />} />
              <Route path={"/register"} element={<Register />} />
              <Route path={"/login"} element={<Login />} />
              <Route path={"/profileedit"} element={<ProfileEdit />} />

            </Routes>
          </Container>
        </ThemeProvider>
      </Router>
    </UserContext.Provider>
  );
}
export default App;

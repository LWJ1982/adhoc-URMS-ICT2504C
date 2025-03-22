//UX, Styling, Design
import { ThemeProvider } from '@mui/material/styles';
import MyTheme from './themes/MyTheme';
import './App.css';
import { Container, AppBar, Toolbar, Typography, IconButton, Button, Avatar } from '@mui/material';
import AccountCircle from "@mui/icons-material/AccountCircle";
import UserContext from './contexts/UserContext';

//Critical Dependancy
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import http from './http';

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

  const logout = () => {
    localStorage.clear();
    window.location = "/";
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

                {/* Left side: Link to home */}
                <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
                  <Typography variant="h6" component="div" sx={{ mr: 2 }}>
                    User Management & Registration
                  </Typography>
                </Link>

                {user && (
                  <>
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
                    <Button onClick={logout} sx={{ ml: 2 }}>Logout</Button>
                  </>
                )}
                {!user && (
                  <>
                    <Link to="/register" ><Typography>Register</Typography></Link>
                    <Link to="/login" ><Typography>Login</Typography></Link>
                  </>
                )}
              </Toolbar>
            </Container>
          </AppBar>

          <Container>
            <Routes>

              <Route path={"/"} element={<LandingPage />} />
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

//UX, Styling, Design
import { ThemeProvider } from '@mui/material/styles';
import MyTheme from './themes/MyTheme';
import './App.css';
import { Container, AppBar, Toolbar, Typography, IconButton, Button } from '@mui/material';
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

  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      // Todo: get user data from server
      http.get('/user/auth').then((res) => {
        setUser(res.data.user);
      });

      setUser({ name: 'User' });
    }
  }, []);

  const logout = () => {
    localStorage.clear();
    window.location = "/";
  };

  return (
    <UserContext.Provider value={{ user, setUser }}>
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
                    <Typography>Welcome. {user.name}</Typography>
                    <IconButton color="inherit" onClick={() => {
                      window.location.href = "/profileedit";
                    }}  // Navigate to /profile
                      sx={{ ml: "auto" }}>
                      <AccountCircle />
                    </IconButton>
                    <Button onClick={logout}>Logout</Button>
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

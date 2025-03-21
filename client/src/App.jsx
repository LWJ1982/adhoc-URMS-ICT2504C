import { ThemeProvider } from '@mui/material/styles';
import MyTheme from './themes/MyTheme';
import EditTutorial from './pages/EditTutorial';
import AddTutorial from './pages/AddTutorial';
import Tutorials from './pages/Tutorials';
import Register from './pages/Register';
import Login from './pages/Login';
import './App.css';
import { Container, AppBar, Toolbar, Typography, Box, Button } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import http from './http';
import UserContext from './contexts/UserContext';
import ProfileEdit from './pages/ProfileEdit';

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

                <Link to="/"><Typography variant="h6" component="div">Learning</Typography></Link>
                <Link to="/tutorials" ><Typography>Tutorials</Typography></Link>
                <Box sx={{ flexGrow: 1 }}></Box>
                {user && (
                  <>
                    <Link to="/profileedit" ><Typography variant="h7" component="div">Edit Profile</Typography></Link>
                    <Typography>{user.name}</Typography>
                    <Button onClick={logout}>Logout</Button>
                  </>
                )
                }
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
              <Route path={"/"} element={<Tutorials />} />
              <Route path={"/tutorials"} element={<Tutorials />} />
              <Route path={"/addtutorial"} element={<AddTutorial />} />
              <Route path={"/edittutorial/:id"} element={<EditTutorial />} />
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

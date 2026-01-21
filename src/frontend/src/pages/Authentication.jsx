import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Link,
  Avatar,
  Snackbar
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { AuthContext } from '../contexts/AuthContext.jsx';
import "../styles/Auth.css"



const Authentication = () => {
  const [formState, setFormState] = useState(0);
  const [username, setUsername] = useState();
  const [name, setName] = useState();
  const [password, setPassword] = useState();
  //=====some extra info======================
  const [error, setError] = useState("");
  const [message, setMessage] = useState();
  /*==========to show snackBar========
Snackbars are often used as a tooltips/popups to show a message at the bottom of the screen.
 Click on the button to show the snackbar. It will disappear after 3 seconds
  */
  const [open, setOpen] = useState();

  const {handleRegister,handleLogin} =React.useContext(AuthContext); 



   let handleAuth = async ()=>{
    try{
       if(formState===0){
       let result=await handleLogin(username,password);
      
       setPassword("");
       setUsername("");
       setError("");
       }
       if(formState===1){
          let result=await handleRegister(name,username,password);
         
          setMessage(result);
          setOpen(true);//opening snackbar
          setFormState(0);
          setName("");
          setPassword("");
          setUsername("");
          setError("");
        }

    }
    catch(err){
         console.log(err);
         let message= err.message;
         setError(message)

    }


   }



  const handleSubmit = (event) => {
    event.preventDefault();
   
    // Add registration logic here
  };

  return (
    <Container  component="main" maxWidth="xs" >
      <Box
        sx={{
          marginTop: 8,

          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <div>
          <Button variant={formState === 0 ? "contained" : ""} onClick={(e) => setFormState(0)}>Sign in</Button>
          <Button variant={formState === 1 ? "contained" : ""} onClick={(e) => setFormState(1)} >Sign Up</Button>
        </div>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            {formState === 1 &&
              <Grid item xs={12} sx={{ width: "100%" }}>
                <TextField
                  name="name"
                  required
                  fullWidth
                  label="name"
                  value={name}
                  autoFocus
                  onChange={(e) => setName(e.target.value)}
                />
              </Grid>}
            <Grid item xs={12} sm={9} sx={{ width: "100%" }}>
              <TextField
                name="username"
                required
                fullWidth
                value={username}
                label="userName"
                onChange={(e) => setUsername(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={9} sx={{ width: "100%" }}>
              <TextField
                name="password"
                required
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Grid>
          </Grid>

          <p style={{color:'red'}}>{error}</p>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{width:"100%" }}
            onClick={handleAuth}
          >
            {formState===0?"Log in":"Register" }
          </Button>


        </Box>
      </Box>
     {/* open prop when snackbar will open
     autoHideDuration is after how much time snackBar will hide in milli secondary
     message is for message we want to display */}
      <Snackbar
      open={open} 
       autoHideDuration={4000}
       message={message}
      />

    </Container>
  );
};

export default Authentication;




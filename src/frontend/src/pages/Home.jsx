import React, {useContext, useState} from 'react';
import WithAuth from "../utils/WithAuth.jsx";
import {useNavigate} from "react-router-dom";
import IconButton from '@mui/material/IconButton';
import RestoreIcon from '@mui/icons-material/Restore';
import Button from '@mui/material/Button';
import  "../styles/Home.css"

import TextField from '@mui/material/TextField';
import { HisContex } from '../contexts/HistoryContex.jsx';


 function Home(){
   let route=useNavigate();
   const [meetCode,setMeetCode]=useState("");
   const {addToHistory}=useContext(HisContex);

   const handleJoinCall=async ()=>{
    await addToHistory(meetCode)
    //===storing  meeting code=========
    localStorage.setItem("meetCode",meetCode);
    route(`/meet/${meetCode}`)
   }

    return (
        <>
        <div className="homeBackground">
         <div className="navBar">
         <div className="navTitle">
            {/* style={{fontSize:"3rem",color:"rgb(158, 10, 195)"}} */}
            <h2 style={{color:"rgb(158, 10, 195)"}}>Video Call App</h2>
         </div>
         <div className="navButtons">
            <IconButton onClick={()=>route("/history")} style={{transform:"scale(1.5)",marginLeft:"1vh",position:"relative",right:"5vh",backgroundColor:"rgba(21, 3, 30, 0.65)"}} >
             <RestoreIcon color="secondary"/>
             {/* style={{fontSize:"1.5rem",color:"rgb(175, 5, 218)"}} */}
              <span style={{color:"rgb(175, 5, 218)"}} >History</span>
            </IconButton>
            {/* style={{transform:"scale(1.5)",zIndex:1}} */}
            <Button  onClick={()=>{localStorage.removeItem("token");route("/auth")}}  style={{transform:"scale(1.5)",zIndex:1}} color="secondary" variant="contained">
                Logout
            </Button>
         </div>

        </div> 
        
         

         <div className="meetComponent">
              <div className="leftPan" >
        {/* style={{fontSize:"2.5rem",fontWeight:"bold",color:"rgb(175, 5, 218)" }} */}
                <p style={{color:"rgb(175, 5, 218)" }}>Please Enter Your Meeting Code:</p>
       {/* style={{width:"20vw" ,border:"2px solid rgb(186, 6, 231)"}} */}
                <TextField className="meetCode" style={{width:"20vw" ,border:"2px solid rgb(186, 6, 231)"}} color="secondary" varient="outline" value={meetCode} onChange={(e)=>{setMeetCode(e.target.value)}}></TextField>
               {/* style={{height:"3vh"}} */}
                <Button  variant="contained" color="secondary" onClick={handleJoinCall} >
                    Join
                </Button>
              </div>
             
              <div className="rightPan">

              </div>

         </div>


        </div>
        </>
    )
}

export default WithAuth(Home);

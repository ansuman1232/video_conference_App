import axios from "axios";
import {createContext,useContext,useState,useMemo } from "react";
import { ServerRouter, useNavigate } from "react-router-dom";
export const AuthContext=createContext({});
import { status } from "http-status";
import server from "../environment";
//===========to store our base  url==========
const client=axios.create({
    baseURL:`${server}/api/v1/user`
})

//==============AuthProvider	
// The wrapper component that manages the state (useState) and passes it down.

export const AuthProvider=({children})=>{
    const authContext=useContext(AuthContext);


    const [userData,setUserData]=useState(authContext);
//==sending user to home after login==========
    const route=useNavigate();


//==================handle Registration================
    const handleRegister= async(name, username, password)=>{
        try{
             
            //sending data to baseURL+ "/register"
            let request= await client.post("/register",{
                name:name,username:username,password:password
            });
            if(request.status===status.CREATED) 
                return request.data.message;
            
        }
        
        catch(err){
          throw err;
        }
    }
//====== handle sign in==========================
const handleLogin= async(username,password)=>{
    try{
      
        let request= await client.post("/login",{
         username:username,password:password
        });
        if(request.status===status.OK) {
            console.log(request.data)
         localStorage.setItem("token",request.data.token);
        route("/home")
        }
    }
    catch (err){
        throw err;
    }
}



    
   // ❌ OLD WAY (Your snippet)
// const data = { userData, setUserData, handleRegister };

// ✅ OPTIMIZED WAY
const data = useMemo(() => ({
    userData,
    setUserData,
    handleRegister,
    handleLogin
  }), [userData]); // Only re-create 'data' if 'userData' changes
  

    return (
 <AuthContext.Provider value={data}>
    {children}
 </AuthContext.Provider>
    );
} 
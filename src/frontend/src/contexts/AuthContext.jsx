import axios from "axios";
import {createContext,useContext,useState,useMemo } from "react";
import { ServerRouter, useNavigate } from "react-router-dom";
export const AuthContext=createContext({});
import { status } from "http-status";
import server from "../environment";


const client=axios.create({
    baseURL:`${server}/api/v1/user`
})



export const AuthProvider=({children})=>{
    const authContext=useContext(AuthContext);


    const [userData,setUserData]=useState(authContext);

    const route=useNavigate();



    const handleRegister= async(name, username, password)=>{
        try{
             
     
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



    

const data = useMemo(() => ({
    userData,
    setUserData,
    handleRegister,
    handleLogin
  }), [userData]); 
  

    return (
 <AuthContext.Provider value={data}>
    {children}
 </AuthContext.Provider>
    );
} 
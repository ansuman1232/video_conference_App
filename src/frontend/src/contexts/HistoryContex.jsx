import axios from "axios";
import {createContext,useContext,useState,useMemo, Children} from "react";
export const HisContex=createContext({})
import { status } from "http-status";

import server from "../environment";

const client=axios.create({
    baseURL:`${server}/api/v1/user`
})



export const HisProvider=({children})=>{
    const hisContext=useContext(HisContex);

    const[userData,setUserData]=useState(hisContext);

    const getAllActivity=async()=>{
      try{
        let request=await client.get("/get_all_acitvity",{
            params:{
                token:localStorage.getItem("token")
            }
        } );
    
        return request.data;
      }
      catch(e){throw e;}

    }

     const addToHistory=async(meetCode)=>{
        try{
            let request=await client.post("/add_to_history",{
                token:localStorage.getItem("token"),
                meeting_code:meetCode
            })
            return request
        }
        catch(e){throw e;}
     }

const data=useMemo(()=>({
userData,setUserData,getAllActivity,addToHistory
}),[userData])


return (
    <HisContex.Provider value={data}>
     {children}
    </HisContex.Provider>
)


}

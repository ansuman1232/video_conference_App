import {useEffect} from "react";
import {UNSAFE_getTurboStreamSingleFetchDataStrategy, useNavigate} from "react-router-dom";
import axios from "axios";
import { status } from "http-status";
import server from "../environment";
const client=axios.create({
    baseURL:`${server}/api/v1/user`
});




const WithAuth=(WrappedComponent)=>{
    const AuthComponent=(props)=>{
        const route=useNavigate();
        
        const isAuthenticated= async ()=>{
              
            if(localStorage.getItem("token")){
                try{
                 //==sending token to backend===
                 let token=localStorage.getItem("token");
                let request= await client.get("/validate",{
                    params:{token:token}
                } )
                //=========checking the response of server=====
                 console.log(request.status);
                if(request.status===status.FOUND)return true
                else return false;
                }
                catch(e){
                    console.log(e);
                }

               
            }
          
         return false;
         
        }




    useEffect(() => {
    const checkAuth = async () => {
        // Now you are properly awaiting the boolean result
        const authStatus = await isAuthenticated(); 
        

        if (!authStatus) {
            route("/auth");
        }
    };

    checkAuth();
}, []); 



     
     return <WrappedComponent {...props}/>
    }
    return AuthComponent;
}

export default WithAuth;
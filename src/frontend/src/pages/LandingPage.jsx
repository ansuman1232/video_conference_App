
import "../App.css"
import { Link ,useNavigate} from "react-router-dom";
export default function LandingPage() {
  let route=useNavigate();


    return (
        < div className="LandingPageContainer" > 
        <nav className="LandingPageNavbar">
         <div className="LandingTitle">
            Video Call App
         </div>

           <div className="NavList">
            <p onClick={()=>{route("/meet/gu121")}} style={{zIndex:"999"}} >Join As Guest</p>
             <p onClick={()=>{route("/auth")}}  style={{zIndex:"999"}} >Register</p>
             <p onClick={()=>{route("/auth")}} style={{zIndex:"999"}}  >Login</p>
         
           </div>
        </nav>
        
        <div className="LandingPageMainContainer">
         <div className="LandingInfo">
           <div >
            <p>
           <span>Connect </span> with your Friends and Family
           </p>
          
           <button>
           <Link to={"/auth"}>Get Started</Link>
           </button>
            </div>  
           
         </div>
         <div className="mobileImg">
            <img src="/mobile.png" alt="" />
         </div>
        </div>



        </div >
        
    );
}

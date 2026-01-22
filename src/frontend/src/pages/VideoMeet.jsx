import React,{useRef,useState,useEffect} from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import io from "socket.io-client";
import style from "../styles/VideoMeet.module.css"
import IconButton from '@mui/material/IconButton';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import Badge from '@mui/material/Badge';
import ChatIcon from '@mui/icons-material/Chat';
import { useNavigate } from 'react-router-dom';
import server from "../environment.js"

const server_url=server;
let connections={};

const peerConfigConnection={
    "iceServers":[
        {"urls":"stun:stun.l.google.com:19302"}
    
]
}

export default function VideoMeet(){
    let socketRef=useRef();
    let socketIdRef=useRef(); 
    let localVideoRef=useRef(); 
    let [videoAvailable,setVideoAvailable]=useState(true);
     let [audioAvailable,setAudioAvailable]=useState(true);
     let [screenAvailable,setScreenAvailable]=useState(true);
     let [video,setVideo]=useState();
     let [audio,setAudio]=useState();
     let [screen,setScreen]=useState(false);
     let[showChats,setShowChats]=useState(false);
     let[messages,setMessages]=useState([]);
     let[message,setMessage]=useState("");
     let[newMessages,setNewMessages]=useState(0);
     let[askForUsername,setAskForUsername]=useState(true);
     let[username,setUsername]=useState("");
     let [videos,setVideos]=useState([]);

     const videoRef=useRef([]);
   const meetCode=localStorage.getItem("meetCode")?localStorage.getItem("meetCode"):"gu121";








useEffect(()=>{
  getPermissions();
},[])

const getPermissions= async ()=>{
  
  try{

  

  const videoPermission= await navigator.mediaDevices.getUserMedia({video:true});
    if(videoPermission){
      setVideoAvailable(true);
    }else{
      setVideoAvailable(false);
    }

const audioPermission= await navigator.mediaDevices.getUserMedia({audio:true});
if(audioPermission){
  setAudioAvailable(true);
}else{
  setAudioAvailable(false);
}

if(navigator.mediaDevices.getDisplayMedia){

  setScreenAvailable(true);
}else{
  setScreenAvailable(false);
}

if(videoAvailable || audioAvailable){


  const userMediaStream= await navigator.mediaDevices.getUserMedia({video: videoAvailable ,audio: audioAvailable});



   if(localVideoRef.current){




    localVideoRef.current.srcObject=userMediaStream;

   }
}


  }catch(err){
    console.log(err);
  }

}





let connect=()=>{
  setAskForUsername(false);
  getMedia();
}


let getMedia= ()=>{
  setVideo(videoAvailable);
  setAudio(audioAvailable);
   connectToSocketServer();
}


let pendingCandidates = {}; 



const gotMessageFromServer = (fromId, message) => {
        const signal = JSON.parse(message);
        const pc = connections[fromId];

        if (!pc) return;

        if (signal.sdp) {
     
            if (signal.sdp.type === 'answer' && pc.signalingState === 'stable') return;

            pc.setRemoteDescription(new RTCSessionDescription(signal.sdp))
                .then(() => {
                 
                    if (pendingCandidates[fromId]) {
                        pendingCandidates[fromId].forEach(cand => pc.addIceCandidate(new RTCIceCandidate(cand)));
                        delete pendingCandidates[fromId];
                    }

                    if (signal.sdp.type === 'offer') {
                        return pc.createAnswer();
                    }
                })
                .then((description) => {
                    if (description) {
                        return pc.setLocalDescription(description);
                    }
                })
                .then(() => {
                    socketRef.current?.emit('signal', fromId, JSON.stringify({ 'sdp': pc.localDescription }));
                })
                .catch(e => console.error("SDP Error:", e));
        }

        if (signal.ice) {
      
            if (pc.remoteDescription) {
                pc.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.error(e));
            } else {
                if (!pendingCandidates[fromId]) pendingCandidates[fromId] = [];
                pendingCandidates[fromId].push(signal.ice);
            }
        }
    };








let  connectToSocketServer= ()=>{

  socketRef.current=io.connect(server_url,{secure:false});

  socketRef.current.on("signal",gotMessageFromServer);
  socketRef.current.on("connect",()=>{

    socketRef.current.emit("join-call",window.location.href);

    socketRef.current.on("chat-message",addMessage);

  socketRef.current.on("user-left",(id)=>{
    setVideos( (videos)=>videos.filter((video)=>video.socketId!==id))})
  })

socketRef.current.on("user-joined",(id,clients)=>{
  clients.forEach((socketListId)=>{

    connections[socketListId]=new RTCPeerConnection(peerConfigConnection)

 connections[socketListId].onicecandidate=(event)=>{
  if(event.candidate!==null)socketRef.current.emit("signal",socketListId,JSON.stringify({'ice':event.candidate}));
 }


 connections[socketListId].onaddstream=(event)=>{




  let videoExists=videoRef.current.find(video=>video.socketId===socketListId);
  if(videoExists){
    setVideos(videos=>{
        const updatedVideos= videos.map(video=>
          video.socketId===socketListId?{...video,stream:event.stream}:video
        )
        videoRef.current=updatedVideos;
       return updatedVideos;
    });
   
  
  }
else{

   setVideos(prevVideos => {
    const isDuplicate = prevVideos.some(v => v.socketId === socketListId);
    if (isDuplicate) return prevVideos; 
    return [...prevVideos, { socketId: socketListId, stream: event.stream }];
});



   }
 }


if (window.localStream) {
 
   window.localStream.getTracks().forEach((track) => {
 
    const alreadyAdded = connections[socketListId].getSenders().find(sender => sender.track === track);
    
    if (!alreadyAdded) {
      connections[socketListId].addTrack(track, window.localStream);
    }
  });


}
 else{


  let blackSilence=(...args)=>new MediaStream([black(...args),silence()]);
  window.localStream=blackSilence();
  window.localStream.getTracks().forEach((track) => {
    connections[socketListId].addTrack(track, window.localStream);
  });


 }
 if(id===socketIdRef.current){

  for(let id2 in connections){

    if(id2===socketIdRef.current)continue;
      try {
     

      window.localStream.getTracks().forEach((track) => {
      
        connections[id2].addTrack(track, window.localStream);
      });
    } catch (e) {
      console.error("Error adding tracks to connection:", e);
    }



    connections[id2].createOffer().then((description) => {
      connections[id2].setLocalDescription(description)
        .then(() => {
         
          socketRef.current.emit("signal", id2, JSON.stringify({ "sdp": connections[id2].localDescription }));
        }).catch(e => console.log("SetLocalDescription Error:", e));
    }).catch(e => console.log("CreateOffer Error:", e));
  }
 }


  })



})





}








useEffect(()=>{
  if(video!== undefined && audio !==undefined){
    getUserMedia();
  }



},[audio,video])




let getUserMedia= ()=>{

  if((video && videoAvailable )|| (audio && audioAvailable)){


    navigator.mediaDevices.getUserMedia({video:video,audio:audio})
    .then(getUserMediaSuccess)
    .then((stream)=>{})
    .catch((e)=>console.log(e))
     
  }else{
    try{
      


         let tracks=localVideoRef.current.srcObject.getTracks();
         tracks.forEach(track=>track.stop())

    } catch(e){
         console.log(e)
    } 
  }
}






let getUserMediaSuccess=(stream)=>{
  try{
  window.localStream.getTracks().forEach(track=>track.stop());
 
  }
  catch(e){console.log(e)}

  window.localStream=stream;
  localVideoRef.current.srcObject=stream;



for (let id in connections) {
  if (id === socketIdRef.current) continue;

  let senders = connections[id].getSenders();
   if (window.localStream) {
    window.localStream.getTracks().forEach((track) => {
   
            const sender = senders.find(s => s.track && s.track.kind === track.kind);
            
            if (sender) {
         
                sender.replaceTrack(track).catch(e => console.log("ReplaceTrack Error:", e));
            } else {
              
                connections[id].addTrack(track, stream);
            }



    });
  }


  connections[id].createOffer()
    .then((description) => {
      return connections[id].setLocalDescription(description);
    })
    .then(() => {

      socketRef.current.emit(
        "signal",
        id,
        JSON.stringify({ "sdp": connections[id].localDescription })
      );
    })
    .catch((e) => console.log("Error during offer creation:", e));
}







 stream.getTracks().forEach(track=>track.onended=()=>{
  setVideo(false);
  setAudio(false);

  try{
    let tracks=localVideoRef.current.srcObject.getTracks();
    tracks.forEach(track=>track.stop())
  }
  catch(e){
    console.log(e);
  }


  let blackSilence=(...args)=>new MediaStream([black(...args),silence()]);
  window.localStream=blackSilence();

  localVideoRef.current.srcObject=window.localStream;
 
  
      

  for (let id in connections) {

       let senders = connections[id].getSenders();


 

          window.localStream.getTracks().forEach((track) => {
                const sender = senders.find(s => s.track && s.track.kind === track.kind);
                if (sender) {
                    sender.replaceTrack(track);
                }
            });




  connections[id].createOffer()
    .then((description) => {
      return connections[id].setLocalDescription(description);
    })
    .then(() => {
     
      socketRef.current.emit(
        "signal", 
        id, 
        JSON.stringify({ "sdp": connections[id].localDescription })
      );
    })
    .catch((e) => console.error(`Error connecting to peer ${id}:`, e));
}



 })

}







let silence=()=>{
  let ctx=new AudioContext();
  let oscillator=ctx.createOscillator();

  let dst = ctx.createMediaStreamDestination();
  
  oscillator.connect(dst); 
  oscillator.start();
  
  
  ctx.resume(); 
  
  const track = dst.stream.getAudioTracks()[0];
  return Object.assign(track, { enabled: false });
}


let black=({width=640,height=480}={})=>{
  let canvas=Object.assign(document.createElement("canvas"),{width,height});
  canvas.getContext('2d').fillRect(0,0,width,height);
  let stream=canvas.captureStream();
  return Object.assign(stream.getVideoTracks()[0],{enabled:false});
}


const handleVideo=()=>{
setVideo(!video)
}

const handleAudio=()=>{
setAudio(!audio)
}




let getDisplayMediaSuccess=(stream)=>{
 try{
  window.localStream.getTracks().forEach(track=>track.stop())
 }catch(e){conosole.log(e)}

 window.localStream=stream;
 localVideoRef.current.srcObject=stream;



for (let id in connections) {
  if (id === socketIdRef.current) continue;





  let senders = connections[id].getSenders();

        stream.getTracks().forEach((track) => {

            const sender = senders.find(s => s.track && s.track.kind === track.kind);
            
            if (sender) {

                sender.replaceTrack(track).catch(e => console.log("ReplaceTrack Error:", e));
            } else {
        
                connections[id].addTrack(track, stream);
            }
        });




  connections[id].createOffer()
    .then((description) => {

      return connections[id].setLocalDescription(description);
    })
    .then(() => {

      socketRef.current.emit(
        "signal",
        id,
        JSON.stringify({ "sdp": connections[id].localDescription })
      );
    })
    .catch((e) => console.error("WebRTC Offer Error for ID " + id, e));
}




 stream.getTracks().forEach(track=>track.onended=()=>{
 setScreen(false);

  try{
    let tracks=localVideoRef.current.srcObject.getTracks();
    tracks.forEach(track=>track.stop())
  }
  catch(e){
    console.log(e);
  }


  let blackSilence=(...args)=>new MediaStream([black(...args),silence()]);
  window.localStream=blackSilence();

  localVideoRef.current.srcObject=window.localStream;
 




  getUserMedia();

 })


}







let getDisplayMedia=()=>{
  if(screen){
 
    if(navigator.mediaDevices.getDisplayMedia){
      navigator.mediaDevices.getDisplayMedia({video:true,audio:true})
      .then(getDisplayMediaSuccess)
      .then((stream)=>{})
      .catch((e)=>console.log(e))
    }
 

  }
}



useEffect(()=>{
  if(screen){
    getDisplayMedia();
  }
  else getUserMedia();
},[screen])


let handleScreen=()=>{
  setScreen(!screen);
}




const routeTo=useNavigate();
let addMessage =(data,sender,socketId)=>{
 setMessages((prevMessages)=>[...prevMessages,{sender:sender,data:data}]);
 

   
   setNewMessages((newMessages)=>newMessages+1)

  
}

let sendMessage=()=>{

  socketRef.current.emit("chat-message",message,username);
  setMessage("")
}

let handelEndcall=()=>{
  try{
    let tracks=localVideoRef.current.srcObject.getTracks();
    tracks.forEach((track)=>track.stop())

    localStorage.removeItem("meetCode");

  }catch(e){console.log(e)}

  routeTo("/home");
}

return(
    <>
   <div>
    {
        askForUsername  ?
        <div className={style.lobbyContainer}>
          <h1 style={{color:"rgb(210, 74, 241)",position:"absolute",top:"7vh",left:"20vw"}}>Enter into lobby:</h1>
      
            <div className={style.inputLobby}>
          <TextField id="filled-basic" style={{border:"2px solid rgb(210, 74, 241)",color:"white"}} color="secondary" label="username" variant="filled" value={username} onChange={(e)=>setUsername(e.target.value)}/>
          <Button variant="contained" color="secondary" onClick={connect}>Connect</Button>
          </div>
 
          <div className={style.videoElement}>
           <video  style={{broderRadius:"30vh"}}  ref={localVideoRef} autoPlay muted></video>
        
          

          </div>


        </div> :<>

      <div className={style.meetVideoContainer}>
       
      { showChats &&
         <div className={style.chatRoom}>
          <p style={{fontSize:"3rem" ,fontWeight:"900"}}>Chats</p>
          <div style={{marginTop:"1.5vh"}} className={style.chatContainer}>
           {messages.length>0 && messages.map((item,idx)=>{
             return(
              <div key={idx} style={{marginBottom:"1.3vh"}}>
                <p style={{fontWeight:"bold",fontSize:"2.3rem"}}>{item.sender}</p>
                 <p style={{fontWeight:"300",textWrap:"wrap",fontSize:"1.5rem",color:"rgb(163, 83, 238)"}}>
                  {item.data}
                  </p>
                  
                </div>
             )

           })}
          </div>
          <div className={style.sendMessage}>
          
          <TextField 
      label="Message" 
      variant="outlined" 
      value={message} 
      onChange={(e) => setMessage(e.target.value)} 
       
       color="secondary"
         />
         <Button variant="contained" onClick={sendMessage} color="secondary">Send</Button>
         </div>
         </div>}


        <div className={style.buttonContainers}>
         <IconButton onClick={handleVideo}>
          {(video===true)?<VideocamIcon style={{color:"green"}}/>:<VideocamOffIcon style={{color:"red"}} />}
         </IconButton>
        
         <IconButton onClick={handleAudio}>
          {(audio===true)?<MicIcon style={{color:"green"}}/>:<MicOffIcon style={{color:"red"}} />}
         </IconButton>

          <IconButton onClick={handelEndcall} >
          <CallEndIcon   style={{color:"red",borderRadius:"50%"}}/>
         </IconButton>

          <IconButton onClick={handleScreen}>
          {(screen===true)?<ScreenShareIcon style={{color:"green"}}/>:<StopScreenShareIcon style={{color:"red"}} />}
         </IconButton>
       
         <Badge badgeContent={newMessages}  max={999} color="warning">
          <IconButton className="chatBtn">
          <ChatIcon onClick={()=>setShowChats(!showChats)}style={{color:"blue"}}/>
         </IconButton>
         </Badge>

        </div>
         
         <h1 style={{color:"rgb(173, 13, 232)"}}>Meeting Code is {meetCode}</h1>
              
         <video className={style.meetUserVideo} ref={localVideoRef} autoPlay muted ></video>
       
        <div className={style.conferenceView}>
        {videos.map((video)=>(
         
            <div key={video.socketId}>
          
             <video
              data-socket={video.socketId}
              ref={ref=>{
                if(ref && video.stream){
                  ref.srcObject=video.stream;
                   
                }
              }}
             playsInline
              autoPlay
              ></video>
            </div>
        ))}
        </div>
        </div>

        </>
    }
    
    </div> 
  </>
)
}
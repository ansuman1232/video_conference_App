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
//================connection to stun server================
const peerConfigConnection={
    "iceServers":[
        {"urls":"stun:stun.l.google.com:19302"}
    
]
}

export default function VideoMeet(){
    let socketRef=useRef();
    let socketIdRef=useRef();//when we will connect we will get socketId that we will store here.
    let localVideoRef=useRef();//to see our own video...
    let [videoAvailable,setVideoAvailable]=useState(true);//have we give permission to access our camera of our device..
     let [audioAvailable,setAudioAvailable]=useState(true);//similarly have we given access to our mic or not.
     let [screenAvailable,setScreenAvailable]=useState(true);//have we given access for screen share
     let [video,setVideo]=useState();//to handel video on or off feature during video call..
     let [audio,setAudio]=useState();// to handel mic on or off feature
     let [screen,setScreen]=useState(false);//do we want to do screen sharing or not.
     let[showChats,setShowChats]=useState(false);//for pop-ups for the screen
     let[messages,setMessages]=useState([]);//to handel all message
     let[message,setMessage]=useState("");//for an individual message
     let[newMessages,setNewMessages]=useState(0);//to know no. of new messages appeared till now
    //if some one login through guest then we must take his username===========
     let[askForUsername,setAskForUsername]=useState(true);
     let[username,setUsername]=useState("");
     let [videos,setVideos]=useState([]);
     //==========================================
     const videoRef=useRef([]);
   const meetCode=localStorage.getItem("meetCode")?localStorage.getItem("meetCode"):"gu121";




//==============useEffect and getPermissions()======



useEffect(()=>{
  getPermissions();
},[])

const getPermissions= async ()=>{
  
  try{

    //==========for videoPermission============

  const videoPermission= await navigator.mediaDevices.getUserMedia({video:true});
    if(videoPermission){
      setVideoAvailable(true);
    }else{
      setVideoAvailable(false);
    }
//==============for audioPermission=============
const audioPermission= await navigator.mediaDevices.getUserMedia({audio:true});
if(audioPermission){
  setAudioAvailable(true);
}else{
  setAudioAvailable(false);
}
//==============Screen share is possible?======================
if(navigator.mediaDevices.getDisplayMedia){

  setScreenAvailable(true);
}else{
  setScreenAvailable(false);
}
//=============checking if any one (audio or video is available or not)====
if(videoAvailable || audioAvailable){
/*
The Result: Once allowed, the browser returns a MediaStream object and stores it in the userMediaStream variable.
 This object contains the raw "tracks" for video (video frame data) and audio (sound waves).

*/

  const userMediaStream= await navigator.mediaDevices.getUserMedia({video: videoAvailable ,audio: audioAvailable});



   if(localVideoRef.current){

/*
What it does: This checks if the HTML video element exists on the page.

Context: localVideoRef is a React Reference (hook). 
In React, you cannot access HTML elements directly (like document.getElementById) inside the render logic easily, 
so ref.current is used to grab the actual <video> HTML tag from the DOM

*/



    localVideoRef.current.srcObject=userMediaStream;
     /*
Why srcObject? Unlike standard video files where you use a URL string (e.g., src="movie.mp4"), live media streams must be assigned to the srcObject property. 
This tells the browser: "Don't look for a file; 
stream the data directly from this MediaStream object"
     */
   }
}


  }catch(err){
    console.log(err);
  }

}



//===========this our  connect function which send us to video call============

let connect=()=>{
  setAskForUsername(false);
  getMedia();
}


let getMedia= ()=>{
  setVideo(videoAvailable);
  setAudio(audioAvailable);
   connectToSocketServer();
}


//===========connecting to our backend socket server througy webRTC ==============

//============gotMessageFromServer()================



// 1.    create a storage object for each connection
let pendingCandidates = {}; 



const gotMessageFromServer = (fromId, message) => {
        const signal = JSON.parse(message);
        const pc = connections[fromId];

        if (!pc) return; // Defensive check

        if (signal.sdp) {
            // Check state to prevent "Stable" error
            if (signal.sdp.type === 'answer' && pc.signalingState === 'stable') return;

            pc.setRemoteDescription(new RTCSessionDescription(signal.sdp))
                .then(() => {
                    // Process any ICE candidates that arrived early
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
            // Queue ICE if Remote Description isn't set yet
            if (pc.remoteDescription) {
                pc.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.error(e));
            } else {
                if (!pendingCandidates[fromId]) pendingCandidates[fromId] = [];
                pendingCandidates[fromId].push(signal.ice);
            }
        }
    };








let  connectToSocketServer= ()=>{
  /*
   socketRef.current holds the active Socket.IO client instance that manages the persistent connection to your backend server.

Because it is stored in a useRef hook, this connection instance survives component re-renders without being reset or losing its state.
   */
  socketRef.current=io.connect(server_url,{secure:false});
//=========from backend we have emited this so to recieve we will use on(.., ) here==
  socketRef.current.on("signal",gotMessageFromServer);
  socketRef.current.on("connect",()=>{
    //here we are emiting and in bakcend it will there will be someone who will be listing
    //here window.location.href = our current url
    socketRef.current.emit("join-call",window.location.href);
//===to notifiy a new chat message has appeared=========
    socketRef.current.on("chat-message",addMessage);
  //========when we were informed from backend that a user left=====
  socketRef.current.on("user-left",(id)=>{
    setVideos( (videos)=>videos.filter((video)=>video.socketId!==id))})
  })
//===============now adding a user=======================
socketRef.current.on("user-joined",(id,clients)=>{
  clients.forEach((socketListId)=>{

    connections[socketListId]=new RTCPeerConnection(peerConfigConnection)
  /* the above code means
For each person, create a new WebRTC “call connection object” and store it in connections using that person’s socket id as the key,
 so you can find that connection later
  */

 connections[socketListId].onicecandidate=(event)=>{
  if(event.candidate!==null)socketRef.current.emit("signal",socketListId,JSON.stringify({'ice':event.candidate}));
 }
 /*
This code handles the WebRTC ICE (Interactive Connectivity Establishment)
 candidate gathering process when a user joins your video call.

 If a valid candidate exists, it emits a "signal" event through the socket connection,
  sending the ICE candidate as a JSON-stringified object to the specific peer identified by socketListId.
   When event.candidate is null,
  it indicates that all ICE candidates have been gathered and the discovery process is complete

  Why This Matters
ICE candidates must be exchanged between peers through your signaling server (Socket.io in your case) because 
WebRTC needs multiple potential connection paths to establish peer-to-peer communication,
 e
  */

 connections[socketListId].onaddstream=(event)=>{
//if stream changes like:- camera was on earlier and then user turned off camera or started screen share
//in that case our streammedia will also change

/*
below code:-
This snippet updates a React videos state array when a new media stream arrives: 
if a video entry for that socket already exists it replaces that entry’s stream; 
otherwise it appends a new entry.

*/



  let videoExists=videoRef.current.find(video=>video.socketId===socketListId);
  if(videoExists){
    setVideos(videos=>{
        const updatedVideos= videos.map(video=>
          video.socketId===socketListId?{...video,stream:event.stream}:video
        )
        videoRef.current=updatedVideos;
       return updatedVideos;
    });
   
   // console.log(videos);
     /*
behaves asynchronously in the sense that it schedules/enqueues a state update and
 React applies it on a later render, so the videos variable you 
 read immediately after calling setVideos can still be the old value.

 if you need the new array right away, compute it inside the functional updater 
 and store it in a ref (videoRef.current) for immediate access
    */
  }
else{

   setVideos(prevVideos => {
    const isDuplicate = prevVideos.some(v => v.socketId === socketListId);
    if (isDuplicate) return prevVideos; // Do nothing if already exists
    return [...prevVideos, { socketId: socketListId, stream: event.stream }];
});



   }
 }

 /*
 in react where ever we writen window.xyz() then xyx() is accessable from any
 where even from our browser.
 */
if (window.localStream) {
 
   window.localStream.getTracks().forEach((track) => {
 
    const alreadyAdded = connections[socketListId].getSenders().find(sender => sender.track === track);
    
    if (!alreadyAdded) {
      connections[socketListId].addTrack(track, window.localStream);
    }
  });
 /*
connections[socketListId].getSenders(): This returns a list of all tracks currently being sent to that specific peer.

.find(sender => sender.track === track): It checks if the track you are about to add is already being sent.


Why it matters:
 In WebRTC, calling addTrack twice on the same track will throw an InvalidStateError and crash your script. 
 This check allows the code to run safely multiple times, such as during a network reconnection or when a user toggles their camera

  */


}
 else{

// ====blackscreen when video is turned off======
  let blackSilence=(...args)=>new MediaStream([black(...args),silence()]);
  window.localStream=blackSilence();
  window.localStream.getTracks().forEach((track) => {
    connections[socketListId].addTrack(track, window.localStream);
  });


 }
 if(id===socketIdRef.current){
  //========now creating a offerlater====
  for(let id2 in connections){
    //if id2 is same as socketIdRef.current this mens
    //we are tring to make connection wiht ourselvel which is not
    //required.
    if(id2===socketIdRef.current)continue;
      try {
        /*
window.localStream.getTracks()
A "Stream" is just a container. Inside it are individual tracks (usually one for Video and one for Audio). 
This method extracts those individual tracks so the browser can handle them one by one.

        */

      window.localStream.getTracks().forEach((track) => {
       // We add each track (video/audio) individually to the peer connection
        connections[id2].addTrack(track, window.localStream);
      });
    } catch (e) {
      console.error("Error adding tracks to connection:", e);
    }

    // 2. Create the offer

     /*
     1. createOffer()
The browser generates a Session Description (SDP). This is a text file that lists your computer's capabilities, such as: "I support 4K video, I use the H.264 codec, and I am sending these specific audio/video tracks."
2. setLocalDescription(description)
You save that "invite" into your own RTCPeerConnection object. This tells your browser: "This is the configuration I am officially offering to use for this call."
3. socketRef.current.emit("signal", ...)
Since WebRTC doesn't have its own way to find users, you use your Signaling Server (Socket.io) to mail this "invite" to the specific person (id2).
The Important Part: You are sending connections[id2].localDescription. This is the finalized version of the SDP you just saved.

     */

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







//====here each time audio and video changes automatically our getUserMedia() will run==
useEffect(()=>{
  if(video!== undefined && audio !==undefined){
    getUserMedia();
  }



},[audio,video])



//===========note:- here we also use async function getUserMedia() ==================
/*
this function will run when some one in live video call changed  his 
muted or unmuted (audio or video)
*/

let getUserMedia= ()=>{
 //If the user wants video OR audio (and the hardware is available):
  if((video && videoAvailable )|| (audio && audioAvailable)){
//Request Access: It calls navigator.mediaDevices.getUserMedia(...) 
// to ask the browser for the camera/mic feed.

    navigator.mediaDevices.getUserMedia({video:video,audio:audio})
    .then(getUserMediaSuccess)//getUserMediaSuccess() this function will reflect our change in all other users
    .then((stream)=>{})//currently no use
    .catch((e)=>console.log(e))
     
  }else{
    try{
        /*
      If the user wants neither video nor audio (or they are unavailable):

     Cleanup: It grabs the running media stream from the video element (srcObject).

Hard Stop: It iterates through every "track" (video track, audio track) and calls .stop(). 
 This physically turns off the camera light and releases the hardware so other apps can use it.

        */


         let tracks=localVideoRef.current.srcObject.getTracks();
         tracks.forEach(track=>track.stop())

    } catch(e){
         console.log(e)
    } 
  }
}




//======================================================
/*
getUserMediaSuccess():-
 the main point of this code is to automatically start and reset your video call
  whenever your camera or microphone starts or stops.


  1. Starting the Call (getUserMediaSuccess)
When your camera successfully turns on, this function:
a.Cleans Up: It stops any old camera/microphone tracks that might still be running to prevent glitches.
b.Shows You Your Video: It saves your new "stream" and displays it in your local video box.
c.Invites Others: It loops through everyone else in the call (connections) and:
    i)Attaches your new video/audio to their connection.
    ii)Creates a "proposal" (Offer) containing your connection details.
     iii)Sends that proposal through the server to the other person so they can see you. 

2. Handling the End of a Stream (onended)
The second part of the code listens for when your camera or microphone stops working (e.g., you unplugged it or revoked permission). 

a)Resets the UI: It updates your settings to show that video and audio are now "off."
b)Hard Stop: It ensures all tracks are fully powered down ( only to the tracks connected to our specific node ,
as it happens in mesh toplogy one node is connected to all other node in network).
c)Re-Negotiates: It tries to tell everyone else in the call that your status has changed by sending a new "Offer". 

*/

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
     /*
connections[socketListId].getSenders(): This returns a list of all tracks currently being sent to that specific peer.


.find(sender => sender.track === track): It checks if the track you are about to add is already being sent.


Why it matters: In WebRTC, calling addTrack twice on the same track will throw an InvalidStateError and crash your script. 
This check allows the code to run safely multiple times, 
such as during a network reconnection or when a user toggles their camera

     */


  //==========================Changes for mistake6==============================

         // Find the existing sender for this type of track (video or audio)
            // Note: s.track might be null if it was replaced by null previously, 
            // but usually we replace with black/silence so s.track exists.
            const sender = senders.find(s => s.track && s.track.kind === track.kind);
            
            if (sender) {
                // FOUND: Replace the content on the existing connection
                sender.replaceTrack(track).catch(e => console.log("ReplaceTrack Error:", e));
            } else {
                // NOT FOUND: This is a new type of track (first time adding), so use addTrack
                connections[id].addTrack(track, stream);
            }



    });
  }

  // 2. Create the offer
  connections[id].createOffer()
    .then((description) => {
      return connections[id].setLocalDescription(description);
    })
    .then(() => {
      // 3. Emit the localDescription (SDP) to the signaling server
      socketRef.current.emit(
        "signal",
        id,
        JSON.stringify({ "sdp": connections[id].localDescription })
      );
    })
    .catch((e) => console.log("Error during offer creation:", e));
}





//=======================================================

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
//=======balckSilence=========================

  let blackSilence=(...args)=>new MediaStream([black(...args),silence()]);
  window.localStream=blackSilence();
 //========as we have alredy closed all streams so we will  do this on videoRef not on connections[] ======
  localVideoRef.current.srcObject=window.localStream;
 
  
      

  for (let id in connections) {
  //====================changes after mistake 6======================
       let senders = connections[id].getSenders();


 

          window.localStream.getTracks().forEach((track) => {
                const sender = senders.find(s => s.track && s.track.kind === track.kind);
                if (sender) {
                    sender.replaceTrack(track);
                }
            });



  // 2. Create and set the offer
  connections[id].createOffer()
    .then((description) => {
      return connections[id].setLocalDescription(description);
    })
    .then(() => {
      // 3. Emit the localDescription (SDP) to the signaling server
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



//==================================================








/*

silence() and black() is used to create "placeholder" media tracks for WebRTC. 
These are often used when you need to start a call but the user hasn't granted camera/microphone permissions yet,
 or if they have turned their media off. 
 
 Why use this?
 if you start a connection with no tracks,
  it is often difficult to add them later without "re-negotiating" the whole connection. By starting with these "silent/black" tracks, 
 you create a stable connection that you can easily swap for real camera/mic data later by simply updating the enabled property or replacing the track.
=====================================================================
black():-
This function generates a blank, black video track.

1.Canvas Creation: It creates an invisible drawing area (canvas) in memory.
2.fillRect: It draws a solid black rectangle over the entire area.
3.captureStream: It turns that static drawing into a live video stream.
4.Disabled Return:  it grabs the video track and sets enabled: false

 =============================================================
silence()
This function generates a completely silent audio track.


1.AudioContext & Oscillator: It creates a digital sound engine (AudioContext) and a sound generator (oscillator).
example:- You are turning on a "Virtual Sound Studio" 
and plugging in a "Sound Machine" (the oscillator) that creates a continuous beep.


2.MediaStreamDestination: It routes that sound into a virtual "recording" node rather than your speakers.
example:-
Instead of plugging that sound into your speakers, you plug it into a fake recorder. 
This way, you have "audio data" moving, but nobody actually hears it.


3.Start & Resume: It activates the sound generator and ensures the audio engine is running.
example:- You flip the "On" switch so the system starts producing that data.

4.Muted Return: It extracts the first audio track from this virtual stream and sets enabled: false.
example:- Right before you use it, you hit a "Mute" button (enabled: false).

This provides a "silent" track that doesn't trigger "missing audio" errors in the browser


*/



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


//=======================toggle effect on buttons==========
const handleVideo=()=>{
setVideo(!video)
}

const handleAudio=()=>{
setAudio(!audio)
}

//=========for share screen feature==================================

//==========after getting permission from user============



let getDisplayMediaSuccess=(stream)=>{
 try{
  window.localStream.getTracks().forEach(track=>track.stop())
 }catch(e){conosole.log(e)}

 window.localStream=stream;
 localVideoRef.current.srcObject=stream;



for (let id in connections) {
  if (id === socketIdRef.current) continue;


//====================changes after mistake 6======================


  let senders = connections[id].getSenders();

        stream.getTracks().forEach((track) => {
            // Find the existing sender for this type of track (video or audio)
            // Note: s.track might be null if it was replaced by null previously, 
            // but usually we replace with black/silence so s.track exists.
            const sender = senders.find(s => s.track && s.track.kind === track.kind);
            
            if (sender) {
                // FOUND: Replace the content on the existing connection
                sender.replaceTrack(track).catch(e => console.log("ReplaceTrack Error:", e));
            } else {
                // NOT FOUND: This is a new type of track (first time adding), so use addTrack
                connections[id].addTrack(track, stream);
            }
        });



  // 2. Create Offer
  connections[id].createOffer()
    .then((description) => {
      // 3. Set Local Description and return the promise
      return connections[id].setLocalDescription(description);
    })
    .then(() => {
      // 4. Emit the actual SDP data to the signaling server
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
//=======balckSilence=========================

  let blackSilence=(...args)=>new MediaStream([black(...args),silence()]);
  window.localStream=blackSilence();
 //========as we have alredy closed all streams so we will  do this on videoRef not on connections[] ======
  localVideoRef.current.srcObject=window.localStream;
 


//==================now rest all process as in user media========

  getUserMedia();

 })


}






//======geting permission from user================
let getDisplayMedia=()=>{
  if(screen){
 
    if(navigator.mediaDevices.getDisplayMedia){
      navigator.mediaDevices.getDisplayMedia({video:true,audio:true})
      .then(getDisplayMediaSuccess)
      .then((stream)=>{})//currently no use
      .catch((e)=>console.log(e))
    }
       /*
navigator.mediaDevices.getDisplayMedia: This method prompts the browser to show a pop-up asking the user for permission to capture their screen.
{video: true} : This is required. It tells the browser to capture visual content, such as the entire screen, a specific application window, or a single browser tab.
 {audio: true}: This tells the browser to attempt to capture system audio (like sounds from a YouTube video playing in a shared tab) along with the video
    */

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


//===================for chat feature===========================

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
    //==removing meeting code from localstorage
    localStorage.removeItem("meetCode");

  }catch(e){console.log(e)}
  //after ending call redirecting user to home route
  routeTo("/home");
}

return(
    <>
   <div>
    {
        askForUsername  ?
        <div className={style.lobbyContainer}>
          <h1 style={{color:"rgb(210, 74, 241)",position:"absolute",top:"7vh",left:"20vw"}}>Enter into lobby:</h1>
            {/* asked user to enter username */}
            <div className={style.inputLobby}>
          <TextField id="filled-basic" style={{border:"2px solid rgb(210, 74, 241)",color:"white"}} color="secondary" label="username" variant="filled" value={username} onChange={(e)=>setUsername(e.target.value)}/>
          <Button variant="contained" color="secondary" onClick={connect}>Connect</Button>
          </div>
          {/* video part */}
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
         {/* now adding video to display all video used this loop */}
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
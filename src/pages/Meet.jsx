import { useEffect, useState, useRef, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { io } from "socket.io-client";
import {
  getConversations, createConversation, getMessages, sendMessage,
  sendAudioMessage, markConversationRead, getTeamMembers,
  getVoiceRooms, createVoiceRoom, joinVoiceRoom as apiJoinRoom, leaveVoiceRoom as apiLeaveRoom, deleteVoiceRoom,
} from "../services/api";

function timeAgo(d){if(!d)return"";const x=Date.now()-new Date(d).getTime(),m=Math.floor(x/60000);if(m<1)return"now";if(m<60)return m+"m";const h=Math.floor(m/60);return h<24?h+"h":Math.floor(h/24)+"d";}
function formatTime(d){return new Date(d).toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"});}
function formatDateSep(d){const x=new Date(d),t=new Date(),y=new Date();y.setDate(y.getDate()-1);if(x.toDateString()===t.toDateString())return"Today";if(x.toDateString()===y.toDateString())return"Yesterday";return x.toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"});}
function fmtDur(s){return Math.floor(s/60)+":"+Math.floor(s%60).toString().padStart(2,"0");}
function AudioPlayer({src}){const[p,setP]=useState(false);const[pr,setPr]=useState(0);const[d,setD]=useState(0);const r=useRef(null);const t=()=>{if(!r.current)return;p?r.current.pause():r.current.play();setP(!p);};return(<div className="audio-player" onClick={t}><button className="audio-play-btn">{p?"⏸":"▶"}</button><div className="audio-bar"><div className="audio-bar-fill" style={{width:pr+"%"}}/></div><span className="audio-duration">{fmtDur(d)}</span><audio ref={r} src={src} preload="metadata" onLoadedMetadata={e=>setD(e.target.duration)} onTimeUpdate={e=>setPr(e.target.duration?(e.target.currentTime/e.target.duration)*100:0)} onEnded={()=>{setP(false);setPr(0);}}/></div>);}

const ICE_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "turn:187.77.66.202:3478", username: "skyline", credential: "skyline2024turn" },
  ],
};

function Meet() {
  const { user } = useOutletContext();
  const [tab, setTab] = useState("chat");
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [speakingUsers, setSpeakingUsers] = useState({});
  const [mutedUsers, setMutedUsers] = useState({});
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareUser, setScreenShareUser] = useState(null);
  const [noiseThreshold, setNoiseThreshold] = useState(20);
  const [showSettings, setShowSettings] = useState(false);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const peersRef = useRef({});
  const audioElemsRef = useRef({});
  const vadRef = useRef(null);
  const vadCtxRef = useRef(null);
  const screenStreamRef = useRef(null);
  const screenPeersRef = useRef({});
  const screenVideoRef = useRef(null);
  const threshRef = useRef(20);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { threshRef.current = noiseThreshold; }, [noiseThreshold]);

  const fetchConversations = async () => { try { setConversations((await getConversations()).data); } catch(e){} finally { setLoading(false); } };
  const fetchRooms = async () => { try { setRooms((await getVoiceRooms()).data); } catch(e){} };
  useEffect(() => { fetchConversations(); fetchRooms(); }, []);
  useEffect(() => { if (!activeConv) return; const p = setInterval(async () => { try { setMessages((await getMessages(activeConv._id)).data); } catch(e){} }, 3000); pollRef.current = p; return () => clearInterval(p); }, [activeConv]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (tab !== "rooms") return; const p = setInterval(fetchRooms, 5000); return () => clearInterval(p); }, [tab]);

  const openConversation = async conv => { setActiveConv(conv); setMsgLoading(true); try { setMessages((await getMessages(conv._id)).data); await markConversationRead(conv._id); } catch(e){} finally { setMsgLoading(false); setTimeout(()=>inputRef.current?.focus(),100); } };
  const handleSend = async () => { if(!newMsg.trim()||!activeConv||sending)return; setSending(true); try { const res=await sendMessage(activeConv._id,newMsg.trim()); setMessages(p=>[...p,res.data]); setNewMsg(""); setConversations(p=>p.map(c=>c._id===activeConv._id?{...c,lastMessage:newMsg.trim().slice(0,100),lastMessageAt:new Date().toISOString()}:c).sort((a,b)=>new Date(b.lastMessageAt)-new Date(a.lastMessageAt))); } catch(e){} finally { setSending(false); } };
  const startNewChat = async id => { try { const res=await createConversation(id); setShowNewChat(false); setSearchTerm(""); await fetchConversations(); openConversation(res.data); } catch(e){} };
  const openNewChatModal = async () => { setShowNewChat(true); try { setTeamMembers((await getTeamMembers()).data.filter(m=>m._id!==user._id)); } catch(e){} };
  const getOtherUser = conv => conv.participants?.find(p=>p._id!==user._id)||conv.participants?.[0];
  const filteredMembers = teamMembers.filter(m=>`${m.name} ${m.surname||""}`.toLowerCase().includes(searchTerm.toLowerCase()));

  const startRecording = async () => { try { const s=await navigator.mediaDevices.getUserMedia({audio:true}); const mr=new MediaRecorder(s,{mimeType:"audio/webm"}); chunksRef.current=[]; mr.ondataavailable=e=>{if(e.data.size>0)chunksRef.current.push(e.data);}; mr.onstop=async()=>{s.getTracks().forEach(t=>t.stop()); const blob=new Blob(chunksRef.current,{type:"audio/webm"}); if(blob.size>0&&activeConv){const fd=new FormData();fd.append("audio",blob,"voice.webm");fd.append("duration",recordTime); try{const res=await sendAudioMessage(activeConv._id,fd);setMessages(p=>[...p,res.data]);}catch(e){}}}; mediaRecorderRef.current=mr;mr.start();setRecording(true);setRecordTime(0);recordTimerRef.current=setInterval(()=>setRecordTime(t=>t+1),1000);} catch(e){} };
  const stopRecording = () => { if(mediaRecorderRef.current?.state!=="inactive")mediaRecorderRef.current?.stop(); setRecording(false); clearInterval(recordTimerRef.current); };
  const handleCreateRoom = async () => { if(!roomName.trim())return; try{await createVoiceRoom(roomName.trim());setRoomName("");setShowCreateRoom(false);await fetchRooms();}catch(e){} };

  const removeAudioElem = sid => { const el=audioElemsRef.current[sid]; if(el){el.pause();el.srcObject=null;el.remove();delete audioElemsRef.current[sid];} };

  const startVAD = (stream, socket, roomId) => {
    try {
      const ctx = new AudioContext(); const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser(); an.fftSize=256; an.smoothingTimeConstant=0.3; src.connect(an);
      vadCtxRef.current = ctx; const buf = new Uint8Array(an.frequencyBinCount); let prev=false;
      vadRef.current = setInterval(() => {
        an.getByteFrequencyData(buf); let sum=0; for(let i=2;i<40;i++)sum+=buf[i]; const avg=sum/38;
        const sp = avg > threshRef.current;
        if(sp!==prev){prev=sp;setSpeakingUsers(p=>({...p,[user._id]:sp}));socket.emit("voice-activity",{roomId,speaking:sp});}
      }, 100);
    } catch(e){}
  };
  const stopVAD = () => { clearInterval(vadRef.current); if(vadCtxRef.current){vadCtxRef.current.close().catch(()=>{});vadCtxRef.current=null;} };

  const handleJoinRoom = useCallback(async (room) => {
    if (activeRoom) await handleLeaveRoom();
    try {
      const res = await apiJoinRoom(room._id);
      setActiveRoom(res.data);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      localStreamRef.current = stream;
      const socket = io();
      socketRef.current = socket;

      // Helper: create audio peer. Only ONE side sends offer (the newer user).
      const createAudioPeer = (sid, iAmOfferer) => {
        if (peersRef.current[sid]) { peersRef.current[sid].close(); delete peersRef.current[sid]; }
        const pc = new RTCPeerConnection(ICE_CONFIG);
        peersRef.current[sid] = pc;
        stream.getAudioTracks().forEach(t => pc.addTrack(t, stream));

        pc.onicecandidate = e => { if (e.candidate) socket.emit("ice-candidate", { to: sid, candidate: e.candidate }); };
        pc.ontrack = e => {
          removeAudioElem(sid);
          const audio = document.createElement("audio");
          audio.autoplay = true; audio.playsInline = true; audio.srcObject = e.streams[0];
          document.body.appendChild(audio); audioElemsRef.current[sid] = audio;
          const play = () => audio.play().catch(() => { document.addEventListener("click", () => audio.play().catch(()=>{}), { once: true }); });
          play();
        };

        // Only offerer creates and sends offer
        if (iAmOfferer) {
          pc.createOffer().then(o => pc.setLocalDescription(o)).then(() => {
            socket.emit("offer", { to: sid, offer: pc.localDescription });
          }).catch(e => console.error("offer err", e));
        }
        return pc;
      };

      socket.emit("join-voice-room", { roomId: room._id, userId: user._id, userName: `${user.name} ${user.surname || ""}` });
      startVAD(stream, socket, room._id);

      // I'm the NEW user — I create offers to existing users
      socket.on("existing-user", ({ socketId, userId: uid, muted, speaking }) => {
        setMutedUsers(p => ({ ...p, [uid]: muted }));
        setSpeakingUsers(p => ({ ...p, [uid]: speaking }));
        createAudioPeer(socketId, true); // I am offerer
      });

      // Someone NEW joins after me — THEY will send offer, I wait
      socket.on("user-joined", ({ socketId }) => {
        // Don't create offer — wait for their offer
        fetchRooms();
      });

      // Receive offer — I'm the existing user, they're new
      socket.on("offer", async ({ from, offer }) => {
        const pc = createAudioPeer(from, false); // I am answerer
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("answer", { to: from, answer: pc.localDescription });
        } catch (e) { console.error("answer err", e); }
      });

      socket.on("answer", async ({ from, answer }) => {
        const pc = peersRef.current[from];
        if (pc) try { await pc.setRemoteDescription(new RTCSessionDescription(answer)); } catch(e) {}
      });

      socket.on("ice-candidate", async ({ from, candidate }) => {
        const pc = peersRef.current[from];
        if (pc) try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch(e) {}
      });

      socket.on("user-left", ({ userId: uid, socketId: sid }) => {
        if (peersRef.current[sid]) { peersRef.current[sid].close(); delete peersRef.current[sid]; }
        removeAudioElem(sid);
        setSpeakingUsers(p => { const n={...p}; delete n[uid]; return n; });
        setMutedUsers(p => { const n={...p}; delete n[uid]; return n; });
        if (screenShareUser === uid) setScreenShareUser(null);
        fetchRooms();
      });

      socket.on("voice-activity", ({ userId: uid, speaking }) => setSpeakingUsers(p => ({ ...p, [uid]: speaking })));
      socket.on("user-muted", ({ userId: uid, muted }) => { setMutedUsers(p => ({ ...p, [uid]: muted })); if (muted) setSpeakingUsers(p => ({ ...p, [uid]: false })); });

      // Screen share
      socket.on("screen-started", ({ userId: uid }) => setScreenShareUser(uid));
      socket.on("screen-offer", async ({ from, offer }) => {
        const spc = new RTCPeerConnection(ICE_CONFIG);
        screenPeersRef.current[from] = spc;
        spc.onicecandidate = e => { if(e.candidate) socket.emit("screen-ice",{to:from,candidate:e.candidate}); };
        spc.ontrack = e => { if(screenVideoRef.current) screenVideoRef.current.srcObject=e.streams[0]; };
        await spc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await spc.createAnswer(); await spc.setLocalDescription(answer);
        socket.emit("screen-answer", { to: from, answer: spc.localDescription });
      });
      socket.on("screen-answer", async ({ from, answer }) => { const spc=screenPeersRef.current[from]; if(spc) try{await spc.setRemoteDescription(new RTCSessionDescription(answer));}catch(e){} });
      socket.on("screen-ice", async ({ from, candidate }) => { const spc=screenPeersRef.current[from]; if(spc) try{await spc.addIceCandidate(new RTCIceCandidate(candidate));}catch(e){} });
      socket.on("screen-stopped", () => { setScreenShareUser(null); if(screenVideoRef.current)screenVideoRef.current.srcObject=null; Object.values(screenPeersRef.current).forEach(pc=>pc.close()); screenPeersRef.current={}; });

      await fetchRooms();
    } catch(err) { console.error("Join failed:", err); }
  }, [activeRoom, user]);

  const handleLeaveRoom = useCallback(async () => {
    if(!activeRoom)return;
    try {
      stopVAD(); if(isScreenSharing)stopScreenShare();
      if(socketRef.current){socketRef.current.emit("leave-voice-room",{roomId:activeRoom._id});socketRef.current.disconnect();socketRef.current=null;}
      if(localStreamRef.current){localStreamRef.current.getTracks().forEach(t=>t.stop());localStreamRef.current=null;}
      Object.keys(peersRef.current).forEach(sid=>{peersRef.current[sid].close();removeAudioElem(sid);});peersRef.current={};
      Object.values(screenPeersRef.current).forEach(pc=>pc.close());screenPeersRef.current={};
      setSpeakingUsers({});setMutedUsers({});setScreenShareUser(null);
      await apiLeaveRoom(activeRoom._id);
      setActiveRoom(null);setIsMuted(false);setIsDeafened(false);setIsScreenSharing(false);
      await fetchRooms();
    }catch(e){}
  }, [activeRoom, isScreenSharing]);

  const toggleMute = () => {
    if(!localStreamRef.current)return; const m=!isMuted;
    localStreamRef.current.getAudioTracks().forEach(t=>{t.enabled=!m;});
    setIsMuted(m); if(m)setSpeakingUsers(p=>({...p,[user._id]:false}));
    if(socketRef.current&&activeRoom){socketRef.current.emit("user-muted",{roomId:activeRoom._id,muted:m});if(m)socketRef.current.emit("voice-activity",{roomId:activeRoom._id,speaking:false});}
  };

  const toggleDeafen = () => { const d=!isDeafened; Object.values(audioElemsRef.current).forEach(a=>{a.muted=d;}); setIsDeafened(d); if(d&&!isMuted)toggleMute(); if(!d&&isMuted)toggleMute(); };

  const startScreenShare = async () => {
    if(!socketRef.current||!activeRoom)return;
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({video:true,audio:false});
      screenStreamRef.current=screen; setIsScreenSharing(true); setScreenShareUser(user._id);
      if(screenVideoRef.current)screenVideoRef.current.srcObject=screen;
      socketRef.current.emit("screen-started",{roomId:activeRoom._id});
      for(const sid of Object.keys(peersRef.current)){
        const spc = new RTCPeerConnection(ICE_CONFIG);
        screenPeersRef.current[sid]=spc;
        screen.getTracks().forEach(t=>spc.addTrack(t,screen));
        spc.onicecandidate=e=>{if(e.candidate)socketRef.current.emit("screen-ice",{to:sid,candidate:e.candidate});};
        const offer=await spc.createOffer();await spc.setLocalDescription(offer);
        socketRef.current.emit("screen-offer",{to:sid,offer:spc.localDescription});
      }
      screen.getVideoTracks()[0].onended=()=>stopScreenShare();
    }catch(e){}
  };

  const stopScreenShare = () => {
    if(screenStreamRef.current){screenStreamRef.current.getTracks().forEach(t=>t.stop());screenStreamRef.current=null;}
    Object.values(screenPeersRef.current).forEach(pc=>pc.close());screenPeersRef.current={};
    setIsScreenSharing(false);setScreenShareUser(null);
    if(screenVideoRef.current)screenVideoRef.current.srcObject=null;
    if(socketRef.current&&activeRoom)socketRef.current.emit("screen-stopped",{roomId:activeRoom._id});
  };

  const handleDeleteRoom = async id => { if(!confirm("Delete?"))return; try{await deleteVoiceRoom(id);await fetchRooms();}catch(e){} };
  useEffect(()=>()=>{if(activeRoom)handleLeaveRoom();},[]);

  const gm=[]; let ld=null;
  messages.forEach(msg=>{const d=new Date(msg.createdAt).toDateString();if(d!==ld){gm.push({type:"date",date:msg.createdAt});ld=d;}gm.push({type:"message",data:msg});});
  if(loading)return<p className="empty-text">Loading...</p>;

  return (
    <div className="meet-page">
      <div className="meet-sidebar">
        <div className="meet-tabs">
          <button className={`meet-tab${tab==="chat"?" active":""}`} onClick={()=>setTab("chat")}>Chat</button>
          <button className={`meet-tab${tab==="rooms"?" active":""}`} onClick={()=>setTab("rooms")}>Voice Rooms {activeRoom&&<span className="meet-tab-live">LIVE</span>}</button>
        </div>
        {tab==="chat"?(
          <>
            <div className="meet-sidebar-header"><h3>Messages</h3><button className="meet-new-btn" onClick={openNewChatModal}>+</button></div>
            <div className="meet-conv-list">{conversations.length===0?<p style={{color:"#555",fontSize:13,padding:"20px 16px",textAlign:"center"}}>No conversations.</p>:conversations.map(conv=>{const o=getOtherUser(conv);return(<div key={conv._id} className={`meet-conv-item${activeConv?._id===conv._id?" active":""}`} onClick={()=>openConversation(conv)}><div className="meet-conv-avatar">{o?.avatar?<img src={o.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}}/>:<>{o?.name?.charAt(0)}{o?.surname?.charAt(0)||""}</>}</div><div className="meet-conv-info"><div className="meet-conv-name">{o?.name} {o?.surname||""}</div><div className="meet-conv-last">{conv.lastMessage||"No messages"}</div></div><span className="meet-conv-time">{timeAgo(conv.lastMessageAt)}</span></div>);})}</div>
          </>
        ):(
          <>
            <div className="meet-sidebar-header"><h3>Voice Rooms</h3><button className="meet-new-btn" onClick={()=>setShowCreateRoom(true)}>+</button></div>
            <div className="meet-conv-list">{rooms.length===0?<p style={{color:"#555",fontSize:13,padding:"20px 16px",textAlign:"center"}}>No rooms.</p>:rooms.map(room=>{const inR=activeRoom?._id===room._id;return(<div key={room._id} className={`meet-conv-item${inR?" active":""}`}><div className="meet-room-icon">{inR?"🔊":room.participants?.length>0?"🟢":"🔇"}</div><div className="meet-conv-info" onClick={()=>!inR&&handleJoinRoom(room)} style={{cursor:"pointer"}}><div className="meet-conv-name">{room.name}</div><div className="meet-conv-last">{room.participants?.length||0} participant{(room.participants?.length||0)!==1?"s":""}</div></div><div style={{display:"flex",gap:4}}>{inR&&<button className="voice-ctrl-btn leave" onClick={handleLeaveRoom}>Leave</button>}{room.createdBy?._id===user._id&&!inR&&<button className="task-delete-btn" style={{opacity:1}} onClick={()=>handleDeleteRoom(room._id)}>✕</button>}</div></div>);})}</div>
          </>
        )}
      </div>
      <div className="meet-chat">
        {tab==="chat"&&activeConv?(
          <>
            <div className="meet-chat-header"><div className="meet-conv-avatar" style={{width:36,height:36,fontSize:13}}>{(()=>{const o=getOtherUser(activeConv);return o?.avatar?<img src={o.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}}/>:<>{o?.name?.charAt(0)}{o?.surname?.charAt(0)||""}</>;})()}</div><div><div style={{fontWeight:600,color:"#e1e4e8",fontSize:15}}>{(()=>{const o=getOtherUser(activeConv);return`${o?.name} ${o?.surname||""}`;})()}</div><div style={{fontSize:11,color:"#8b8fa3"}}>{(()=>{const o=getOtherUser(activeConv);return Array.isArray(o?.role)?o.role.join(", "):o?.role||"";})()}</div></div></div>
            <div className="meet-messages">{msgLoading?<p style={{color:"#555",textAlign:"center",padding:40}}>Loading...</p>:gm.length===0?<p style={{color:"#555",textAlign:"center",padding:40}}>No messages yet.</p>:gm.map((item,idx)=>{if(item.type==="date")return<div key={`d-${idx}`} className="meet-date-separator"><span>{formatDateSep(item.date)}</span></div>;const msg=item.data;const isMe=msg.sender?._id===user._id;return(<div key={msg._id} className={`meet-msg${isMe?" me":""}`}>{!isMe&&<div className="meet-msg-avatar">{msg.sender?.avatar?<img src={msg.sender.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}}/>:<>{msg.sender?.name?.charAt(0)}{msg.sender?.surname?.charAt(0)||""}</>}</div>}<div className={`meet-msg-bubble${isMe?" me":""}`}>{msg.audio?<AudioPlayer src={msg.audio}/>:<div className="meet-msg-text">{msg.text}</div>}<div className="meet-msg-time">{formatTime(msg.createdAt)}</div></div></div>);})}<div ref={messagesEndRef}/></div>
            <div className="meet-input-area">{recording?(<div className="voice-recording-bar"><div className="voice-rec-dot"/><span className="voice-rec-time">{fmtDur(recordTime)}</span><span style={{color:"#ff6b6b",fontSize:13}}>Recording...</span><button className="voice-ctrl-btn stop" onClick={stopRecording}>Stop & Send</button></div>):(<><button className="voice-record-btn" onClick={startRecording}>🎙</button><input ref={inputRef} type="text" placeholder="Type a message..." value={newMsg} onChange={e=>setNewMsg(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")handleSend();}} disabled={sending}/><button className="meet-send-btn" onClick={handleSend} disabled={sending||!newMsg.trim()}>Send</button></>)}</div>
          </>
        ):tab==="rooms"&&activeRoom?(
          <div className="voice-room-active">
            <div className="voice-room-header"><h3>{activeRoom.name}</h3><div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}><button className={`voice-ctrl-btn${isMuted?" muted":""}`} onClick={toggleMute}>{isMuted?"🔇 Unmute":"🎙 Mute"}</button><button className={`voice-ctrl-btn${isDeafened?" muted":""}`} onClick={toggleDeafen}>{isDeafened?"🔇 Undeafen":"🔈 Deafen"}</button><button className={`voice-ctrl-btn${isScreenSharing?" muted":""}`} onClick={isScreenSharing?stopScreenShare:startScreenShare}>{isScreenSharing?"🖥 Stop":"🖥 Screen"}</button><button className="voice-ctrl-btn" onClick={()=>setShowSettings(!showSettings)}>⚙</button><button className="voice-ctrl-btn leave" onClick={handleLeaveRoom}>Leave</button></div></div>
            {showSettings&&<div style={{padding:"12px 24px",background:"rgba(255,255,255,0.02)",borderBottom:"1px solid #21232d",display:"flex",alignItems:"center",gap:16}}><span style={{fontSize:12,color:"#8b8fa3",minWidth:130}}>Noise Gate: {noiseThreshold}</span><input type="range" min="5" max="60" value={noiseThreshold} onChange={e=>setNoiseThreshold(Number(e.target.value))} style={{flex:1,accentColor:"#667eea"}}/><span style={{fontSize:11,color:"#555"}}>Low=sensitive High=filters more</span></div>}
            {screenShareUser&&<div style={{padding:16,borderBottom:"1px solid #21232d",background:"#000",display:"flex",justifyContent:"center"}}><video ref={screenVideoRef} autoPlay playsInline style={{maxWidth:"100%",maxHeight:400,borderRadius:8}}/></div>}
            <div className="voice-room-participants"><h4 style={{fontSize:13,color:"#8b8fa3",textTransform:"uppercase",letterSpacing:0.5,marginBottom:16}}>Participants ({activeRoom.participants?.length||0})</h4><div className="voice-participants-grid">{activeRoom.participants?.map(p=>{const sp=speakingUsers[p._id];const mu=p._id===user._id?isMuted:mutedUsers[p._id];return(<div key={p._id} className={`voice-participant-card${mu?" muted":""}${sp&&!mu?" speaking":""}`}><div className="voice-participant-avatar">{p.avatar?<img src={p.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}}/>:<>{p.name?.charAt(0)}{p.surname?.charAt(0)||""}</>}</div><div className="voice-participant-name">{p.name} {p.surname||""}{p._id===user._id?" (you)":""}</div><div className="voice-participant-status">{mu?"🔇":sp?"🔊":"🎙"}{p._id===screenShareUser?" 🖥":""}</div></div>);})}</div></div>
          </div>
        ):(<div className="meet-empty"><div style={{fontSize:48,marginBottom:16}}>{tab==="chat"?"💬":"🎙"}</div><h3 style={{color:"#fff",marginBottom:8}}>{tab==="chat"?"Select a conversation":"Join a voice room"}</h3><p style={{color:"#555"}}>{tab==="chat"?"Choose a conversation or start one":"Select a room or create one"}</p></div>)}
      </div>
      {showNewChat&&<div className="modal-overlay" onClick={()=>{setShowNewChat(false);setSearchTerm("");}}><div className="modal-content modal-form" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>{setShowNewChat(false);setSearchTerm("");}}>✕</button><h2 className="modal-title">New Conversation</h2><div className="form-group"><input type="text" placeholder="Search..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} autoFocus/></div><div className="member-select-list" style={{maxHeight:320}}>{filteredMembers.length===0?<p style={{color:"#555",fontSize:13,padding:16,textAlign:"center"}}>No members</p>:filteredMembers.map(m=><div key={m._id} className="member-select-item" onClick={()=>startNewChat(m._id)} style={{cursor:"pointer"}}><div className="member-select-avatar">{m.avatar?<img src={m.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}}/>:<>{m.name?.charAt(0)}{m.surname?.charAt(0)||""}</>}</div><div className="member-select-info"><span>{m.name} {m.surname||""}</span><span className="member-select-role">{Array.isArray(m.role)?m.role.join(", "):m.role}</span></div></div>)}</div></div></div>}
      {showCreateRoom&&<div className="modal-overlay" onClick={()=>setShowCreateRoom(false)}><div className="modal-content modal-form" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowCreateRoom(false)}>✕</button><h2 className="modal-title">Create Voice Room</h2><div className="form-group"><label>Room Name *</label><input type="text" value={roomName} onChange={e=>setRoomName(e.target.value)} placeholder="e.g. Daily Standup" autoFocus onKeyDown={e=>{if(e.key==="Enter")handleCreateRoom();}}/></div><button className="btn" onClick={handleCreateRoom} disabled={!roomName.trim()}>Create Room</button></div></div>}
    </div>
  );
}
export default Meet;

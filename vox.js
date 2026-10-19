/* VOX client: Supabase Realtime broadcast + WebRTC audio.
 * Publishable key is designed for browser use. Never put a service_role/secret key here.
 */
const SUPABASE_URL = "https://kmljfpyforhzgnhwutyk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_0esq0ZdJFftOIqzz0F42vQ_COodg5pV";
const $ = (s) => document.querySelector(s);
let supabase = null, channel = null, stream = null, roomId = "", userId = crypto.randomUUID();
let muted = false, deafened = false, joined = false;
const peers = new Map(), remoteAudio = new Map(), remoteNames = new Map(), pendingCandidates = new Map();
const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
function toast(message) { const el=$("#toast"); el.textContent=message; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),2600); }
function cleanRoom(value) { return value.trim().toLowerCase().replace(/[^a-z0-9_-]/g,"").slice(0,40); }
function ready() {
 if (!window.supabase || !SUPABASE_URL || !SUPABASE_ANON_KEY) { toast("Configure Supabase URL and anon key in vox.js first."); return false; }
 if (!supabase) supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
 return true;
}
function send(type, payload) { if (channel) return channel.send({type:"broadcast",event:"signal",payload:{type,from:userId,room:roomId,...payload}}); return Promise.resolve("CLOSED"); }
function addPerson(id,name,local=false) {
 let card=document.querySelector('[data-person="'+CSS.escape(id)+'"]');
 if(!card){ card=document.createElement("div"); card.className="person"; card.dataset.person=id; const face=document.createElement("div"); face.className="face"; face.textContent=local?"🎙":"👤"; const n=document.createElement("b"); n.className="personName"; n.textContent=name; const state=document.createElement("span"); state.className="personState"; state.textContent=local?(muted?"Muted":"Connected"):"Connecting…"; card.append(face,n,state); $("#people").querySelector(".empty")?.remove(); $("#people").append(card); }
 card.querySelector(".personName").textContent=name; card.querySelector(".personState").textContent=local?(muted?"Muted":"Connected"):"Connected";
 renderMembers();
}
function removePerson(id) { document.querySelector('[data-person="'+CSS.escape(id)+'"]')?.remove(); const audio=remoteAudio.get(id); if(audio)audio.remove(); remoteAudio.delete(id); remoteNames.delete(id); const pc=peers.get(id); if(pc)pc.close(); peers.delete(id); renderMembers(); if(!$("#people").children.length)$("#people").innerHTML='<div class="empty">Nobody is here yet.</div>'; }
function renderMembers() { const list=$("#members"); list.replaceChildren(); const all=[{id:userId,name:$("#username").value||"You",local:true},...Array.from(remoteNames,([id,name])=>({id,name}))]; $("#peerCount").textContent=all.length; all.forEach(p=>{const row=document.createElement("div");row.className="member";const name=document.createElement("b");name.textContent=p.name+(p.local?" (you)":"");const status=document.createElement("span");status.textContent=p.local?(muted?"Muted":"Online"):"Connected";row.append(name,status);list.append(row);}); }
async function peerFor(id,name,initiator) {
 if(peers.has(id))return peers.get(id);
 const pc=new RTCPeerConnection(config); peers.set(id,pc); remoteNames.set(id,name); addPerson(id,name);
 if(stream)stream.getTracks().forEach(track=>pc.addTrack(track,stream));
 pc.onicecandidate=e=>{if(e.candidate)send("candidate",{to:id,candidate:e.candidate});};
 pc.ontrack=e=>{let audio=remoteAudio.get(id);if(!audio){audio=document.createElement("audio");audio.autoplay=true;audio.playsInline=true;audio.volume=deafened?0:Number($("#volume").value)/100;document.body.append(audio);remoteAudio.set(id,audio);}audio.srcObject=e.streams[0];audio.play().catch(()=>toast("Click the page once to enable audio playback."));};
 pc.onconnectionstatechange=()=>{if(["failed","closed","disconnected"].includes(pc.connectionState)&&pc.connectionState!=="disconnected")removePerson(id);};
 if(initiator){const offer=await pc.createOffer();await pc.setLocalDescription(offer);send("offer",{to:id,description:pc.localDescription,name:$("#username").value});}
 return pc;
}
async function handleSignal(message) {
 const p=message.payload;if(!p||p.from===userId||p.room!==roomId)return;if(p.to&&p.to!==userId)return;
 try {
  if(p.type==="hello"){if(p.from<userId){const pc=await peerFor(p.from,p.name||"Guest",false);const offer=await pc.createOffer();await pc.setLocalDescription(offer);send("offer",{to:p.from,description:pc.localDescription,name:$("#username").value});}else{await peerFor(p.from,p.name||"Guest",false);}}
  if(p.type==="offer"){const pc=await peerFor(p.from,p.name||"Guest",false);await pc.setRemoteDescription(p.description);for(const candidate of (pendingCandidates.get(p.from)||[]))await pc.addIceCandidate(candidate);pendingCandidates.delete(p.from);const answer=await pc.createAnswer();await pc.setLocalDescription(answer);send("answer",{to:p.from,description:pc.localDescription,name:$("#username").value});}
  if(p.type==="answer"){const pc=peers.get(p.from);if(pc){await pc.setRemoteDescription(p.description);for(const candidate of (pendingCandidates.get(p.from)||[]))await pc.addIceCandidate(candidate);pendingCandidates.delete(p.from);}}
  if(p.type==="candidate"){const pc=peers.get(p.from);if(pc&&p.candidate){if(pc.remoteDescription)await pc.addIceCandidate(p.candidate);else{if(!pendingCandidates.has(p.from))pendingCandidates.set(p.from,[]);pendingCandidates.get(p.from).push(p.candidate);}}}
  if(p.type==="chat"){const line=document.createElement("p");const b=document.createElement("b");b.textContent=(p.name||"Guest")+": ";line.append(b,document.createTextNode(p.text||""));$("#messages").append(line);$("#messages").scrollTop=$("#messages").scrollHeight;}
  if(p.type==="bye")removePerson(p.from);
 }catch(err){console.error("VOX signaling error",err);toast("Connection issue. Check room settings and network.");}
}
async function joinRoom() {
 if(joined)return toast("You are already in a room.");
 if(!ready())return;
 const joinButton=$("#join");
 joinButton.disabled=true;
 joinButton.textContent="Connecting…";
 $("#connectionState").textContent="Requesting microphone…";
 $("#micStatus").textContent="Waiting for microphone permission. Check your browser's address bar for a permission prompt.";
 roomId=cleanRoom($("#roomCode").value)||"general";
 $("#roomCode").value=roomId;
 try {
  if(!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia!=="function") {
   throw new Error("Microphone access is unavailable. Open the published HTTPS GitHub Pages site in a normal browser tab.");
  }
  stream=await navigator.mediaDevices.getUserMedia({audio:{deviceId:$("#inputDevice").value||undefined,echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
  stream.getAudioTracks().forEach(t=>t.enabled=true);
  channel=supabase.channel("vox-room-"+roomId,{config:{broadcast:{self:false}}});
  channel.on("broadcast",{event:"signal"},handleSignal);
  await channel.subscribe((status,err)=>{console.info("VOX Supabase channel status:",status,err||"");if(status==="SUBSCRIBED"){joined=true;joinButton.disabled=false;$("#connectionState").textContent="Connected · "+roomId;$("#micStatus").textContent="Microphone connected. Say hello!";$("#chatRoom").textContent="# "+roomId;addPerson(userId,$("#username").value||"You",true);send("hello",{name:$("#username").value||"Guest"});setTimeout(()=>send("hello",{name:$("#username").value||"Guest"}),700);joinButton.textContent="Connected";toast("Joined "+roomId);}else if(status==="CHANNEL_ERROR"||status==="TIMED_OUT"||status==="CLOSED"){joinButton.disabled=false;joinButton.textContent="Join voice room";$("#connectionState").textContent="Connection failed";$("#micStatus").textContent="Could not connect to Supabase Realtime. Check project Realtime settings and browser console.";console.error("VOX Realtime subscription failed:",status,err);toast("Supabase Realtime failed: "+status+". See browser console for details.");}});
 } catch(err){console.error("VOX join error:",err);if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;if(channel){try{await supabase.removeChannel(channel);}catch{}channel=null;}joinButton.disabled=false;joinButton.textContent="Join voice room";$("#connectionState").textContent="Not connected";const message=err.name==="NotAllowedError"?"Microphone permission was denied or blocked. Allow microphone access for this site in Firefox's address-bar permissions.":err.name==="NotFoundError"?"No microphone was found. Connect or select one.":err.name==="NotReadableError"?"The microphone is busy or unavailable. Close other apps using it and retry.":err.name==="TypeError"?"Microphone access is unavailable in this page context. Make sure you opened the HTTPS GitHub Pages website directly.":(err.message||"Could not join room. Check the browser console.");$("#micStatus").textContent=message;toast(message);}
}
async function leaveRoom(){if(!joined){toast("You are not in a room.");return;}send("bye",{});joined=false;muted=false;deafened=false;if(channel){await supabase.removeChannel(channel);channel=null;}for(const id of [...peers.keys()])removePerson(id);if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;$("#connectionState").textContent="Not connected";$("#micStatus").textContent="You left the room.";$("#join").textContent="Join voice room";$("#mute").classList.remove("on");$("#deafen").classList.remove("on");toast("Left voice room.");}
$("#join").onclick=joinRoom;$("#leave").onclick=leaveRoom;
$("#mute").onclick=()=>{if(!stream)return toast("Join a room first.");muted=!muted;stream.getAudioTracks().forEach(t=>t.enabled=!muted);$("#mute").classList.toggle("on",muted);$("#micStatus").textContent=muted?"Microphone muted":"Microphone live";const local=document.querySelector('[data-person="'+CSS.escape(userId)+'"] .personState');if(local)local.textContent=muted?"Muted":"Connected";renderMembers();};
$("#deafen").onclick=()=>{deafened=!deafened;remoteAudio.forEach(a=>a.volume=deafened?0:Number($("#volume").value)/100);$("#deafen").classList.toggle("on",deafened);toast(deafened?"Deafened":"Audio restored");};
$("#volume").oninput=e=>{ $("#volumeValue").textContent=e.target.value+"%";remoteAudio.forEach(a=>a.volume=deafened?0:Number(e.target.value)/100);};
$("#chatToggle").onclick=()=>$("#chat").classList.toggle("hidden");$("#settingsToggle").onclick=()=>$("#settings").scrollIntoView({behavior:"smooth"});
document.querySelectorAll(".room").forEach(btn=>btn.onclick=()=>{document.querySelectorAll(".room").forEach(b=>b.classList.remove("selected"));btn.classList.add("selected");$("#roomTitle").textContent=btn.dataset.room;$("#roomCode").value=btn.dataset.room.toLowerCase();$("#chatRoom").textContent="# "+btn.dataset.room.toLowerCase();});
$("#invite").onclick=async()=>{const url=location.origin+location.pathname+"?room="+encodeURIComponent(roomId||cleanRoom($("#roomCode").value)||"general");try{await navigator.clipboard.writeText(url);toast("Invite link copied");}catch{prompt("Copy this room link:",url);}};
$("#chatForm").onsubmit=e=>{e.preventDefault();const input=$("#messageInput"),text=input.value.trim();if(!text)return;if(!joined||!channel)return toast("Join a room before chatting.");const name=$("#username").value.trim()||"Guest";send("chat",{name,text});const p=document.createElement("p"),b=document.createElement("b");b.textContent=name+": ";p.append(b,document.createTextNode(text));$("#messages").append(p);$("#messages").scrollTop=$("#messages").scrollHeight;input.value="";};
async function listDevices(){try{const devices=await navigator.mediaDevices.enumerateDevices();for(const [kind,id] of [["audioinput","inputDevice"],["audiooutput","outputDevice"]]){const select=$("#"+id),old=select.value;select.replaceChildren(new Option(kind==="audioinput"?"Default microphone":"Default output",""));devices.filter(d=>d.kind===kind).forEach((d,i)=>select.add(new Option(d.label||((kind==="audioinput"?"Microphone ":"Output ")+(i+1)),d.deviceId)));select.value=old;}}catch{}}
$("#inputDevice").onfocus=async()=>{try{const s=await navigator.mediaDevices.getUserMedia({audio:true});s.getTracks().forEach(t=>t.stop());await listDevices();}catch{toast("Microphone permission is required to list devices.");}};
$("#outputDevice").onchange=()=>toast("Output device routing depends on browser support.");
const params=new URLSearchParams(location.search);if(params.has("room"))$("#roomCode").value=cleanRoom(params.get("room"))||"general";
if(!SUPABASE_URL||!SUPABASE_ANON_KEY)$("#connectionState").textContent="Setup required";

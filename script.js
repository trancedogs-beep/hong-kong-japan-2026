import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

(() => {
  const app = document.getElementById("app");
  if (!app) return;

  const PREP_KEY = "trip-prep-v1";
  const ITINERARY_KEY = "trip-itinerary-board-v2";
  const prepItems = [...document.querySelectorAll(".prep-item[data-id]")];
  const syncPanel = document.getElementById("sync-panel");
  const syncStatus = document.getElementById("sync-status");
  const syncDetail = document.getElementById("sync-detail");
  const shareButton = document.getElementById("share-trip");
  const linkDialog = document.getElementById("trip-link-dialog");
  const linkForm = document.getElementById("trip-link-form");
  const linkInput = document.getElementById("trip-link-url");
  const linkItemName = document.getElementById("trip-link-item-name");
  const linkDelete = document.getElementById("trip-link-delete");
  let editingLinkId = "";

  const firebaseConfig = {
    apiKey: "AIzaSyDaOMuNtawMPrXShXRpA-ZVRVSCfP0ECqE",
    authDomain: "hong-kong-japan-2026.firebaseapp.com",
    projectId: "hong-kong-japan-2026",
    storageBucket: "hong-kong-japan-2026.firebasestorage.app",
    messagingSenderId: "1028782809441",
    appId: "1:1028782809441:web:839b0e1f2f5e3dd5d66520"
  };
  const firebaseApp = initializeApp(firebaseConfig);
  const auth = getAuth(firebaseApp);
  const db = getFirestore(firebaseApp);
  const ROOM_PATTERN = /^[A-Za-z0-9_-]{32}$/;
  const requestedRoom = new URL(window.location.href).searchParams.get("trip") || "";
  let activeRoomId = ROOM_PATTERN.test(requestedRoom) ? requestedRoom : "";
  let saveTimer = null;
  const cloud = {
    enabled: false,
    connecting: false,
    saving: false,
    dirty: false,
    revision: 0,
    roomRef: null,
    unsubscribe: null
  };

  const defaultItems = [
    {id:"hk-flight-in",day:1,title:"HX253・TPE → HKG・14:15 抵達",type:"fixed"},{id:"page148-in",day:1,title:"Page 148・Check-in",type:"fixed"},{id:"united-hair",day:1,title:"United Hair Shop・21:30",type:"yiyi"},{id:"oi-man-sang",day:1,title:"愛文生・23:00",type:"unsure"},{id:"avenue-stars",day:1,title:"星光大道",type:"yiyi"},
    {id:"noc",day:2,title:"NOC Coffee",type:"yiyi"},{id:"bakehouse",day:2,title:"Bakehouse",type:"yiyi"},{id:"hashtag-b",day:2,title:"Hashtag B",type:"yiyi"},{id:"the24st",day:2,title:"THE 24 . ST・買伴手禮",type:"yiyi"},{id:"fine-foods",day:2,title:"帝苑餅店",type:"unsure"},{id:"kams",day:2,title:"甘牌燒鵝",type:"yiyi"},{id:"wong-to-yick",day:2,title:"黃道益活絡油",type:"yiyi"},{id:"soft-thunder",day:2,title:"Soft Thunder Bakery",type:"unsure"},
    {id:"fineprint",day:3,title:"FINEPRINT",type:"unsure"},{id:"tai-hang",day:3,title:"大坑",type:"unsure"},{id:"stanley",day:3,title:"赤柱廣場",type:"unsure"},{id:"le-petit",day:3,title:"Le Petit Salon",type:"unsure"},
    {id:"aus-dairy",day:4,title:"澳洲牛奶公司・07:30 起早餐",type:"yiyi"},{id:"hk-airport",day:4,title:"前往香港機場",type:"fixed"},{id:"hk-flight-out",day:4,title:"JX234・HKG → TPE・11:20",type:"fixed"},{id:"taipei-reset",day:4,title:"回台整理日本行李＋洗衣服",type:"fixed"},
    {id:"jp-flight-in",day:5,title:"JX820・TPE → KIX・12:15 抵達",type:"fixed"},{id:"park-front",day:5,title:"日本環球影城園前飯店・Check-in",type:"fixed"},{id:"ten-yen",day:5,title:"10元燒",type:"yiyi"},{id:"donki-dotonbori",day:5,title:"唐吉軻德",type:"yiyi"},{id:"muji",day:5,title:"無印良品",type:"yiyi"},{id:"bic-camera",day:5,title:"BIC CAMERA",type:"yiyi"},{id:"lush",day:5,title:"LUSH",type:"yiyi"},
    {id:"usj-fast",day:6,title:"USJ・快速通關攻略日",type:"fixed"},{id:"usj-nintendo",day:6,title:"超級任天堂世界",type:"yiyi"},{id:"usj-flying",day:6,title:"飛天翼龍",type:"yiyi"},{id:"usj-hollywood",day:6,title:"好萊塢美夢",type:"yiyi"},
    {id:"park-front-bag",day:7,title:"園前飯店退房・行李寄櫃檯",type:"fixed"},{id:"usj-chill",day:7,title:"USJ・無快速通關 Chill Day",type:"fixed"},{id:"usj-halloween",day:7,title:"Halloween／生日拍照",type:"yiyi"},{id:"leave-usj",day:7,title:"離開 USJ・領行李",type:"fixed"},{id:"chuan-in",day:7,title:"Chuan House Dotonbori・入住",type:"fixed"},
    {id:"osaka-kyoto",day:8,title:"大阪 → 京都",type:"fixed"},{id:"kishotei-in",day:8,title:"喜招邸 御所南・入住",type:"fixed"},{id:"kamogawa",day:8,title:"鴨川",type:"unsure"},{id:"lescamoteur",day:8,title:"L'Escamoteur",type:"unsure"},
    {id:"arashiyama",day:9,title:"嵐山",type:"unsure"},{id:"togetsukyo",day:9,title:"渡月橋",type:"unsure"},{id:"kyoto-osaka",day:9,title:"京都 → 大阪・回 Chuan House",type:"fixed"},
    {id:"seam-osaka",day:10,title:"大阪 SEAM",type:"unsure"},
    {id:"last-shopping",day:11,title:"最後採買／逛街",type:"unsure"},{id:"kix-transfer",day:11,title:"前往關西機場",type:"fixed"},{id:"jp-flight-out",day:11,title:"JX823・KIX → TPE・15:10",type:"fixed"}
  ];

  function cloneDefaults(){return defaultItems.map(item=>({...item}))}
  function storageKey(key){return activeRoomId?`${key}:${activeRoomId}`:key}
  function readStored(key,fallback="null"){return localStorage.getItem(storageKey(key))??(activeRoomId?localStorage.getItem(key):null)??fallback}
  function loadItinerary(){try{const saved=JSON.parse(readStored(ITINERARY_KEY));if(Array.isArray(saved)&&saved.length)return saved}catch{}return cloneDefaults()}
  let itinerary=loadItinerary();
  function saveItinerary(){localStorage.setItem(storageKey(ITINERARY_KEY),JSON.stringify(itinerary));scheduleCloudSave()}
  function typeLabel(type){return {fixed:"固定",yiyi:"一一必去",unsure:"自由更動",f517:"517 必去"}[type]||"行程"}

  function setSyncState(state,title,detail){
    if(syncPanel)syncPanel.dataset.state=state;
    if(syncStatus)syncStatus.textContent=title;
    if(syncDetail)syncDetail.textContent=detail;
  }
  function formatSyncTime(){return `最後更新 ${new Intl.DateTimeFormat("zh-TW",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}).format(new Date())}`}
  function currentPayload(){return {itinerary:itinerary.map(item=>({...item})),completedPrep:[...completed],schemaVersion:1}}
  function generateRoomId(){
    const bytes=new Uint8Array(24);crypto.getRandomValues(bytes);
    let binary="";bytes.forEach(byte=>{binary+=String.fromCharCode(byte)});
    return btoa(binary).replaceAll("+","-").replaceAll("/","_").replaceAll("=","");
  }
  function sharedUrl(){const url=new URL(window.location.href);url.search="";url.searchParams.set("trip",activeRoomId);url.hash="";return url.toString()}
  async function copySharedUrl(){
    const url=sharedUrl();
    try{await navigator.clipboard.writeText(url)}catch{window.prompt("請複製這個共同編輯連結：",url);return}
    if(shareButton){shareButton.textContent="連結已複製 ✓";setTimeout(()=>{shareButton.textContent="複製共編連結"},1800)}
  }
  function normalizeLink(value){
    const text=typeof value==="string"?value.trim():"";
    if(!text)return "";
    try{const url=new URL(/^https?:\/\//i.test(text)?text:`https://${text}`);return ["http:","https:"].includes(url.protocol)?url.toString():""}catch{return ""}
  }
  function sanitizeItinerary(value){
    if(!Array.isArray(value))return null;
    const allowedTypes=new Set(["fixed","yiyi","unsure","f517"]);
    const clean=value.slice(0,100).map(item=>{
      const result={
        id:typeof item?.id==="string"?item.id.slice(0,100):"",
        day:Number(item?.day),
        title:typeof item?.title==="string"?item.title.slice(0,120):"",
        type:allowedTypes.has(item?.type)?item.type:"unsure"
      };
      const link=normalizeLink(item?.link);if(link)result.link=link;
      return result;
    }).filter(item=>item.id&&item.title&&Number.isInteger(item.day)&&item.day>=1&&item.day<=11);
    return clean.length?clean:null;
  }
  function applyRemoteData(data,fromCompanion=false){
    const cleanItinerary=sanitizeItinerary(data?.itinerary);
    const validPrep=Array.isArray(data?.completedPrep)?data.completedPrep.filter(id=>typeof id==="string").slice(0,30):[];
    if(cleanItinerary)itinerary=cleanItinerary;
    completed=new Set(validPrep);
    localStorage.setItem(storageKey(ITINERARY_KEY),JSON.stringify(itinerary));
    localStorage.setItem(storageKey(PREP_KEY),JSON.stringify([...completed]));
    renderItinerary();renderPrep();
    if(fromCompanion)setSyncState("synced","已同步","已收到同行人的最新修改");
  }
  function scheduleCloudSave(){
    if(!cloud.enabled)return;
    cloud.dirty=true;
    if(!navigator.onLine){setSyncState("offline","目前離線","調整已存在這台裝置，恢復網路後會自動同步");return}
    clearTimeout(saveTimer);saveTimer=setTimeout(flushCloudSave,300);
  }
  async function flushCloudSave(){
    if(!cloud.enabled||cloud.saving||!cloud.dirty||!cloud.roomRef)return;
    if(!navigator.onLine){setSyncState("offline","目前離線","調整已存在這台裝置，恢復網路後會自動同步");return}
    cloud.dirty=false;cloud.saving=true;
    const payload=currentPayload();const expectedRevision=cloud.revision;
    setSyncState("saving","正在同步…","正在把最新調整存到共同行程");
    try{
      const nextRevision=await runTransaction(db,async transaction=>{
        const snapshot=await transaction.get(cloud.roomRef);
        if(!snapshot.exists()||snapshot.data().revision!==expectedRevision)throw new Error("SYNC_CONFLICT");
        const revision=expectedRevision+1;
        transaction.update(cloud.roomRef,{...payload,revision,updatedAt:serverTimestamp(),updatedBy:auth.currentUser.uid});
        return revision;
      });
      cloud.revision=Math.max(cloud.revision,nextRevision);
      setSyncState("synced","已同步",formatSyncTime());
    }catch(error){
      if(error?.message==="SYNC_CONFLICT"){
        cloud.dirty=false;
        try{const newest=await getDoc(cloud.roomRef);if(newest.exists()){cloud.revision=Number(newest.data().revision)||cloud.revision;applyRemoteData(newest.data())}}catch{}
        setSyncState("conflict","已載入較新版本","同行人剛好也在修改，請再做一次剛才的調整");
      }else{
        const retryable=!navigator.onLine||["unavailable","deadline-exceeded","aborted","cancelled","resource-exhausted"].includes(error?.code);
        cloud.dirty=retryable;
        setSyncState(navigator.onLine?"error":"offline",navigator.onLine?"同步暫時失敗":"目前離線",retryable?"調整已保存在這台裝置，稍後會再試一次":"請重新整理；若仍失敗，請確認 Firebase 規則與匿名登入設定");
      }
    }finally{
      cloud.saving=false;
      if(cloud.dirty&&navigator.onLine){clearTimeout(saveTimer);saveTimer=setTimeout(flushCloudSave,1200)}
    }
  }
  async function connectRoom(createIfMissing=false){
    if(cloud.connecting||cloud.enabled||!activeRoomId)return;
    cloud.connecting=true;
    if(shareButton)shareButton.disabled=true;
    setSyncState("connecting","正在連接共同行程…","第一次連線可能需要幾秒鐘");
    try{
      if(!auth.currentUser)await signInAnonymously(auth);
      cloud.roomRef=doc(db,"sharedTrips",activeRoomId);
      const snapshot=await getDoc(cloud.roomRef);
      if(!snapshot.exists()){
        if(!createIfMissing)throw new Error("ROOM_NOT_FOUND");
        await setDoc(cloud.roomRef,{...currentPayload(),revision:1,updatedAt:serverTimestamp(),updatedBy:auth.currentUser.uid});
        cloud.revision=1;
      }else{
        cloud.revision=Number(snapshot.data().revision)||1;
        applyRemoteData(snapshot.data());
      }
      cloud.enabled=true;cloud.dirty=false;
      if(shareButton)shareButton.textContent="複製共編連結";
      cloud.unsubscribe=onSnapshot(cloud.roomRef,remote=>{
        if(!remote.exists())return;
        const data=remote.data();const revision=Number(data.revision)||0;
        if(revision<=cloud.revision)return;
        const fromCompanion=data.updatedBy!==auth.currentUser?.uid;
        if(cloud.dirty||cloud.saving||document.querySelector('.trip-title[data-editing="true"]')){
          if(fromCompanion)setSyncState("saving","偵測到同行人也在修改…","正在確認最新版本");
          return;
        }
        cloud.revision=revision;cloud.dirty=false;
        applyRemoteData(data,fromCompanion);
        if(!fromCompanion)setSyncState("synced","已同步",formatSyncTime());
      },()=>setSyncState("error","即時連線中斷","調整仍保存在這台裝置，請重新整理後再試"));
      setSyncState("synced","已同步",formatSyncTime());
    }catch(error){
      setSyncState("error",error?.message==="ROOM_NOT_FOUND"?"找不到這份共同行程":"無法連上共同行程",error?.message==="ROOM_NOT_FOUND"?"請確認你開啟的是完整的分享連結":"請檢查網路後重新整理頁面");
    }finally{cloud.connecting=false;if(shareButton)shareButton.disabled=false}
  }

  function updateItemLink(id,link){
    const item=itinerary.find(entry=>entry.id===id);if(!item)return;
    if(link)item.link=link;else delete item.link;
    saveItinerary();renderItinerary();
  }
  function openLinkEditor(id){
    const item=itinerary.find(entry=>entry.id===id);if(!item||!linkDialog||!linkInput)return;
    editingLinkId=id;linkInput.value=normalizeLink(item.link);linkInput.setCustomValidity("");
    if(linkItemName)linkItemName.textContent=item.title;
    if(linkDelete)linkDelete.hidden=!item.link;
    linkDialog.showModal();setTimeout(()=>linkInput.focus(),60);
  }
  linkInput?.addEventListener("input",()=>linkInput.setCustomValidity(""));
  linkForm?.addEventListener("submit",event=>{
    event.preventDefault();const raw=linkInput?.value.trim()||"";const link=normalizeLink(raw);
    if(raw&&!link){linkInput.setCustomValidity("請貼上有效的網址");linkInput.reportValidity();return}
    updateItemLink(editingLinkId,link);linkDialog.close();
  });
  document.getElementById("trip-link-close")?.addEventListener("click",()=>linkDialog?.close());
  document.getElementById("trip-link-cancel")?.addEventListener("click",()=>linkDialog?.close());
  linkDelete?.addEventListener("click",()=>{updateItemLink(editingLinkId,"");linkDialog?.close()});
  linkDialog?.addEventListener("close",()=>{editingLinkId=""});

  function beginTitleEdit(title){
    if(!title||title.dataset.editing==="true")return;
    const item=itinerary.find(entry=>entry.id===title.closest(".trip-item")?.dataset.id);if(!item)return;
    title.dataset.editing="true";title.dataset.original=item.title;title.contentEditable="plaintext-only";
    title.setAttribute("role","textbox");title.setAttribute("aria-label","編輯行程內容");
    const card=title.closest(".trip-item");if(card)card.draggable=false;
    title.focus();
    const selection=window.getSelection();if(selection){const range=document.createRange();range.selectNodeContents(title);range.collapse(false);selection.removeAllRanges();selection.addRange(range)}
  }
  function finishTitleEdit(title,shouldSave){
    if(!title||title.dataset.editing!=="true")return;
    const item=itinerary.find(entry=>entry.id===title.closest(".trip-item")?.dataset.id);
    const original=title.dataset.original||item?.title||"";
    const next=title.innerText.replace(/\s+/g," ").trim().slice(0,120);
    if(item&&shouldSave&&next){item.title=next;title.textContent=next;if(next!==original)saveItinerary()}else title.textContent=original;
    title.dataset.editing="false";title.contentEditable="false";delete title.dataset.original;
    title.setAttribute("role","button");title.setAttribute("aria-label","點一下編輯行程內容");
    const card=title.closest(".trip-item");if(card)card.draggable=true;
    if(document.activeElement===title)title.blur();
  }

  function renderItinerary(){
    document.querySelectorAll(".trip-dropzone").forEach(zone=>zone.innerHTML="");
    itinerary.forEach(item=>{
      const zone=document.querySelector(`.trip-dropzone[data-day="${item.day}"]`);if(!zone)return;
      const card=document.createElement("div");card.className=`trip-item trip-item-${item.type}`;card.dataset.id=item.id;card.draggable=true;
      const hasLink=Boolean(normalizeLink(item.link));
      const openIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1"/></svg>';
      const editIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>';
      const addLinkIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 15l6-6"/><path d="M7.5 18.5l-2 2a3.5 3.5 0 0 1-5-5l3-3a3.5 3.5 0 0 1 5 0"/><path d="M15.5 5.5l2-2a3.5 3.5 0 0 1 5 5l-3 3a3.5 3.5 0 0 1-5 0"/><path d="M5 5v6M2 8h6"/></svg>';
      const openLink=hasLink?`<a class="trip-link-open" target="_blank" rel="noopener noreferrer" aria-label="開啟地圖連結" title="開啟連結">${openIcon}</a>`:"";
      const removeButton='<button class="trip-remove" type="button" aria-label="刪除行程">×</button>';
      card.innerHTML=`<span class="trip-grip" aria-label="拖曳行程" title="拖曳移動">⠿</span><span class="trip-item-copy"><small>${typeLabel(item.type)}</small><strong class="trip-title" tabindex="0" role="button" aria-label="點一下編輯行程內容" title="點一下編輯"></strong></span><span class="trip-card-actions">${openLink}<button class="trip-link-edit" type="button" data-empty="${!hasLink}" aria-label="${hasLink?"編輯":"新增"}行程連結" title="${hasLink?"編輯連結":"新增 Google Maps 連結"}">${hasLink?editIcon:addLinkIcon}</button>${removeButton}</span>`;
      card.querySelector(".trip-title").textContent=item.title;zone.appendChild(card);
      const anchor=card.querySelector(".trip-link-open");if(anchor)anchor.href=normalizeLink(item.link);
    });bindTripItems();
  }

  let draggingId=null,dragHandleId=null;
  function clearDragState(){document.querySelectorAll(".trip-dropzone,.trip-item").forEach(el=>el.classList.remove("drag-over","drop-before","drop-after"))}
  function moveItem(id,targetDay,targetId=null,after=false){
    const fromIndex=itinerary.findIndex(x=>x.id===id);if(fromIndex<0)return;
    const item=itinerary[fromIndex];
    itinerary.splice(fromIndex,1);item.day=Number(targetDay);
    if(targetId&&targetId!==id){let targetIndex=itinerary.findIndex(x=>x.id===targetId);if(targetIndex>=0){if(after)targetIndex++;itinerary.splice(targetIndex,0,item)}else itinerary.push(item)}else{
      let insertAt=-1;for(let i=itinerary.length-1;i>=0;i--){if(Number(itinerary[i].day)===Number(targetDay)){insertAt=i+1;break}}if(insertAt<0)itinerary.push(item);else itinerary.splice(insertAt,0,item)
    }
    saveItinerary();renderItinerary();
  }
  function bindTripItems(){
    document.querySelectorAll('.trip-item[draggable="true"]').forEach(card=>{
      const grip=card.querySelector(".trip-grip");
      grip?.addEventListener("pointerdown",()=>{dragHandleId=card.dataset.id});
      grip?.addEventListener("pointerup",()=>{dragHandleId=null});
      grip?.addEventListener("pointercancel",()=>{dragHandleId=null});
      card.addEventListener("dragstart",event=>{if(dragHandleId!==card.dataset.id){event.preventDefault();return}draggingId=card.dataset.id;card.classList.add("dragging");event.dataTransfer.effectAllowed="move";event.dataTransfer.setData("text/plain",draggingId)});
      card.addEventListener("dragend",()=>{draggingId=null;dragHandleId=null;clearDragState()});
    });
    document.querySelectorAll(".trip-item").forEach(card=>{
      card.addEventListener("dragover",event=>{if(!draggingId||card.dataset.id===draggingId)return;event.preventDefault();event.stopPropagation();clearDragState();const rect=card.getBoundingClientRect();card.classList.add(event.clientY<rect.top+rect.height/2?"drop-before":"drop-after")});
      card.addEventListener("drop",event=>{if(!draggingId||card.dataset.id===draggingId)return;event.preventDefault();event.stopPropagation();const rect=card.getBoundingClientRect();const after=event.clientY>=rect.top+rect.height/2;const zone=card.closest(".trip-dropzone");moveItem(draggingId,zone.dataset.day,card.dataset.id,after);draggingId=null;clearDragState()});
    });
    document.querySelectorAll(".trip-title").forEach(title=>{
      title.addEventListener("click",event=>{event.stopPropagation();beginTitleEdit(title)});
      title.addEventListener("keydown",event=>{
        if(title.dataset.editing!=="true"&&(event.key==="Enter"||event.key===" ")){event.preventDefault();beginTitleEdit(title);return}
        if(title.dataset.editing==="true"&&event.key==="Enter"){event.preventDefault();title.blur()}
        if(title.dataset.editing==="true"&&event.key==="Escape"){event.preventDefault();finishTitleEdit(title,false)}
      });
      title.addEventListener("blur",()=>finishTitleEdit(title,true));
    });
    document.querySelectorAll(".trip-link-open").forEach(link=>link.addEventListener("click",event=>event.stopPropagation()));
    document.querySelectorAll(".trip-link-edit").forEach(button=>button.addEventListener("click",event=>{event.stopPropagation();openLinkEditor(button.closest(".trip-item")?.dataset.id)}));
    document.querySelectorAll(".trip-remove").forEach(button=>button.addEventListener("click",()=>{const id=button.closest(".trip-item")?.dataset.id;itinerary=itinerary.filter(item=>item.id!==id);saveItinerary();renderItinerary()}));
  }

  document.querySelectorAll(".trip-dropzone").forEach(zone=>{
    zone.addEventListener("dragover",event=>{if(!draggingId)return;event.preventDefault();zone.classList.add("drag-over")});
    zone.addEventListener("dragleave",event=>{if(!zone.contains(event.relatedTarget))zone.classList.remove("drag-over")});
    zone.addEventListener("drop",event=>{if(!draggingId)return;event.preventDefault();if(event.target.closest(".trip-item"))return;moveItem(draggingId,zone.dataset.day);draggingId=null;clearDragState()});
  });

  document.getElementById("add-trip-item")?.addEventListener("submit",event=>{event.preventDefault();const titleInput=document.getElementById("trip-item-title");const title=titleInput.value.trim();if(!title)return;itinerary.push({id:`custom-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,day:Number(document.getElementById("trip-item-day").value),title,type:document.getElementById("trip-item-type").value});saveItinerary();renderItinerary();titleInput.value="";titleInput.focus()});
  document.getElementById("reset-trip-items")?.addEventListener("click",()=>{const message=cloud.enabled?"要把共同行程板恢復成網站預設版本嗎？這會同步到同行人的裝置。":"要把行程板恢復成網站預設版本嗎？你在這台裝置上的拖曳與新增會被清掉。";if(!window.confirm(message))return;itinerary=cloneDefaults();saveItinerary();renderItinerary()});

  function loadPrep(){try{const data=JSON.parse(readStored(PREP_KEY,"[]"));return new Set(Array.isArray(data)?data:[])}catch{return new Set()}}
  let completed=loadPrep();
  function renderPrep(){prepItems.forEach(item=>{const checked=completed.has(item.dataset.id);item.classList.toggle("done",checked);const input=item.querySelector("input");if(input)input.checked=checked;const mark=item.querySelector(".checkmark");if(mark)mark.textContent=checked?"✓":""});const done=prepItems.filter(x=>completed.has(x.dataset.id)).length;const doneEl=document.getElementById("prep-done"),totalEl=document.getElementById("prep-total");if(doneEl)doneEl.textContent=done;if(totalEl)totalEl.textContent=prepItems.length}
  prepItems.forEach(item=>item.querySelector("input")?.addEventListener("change",()=>{const id=item.dataset.id;if(completed.has(id))completed.delete(id);else completed.add(id);localStorage.setItem(storageKey(PREP_KEY),JSON.stringify([...completed]));renderPrep();scheduleCloudSave()}));
  function filterCity(city){document.querySelectorAll("[data-filter]").forEach(b=>b.classList.toggle("active",b.dataset.filter===city));document.querySelectorAll(".trip-day[data-city]").forEach(card=>{card.hidden=city!=="全部"&&card.dataset.city!==city})}
  document.querySelectorAll("[data-filter]").forEach(btn=>btn.addEventListener("click",()=>filterCity(btn.dataset.filter)));document.querySelectorAll(".city-door").forEach(a=>a.addEventListener("click",()=>filterCity(a.dataset.city)));document.getElementById("go-itinerary")?.addEventListener("click",()=>document.getElementById("itinerary")?.scrollIntoView({behavior:"smooth"}));
  renderItinerary();renderPrep();filterCity("全部");
  shareButton?.addEventListener("click",async()=>{
    if(cloud.enabled){await copySharedUrl();return}
    if(!activeRoomId){
      activeRoomId=generateRoomId();
      const url=new URL(window.location.href);url.search="";url.searchParams.set("trip",activeRoomId);url.hash="";
      window.history.replaceState({},"",url);
      localStorage.setItem(storageKey(ITINERARY_KEY),JSON.stringify(itinerary));
      localStorage.setItem(storageKey(PREP_KEY),JSON.stringify([...completed]));
    }
    await connectRoom(true);
    if(cloud.enabled)await copySharedUrl();
  });
  window.addEventListener("offline",()=>{if(cloud.enabled)setSyncState("offline","目前離線","調整會先存在這台裝置，恢復網路後自動同步")});
  window.addEventListener("online",()=>{if(cloud.enabled){setSyncState("connecting","網路已恢復","正在確認最新版本");if(cloud.dirty)flushCloudSave();else setSyncState("synced","已同步",formatSyncTime())}});
  if(activeRoomId){if(shareButton)shareButton.textContent="複製共編連結";connectRoom(false)}
})();

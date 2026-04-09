import { useState, useEffect } from "react";

// =============================================
// FIREBASE CONFIG
// =============================================
const FIREBASE_URL = "https://prenotazioni-agriturismo-default-rtdb.europe-west1.firebasedatabase.app";

async function fbGet() {
  try {
    const r = await fetch(`${FIREBASE_URL}/bookings.json`);
    const data = await r.json();
    if (!data) return [];
    return Object.entries(data).map(([id, val]) => ({ ...val, id }));
  } catch(e) { return []; }
}

async function fbSet(booking) {
  const { id, ...data } = booking;
  await fetch(`${FIREBASE_URL}/bookings/${id}.json`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

async function fbDelete(id) {
  await fetch(`${FIREBASE_URL}/bookings/${id}.json`, { method: "DELETE" });
}

// =============================================
// CONSTANTS
// =============================================
const EVENT_TYPES = ["Pranzo", "Cena"];
const COLORS = {
  "Pranzo": { accent: "#D4A017", light: "#FEF9E7", badge: "#7A5C00" },
  "Cena":   { accent: "#C2732A", light: "#FFF0E0", badge: "#7A3A00" },
};
const ICONS = { "Pranzo": "☀️", "Cena": "🌙" };
const MONTHS = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const DAYS = ["Lun","Mar","Mer","Gio","Ven","Sab","Dom"];

const labelStyle = {display:"block",fontFamily:"'Lato',sans-serif",fontSize:11,fontWeight:700,color:"#9A8A70",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4,marginTop:14};
const inputStyle = {width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px solid #E0D4C0",background:"#FFFAF3",fontFamily:"'Lato',sans-serif",fontSize:15,color:"#3A2A1A",outline:"none",boxSizing:"border-box"};
const btnStyle = {padding:"12px 20px",borderRadius:12,border:"none",fontFamily:"'Lato',sans-serif",fontSize:14,fontWeight:700,cursor:"pointer",letterSpacing:"0.04em"};

// =============================================
// MODAL
// =============================================
function Modal({ booking, onClose, onSave }) {
  const [form, setForm] = useState(
    booking ? { ...booking } : { date:"", type:"Pranzo", people:"", priceLocation:"", priceCatering:"", notes:"" }
  );
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const total = (Number(form.priceLocation)||0) + (Number(form.priceCatering)||0);
  const valid = form.date && form.people && (form.priceLocation !== "" || form.priceCatering !== "");

  const handleSave = async () => {
    if (!valid) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(30,20,10,0.6)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)",overflowY:"auto",padding:"20px 0"}}>
      <div style={{background:"#FFFDF8",borderRadius:20,padding:"32px 28px",width:440,maxWidth:"95vw",boxShadow:"0 20px 60px rgba(0,0,0,0.25)",border:"1.5px solid #E8DCC8"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:21,color:"#3A2A1A",marginBottom:20}}>
          {booking ? "✏️ Modifica" : "🌿 Nuova Prenotazione"}
        </div>
        <label style={labelStyle}>Data</label>
        <input type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={inputStyle}/>
        <label style={labelStyle}>Tipologia</label>
        <div style={{display:"flex",gap:10,marginBottom:4}}>
          {EVENT_TYPES.map(t=>(
            <button key={t} onClick={()=>set("type",t)}
              style={{flex:1,padding:"12px 8px",borderRadius:12,border:"2px solid",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"'Lato',sans-serif",
                borderColor:form.type===t?COLORS[t].accent:"#E0D4C0",
                background:form.type===t?COLORS[t].light:"#FFFAF3",
                color:form.type===t?COLORS[t].badge:"#9A8A70"}}>
              {ICONS[t]} {t}
            </button>
          ))}
        </div>
        <label style={labelStyle}>Note evento (es. battesimo, compleanno…)</label>
        <input type="text" placeholder="es. Battesimo Marco, Compleanno 50 anni..." value={form.notes}
          onChange={e=>set("notes",e.target.value)} style={inputStyle}/>
        <label style={labelStyle}>Numero persone</label>
        <input type="number" min="1" placeholder="es. 40" value={form.people}
          onChange={e=>set("people",e.target.value)} style={inputStyle}/>
        <div style={{background:"#FFF7ED",borderRadius:14,padding:"16px",marginTop:14,border:"1.5px solid #EDD8B0"}}>
          <div style={{fontFamily:"'Lato',sans-serif",fontSize:11,fontWeight:700,color:"#C2732A",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>💰 Ricavi</div>
          <div style={{display:"flex",gap:12}}>
            <div style={{flex:1}}>
              <label style={{...labelStyle,marginTop:0,color:"#7A5A30"}}>🏡 Location (€)</label>
              <input type="number" min="0" placeholder="es. 2000" value={form.priceLocation}
                onChange={e=>set("priceLocation",e.target.value)} style={inputStyle}/>
            </div>
            <div style={{flex:1}}>
              <label style={{...labelStyle,marginTop:0,color:"#7A5A30"}}>🍽 Catering (€)</label>
              <input type="number" min="0" placeholder="es. 3500" value={form.priceCatering}
                onChange={e=>set("priceCatering",e.target.value)} style={inputStyle}/>
            </div>
          </div>
          {total>0 && (
            <div style={{marginTop:10,padding:"8px 14px",background:"#3A2A1A",borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:12,color:"#C8A870",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase"}}>Totale</span>
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:"#F5E6C8",fontWeight:700}}>€{total.toLocaleString("it-IT")}</span>
            </div>
          )}
        </div>
        <div style={{display:"flex",gap:10,marginTop:20}}>
          <button onClick={onClose} style={{...btnStyle,background:"#F0EAE0",color:"#7A6A50",flex:1}}>Annulla</button>
          <button onClick={handleSave} disabled={!valid||saving}
            style={{...btnStyle,background:"#3A2A1A",color:"#FFF8EE",flex:2,opacity:(!valid||saving)?0.45:1,cursor:(!valid||saving)?"not-allowed":"pointer"}}>
            {saving ? "Salvataggio…" : "Salva Prenotazione"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// CONFIRM DIALOG
// =============================================
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(30,20,10,0.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>
      <div style={{background:"#FFFDF8",borderRadius:18,padding:"28px",width:340,maxWidth:"90vw",boxShadow:"0 16px 50px rgba(0,0,0,0.2)",border:"1.5px solid #E8DCC8",textAlign:"center"}}>
        <div style={{fontSize:36,marginBottom:12}}>🗑</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:"#3A2A1A",marginBottom:8}}>Elimina prenotazione</div>
        <div style={{fontSize:14,color:"#9A8A70",marginBottom:24}}>{message}</div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onCancel} style={{...btnStyle,flex:1,background:"#F0EAE0",color:"#7A6A50",fontSize:13}}>Annulla</button>
          <button onClick={onConfirm} style={{...btnStyle,flex:1,background:"#C05030",color:"#fff",fontSize:13}}>Elimina</button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// CALENDAR VIEW
// =============================================
function CalendarView({ bookings, onDayClick, year, month }) {
  const firstDay = new Date(year, month, 1).getDay();
  const offset = (firstDay+6)%7;
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const cells = Array(offset).fill(null).concat(Array.from({length:daysInMonth},(_,i)=>i+1));
  while(cells.length%7!==0) cells.push(null);
  const bookingMap = {};
  bookings.forEach(b=>{
    const d = new Date(b.date);
    if(d.getFullYear()===year&&d.getMonth()===month){
      const day=d.getDate();
      if(!bookingMap[day]) bookingMap[day]=[];
      bookingMap[day].push(b);
    }
  });
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:3}}>
        {DAYS.map(d=><div key={d} style={{textAlign:"center",fontFamily:"'Lato',sans-serif",fontSize:11,fontWeight:700,color:"#B0A080",letterSpacing:"0.08em",padding:"6px 0"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
        {cells.map((day,i)=>{
          const bks=day?(bookingMap[day]||[]):[];
          const isToday=day&&new Date().getDate()===day&&new Date().getMonth()===month&&new Date().getFullYear()===year;
          return (
            <div key={i} onClick={()=>day&&onDayClick(day)}
              style={{minHeight:72,borderRadius:10,padding:"6px 7px",
                background:day?(bks.length?"#FFF7ED":"#FFFAF3"):"transparent",
                border:isToday?"2px solid #C2732A":(day?"1.5px solid #EDE0CC":"none"),
                cursor:day?"pointer":"default",transition:"all 0.12s",
                boxShadow:bks.length?"0 2px 8px rgba(194,115,42,0.13)":"none"}}>
              {day&&<>
                <div style={{fontFamily:"'Lato',sans-serif",fontSize:13,fontWeight:isToday?700:500,color:isToday?"#C2732A":"#5A4A30",marginBottom:3}}>{day}</div>
                {bks.map((b,j)=>(
                  <div key={j} style={{fontSize:9,fontWeight:700,padding:"2px 4px",borderRadius:5,marginBottom:2,
                    background:COLORS[b.type]?.accent||"#888",color:"#fff",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>
                    {ICONS[b.type]} {b.people}p
                  </div>
                ))}
              </>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================
// BOOKING CARD
// =============================================
function BookingCard({b, onEdit, onDelete, formatDate}) {
  const c = COLORS[b.type]||{accent:"#888",light:"#eee",badge:"#333"};
  const total = (Number(b.priceLocation)||0)+(Number(b.priceCatering)||0);
  return (
    <div style={{background:"#fff",borderRadius:16,padding:"16px 18px",border:`1.5px solid ${c.light}`,
      boxShadow:"0 2px 10px rgba(0,0,0,0.05)",display:"flex",alignItems:"flex-start",gap:14,flexWrap:"wrap"}}>
      <div style={{width:44,height:44,borderRadius:12,background:c.light,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0,marginTop:2}}>
        {ICONS[b.type]}
      </div>
      <div style={{flex:1,minWidth:160}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:"#3A2A1A"}}>{b.type}</span>
          {b.notes&&<span style={{fontSize:12,padding:"2px 10px",borderRadius:20,background:c.light,color:c.badge,fontWeight:700}}>{b.notes}</span>}
          <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,background:"#F0EAE0",color:"#7A5A30",letterSpacing:"0.04em"}}>{b.people} persone</span>
        </div>
        <div style={{fontSize:13,color:"#9A8A70",marginBottom:6}}>📅 {formatDate(b.date)}</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {b.priceLocation?<div style={{fontSize:12,padding:"3px 10px",borderRadius:8,background:"#F0EAE0",color:"#7A5A30",fontWeight:700}}>🏡 €{Number(b.priceLocation).toLocaleString("it-IT")}</div>:null}
          {b.priceCatering?<div style={{fontSize:12,padding:"3px 10px",borderRadius:8,background:"#EEF5E0",color:"#3A5A20",fontWeight:700}}>🍽 €{Number(b.priceCatering).toLocaleString("it-IT")}</div>:null}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8,flexShrink:0}}>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:"#3A2A1A"}}>€{total.toLocaleString("it-IT")}</div>
          <div style={{fontSize:10,color:"#B0A080",textTransform:"uppercase",letterSpacing:"0.08em"}}>totale</div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={e=>{e.stopPropagation();onEdit(b);}} style={{padding:"7px 12px",borderRadius:9,border:"1.5px solid #DDD0BC",background:"#FFF8EE",color:"#7A6A50",cursor:"pointer",fontSize:13,fontWeight:700}}>✏️</button>
          <button onClick={e=>{e.stopPropagation();onDelete(b.id);}} style={{padding:"7px 12px",borderRadius:9,border:"1.5px solid #FFCCC0",background:"#FFF5F3",color:"#C05030",cursor:"pointer",fontSize:13,fontWeight:700}}>🗑</button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// MAIN APP
// =============================================
export default function App() {
  const [bookings, setBookings] = useState([]);
  const [view, setView] = useState("lista");
  const [showModal, setShowModal] = useState(false);
  const [editBooking, setEditBooking] = useState(null);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [filterType, setFilterType] = useState("Tutti");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [filterRevenue, setFilterRevenue] = useState("Tutti");
  const [daySelected, setDaySelected] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [syncing, setSyncing] = useState(false);

  // Carica dati da Firebase al mount e ogni 30 secondi
  useEffect(()=>{
    const load = async () => {
      const data = await fbGet();
      setBookings(data);
      setLoaded(true);
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  },[]);

  const handleSave = async (form) => {
    setSyncing(true);
    const id = editBooking ? editBooking.id : Date.now().toString();
    const booking = { ...form, id };
    await fbSet(booking);
    // Ricarica dal server
    const data = await fbGet();
    setBookings(data);
    setSyncing(false);
    setShowModal(false);
    setEditBooking(null);
  };

  const handleDeleteConfirmed = async () => {
    if (confirmDelete !== null) {
      setSyncing(true);
      await fbDelete(confirmDelete);
      const data = await fbGet();
      setBookings(data);
      setSyncing(false);
      setConfirmDelete(null);
    }
  };

  const clearDateFilter = () => { setFilterDateFrom(""); setFilterDateTo(""); };
  const hasDateFilter = filterDateFrom || filterDateTo;
  const hasAnyFilter = filterType !== "Tutti" || hasDateFilter || filterRevenue !== "Tutti";

  const filtered = bookings
    .filter(b=>{
      if(filterType!=="Tutti" && b.type!==filterType) return false;
      const d = new Date(b.date);
      if(filterDateFrom && d < new Date(filterDateFrom)) return false;
      if(filterDateTo && d > new Date(filterDateTo)) return false;
      return true;
    })
    .sort((a,b)=>new Date(a.date)-new Date(b.date));

  const today = new Date(new Date().toDateString());
  const upcoming = filtered.filter(b=>new Date(b.date)>=today);
  const past = filtered.filter(b=>new Date(b.date)<today);

  const totalLocation = filterRevenue==="Solo catering" ? 0 : filtered.reduce((s,b)=>s+Number(b.priceLocation||0),0);
  const totalCatering = filterRevenue==="Solo location" ? 0 : filtered.reduce((s,b)=>s+Number(b.priceCatering||0),0);
  const totalPeople = filtered.reduce((s,b)=>s+Number(b.people||0),0);

  const formatDate = (d)=>new Date(d).toLocaleDateString("it-IT",{weekday:"short",day:"numeric",month:"long",year:"numeric"});
  const formatDateShort = (d)=>new Date(d+"T00:00:00").toLocaleDateString("it-IT",{day:"numeric",month:"short",year:"numeric"});
  const openEdit = (b)=>{setEditBooking(b);setShowModal(true);};

  const dayBookings = daySelected ? bookings.filter(b=>{
    const dt=new Date(b.date);
    return dt.getDate()===daySelected&&dt.getMonth()===calMonth&&dt.getFullYear()===calYear;
  }) : [];

  if (!loaded) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:"'Playfair Display',serif",color:"#9A8A70",fontSize:22,flexDirection:"column",gap:16}}>
      <div style={{fontSize:48}}>🌿</div>
      <div>Caricamento prenotazioni…</div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#FDF8F0 0%,#F5EDD8 100%)",fontFamily:"'Lato',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@300;400;700;900&display=swap" rel="stylesheet"/>

      {/* HEADER */}
      <div style={{background:"#3A2A1A",padding:"24px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:14}}>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:"#F5E6C8"}}>🌿 Agriturismo</div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:2}}>
            <div style={{fontSize:12,color:"#9A8A60",letterSpacing:"0.1em",textTransform:"uppercase"}}>Gestione Prenotazioni</div>
            {syncing && <div style={{fontSize:11,color:"#C2732A",fontWeight:700}}>⟳ Sincronizzazione…</div>}
            {!syncing && loaded && <div style={{fontSize:11,color:"#6A8A50"}}>● Online</div>}
          </div>
        </div>
        <button onClick={()=>{setEditBooking(null);setShowModal(true);}}
          style={{...btnStyle,background:"#C2732A",color:"#fff",padding:"12px 22px",fontSize:14,boxShadow:"0 4px 16px rgba(194,115,42,0.4)"}}>
          + Nuova Prenotazione
        </button>
      </div>

      {/* FILTRI */}
      <div style={{padding:"16px 24px 0",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:6}}>
          {["Tutti",...EVENT_TYPES].map(t=>(
            <button key={t} onClick={()=>setFilterType(t)}
              style={{...btnStyle,padding:"8px 14px",fontSize:12,
                background:filterType===t?"#C2732A":"#fff",
                color:filterType===t?"#fff":"#7A6A50",
                border:"1.5px solid",borderColor:filterType===t?"#C2732A":"#DDD0BC"}}>
              {t==="Tutti"?"Tutti":ICONS[t]+" "+t}
            </button>
          ))}
        </div>

        <div style={{marginLeft:8,position:"relative"}}>
          <button onClick={()=>setShowDateFilter(v=>!v)}
            style={{...btnStyle,padding:"8px 14px",fontSize:12,
              background:hasDateFilter?"#3A2A1A":"#fff",
              color:hasDateFilter?"#F5E6C8":"#7A6A50",
              border:"1.5px solid",borderColor:hasDateFilter?"#3A2A1A":"#DDD0BC",
              display:"flex",alignItems:"center",gap:6}}>
            📆 {hasDateFilter ? `${filterDateFrom?formatDateShort(filterDateFrom):"..."} → ${filterDateTo?formatDateShort(filterDateTo):"..."}` : "Periodo"}
          </button>
          {showDateFilter && (
            <div style={{position:"absolute",top:"calc(100% + 8px)",left:0,zIndex:50,background:"#FFFDF8",borderRadius:14,padding:"16px 18px",
              boxShadow:"0 8px 30px rgba(0,0,0,0.15)",border:"1.5px solid #E8DCC8",minWidth:280}}>
              <div style={{fontFamily:"'Lato',sans-serif",fontSize:11,fontWeight:700,color:"#9A8A70",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>Filtra per periodo</div>
              <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:"#9A8A70",marginBottom:3,fontWeight:700}}>DAL</div>
                  <input type="date" value={filterDateFrom} onChange={e=>setFilterDateFrom(e.target.value)} style={{...inputStyle,fontSize:13,padding:"8px 10px"}}/>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:"#9A8A70",marginBottom:3,fontWeight:700}}>AL</div>
                  <input type="date" value={filterDateTo} onChange={e=>setFilterDateTo(e.target.value)} style={{...inputStyle,fontSize:13,padding:"8px 10px"}}/>
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={clearDateFilter} style={{flex:1,padding:"7px",borderRadius:8,border:"1.5px solid #DDD0BC",background:"#F0EAE0",color:"#7A6A50",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Lato',sans-serif"}}>Cancella</button>
                <button onClick={()=>setShowDateFilter(false)} style={{flex:1,padding:"7px",borderRadius:8,border:"none",background:"#3A2A1A",color:"#F5E6C8",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"'Lato',sans-serif"}}>Applica</button>
              </div>
            </div>
          )}
        </div>

        {hasAnyFilter && (
          <button onClick={()=>{setFilterType("Tutti");clearDateFilter();setFilterRevenue("Tutti");}}
            style={{...btnStyle,padding:"8px 14px",fontSize:12,background:"#FFF0E0",color:"#C2732A",border:"1.5px solid #EDD0A0"}}>
            ✕ Azzera filtri
          </button>
        )}

        <div style={{marginLeft:"auto",display:"flex",gap:6}}>
          {["lista","calendario"].map(v=>(
            <button key={v} onClick={()=>{setView(v);setDaySelected(null);}}
              style={{...btnStyle,padding:"8px 16px",background:view===v?"#3A2A1A":"#fff",color:view===v?"#F5E6C8":"#7A6A50",
                border:"1.5px solid",borderColor:view===v?"#3A2A1A":"#DDD0BC",fontSize:12}}>
              {v==="lista"?"📋 Lista":"📅 Calendario"}
            </button>
          ))}
        </div>
      </div>

      {/* FILTRO RICAVI */}
      <div style={{padding:"8px 24px 0",display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
        <span style={{fontSize:11,fontWeight:700,color:"#9A8A70",letterSpacing:"0.08em",textTransform:"uppercase",marginRight:4}}>Ricavi:</span>
        {[
          {key:"Tutti", label:"Tutti", icon:"💰"},
          {key:"Solo location", label:"Solo location", icon:"🏡"},
          {key:"Solo catering", label:"Solo catering", icon:"🍽"},
        ].map(opt=>(
          <button key={opt.key} onClick={()=>setFilterRevenue(opt.key)}
            style={{...btnStyle,padding:"6px 13px",fontSize:11,
              background:filterRevenue===opt.key?"#3A2A1A":"#fff",
              color:filterRevenue===opt.key?"#F5E6C8":"#7A6A50",
              border:"1.5px solid",borderColor:filterRevenue===opt.key?"#3A2A1A":"#DDD0BC"}}>
            {opt.icon} {opt.label}
          </button>
        ))}
      </div>

      {/* STATS */}
      <div style={{padding:"14px 24px 0"}}>
        {hasAnyFilter && (
          <div style={{marginBottom:10,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{fontSize:12,color:"#9A8A70"}}>Riepilogo per:</span>
            {filterType!=="Tutti" && (
              <span style={{fontSize:12,fontWeight:700,padding:"3px 12px",borderRadius:20,background:COLORS[filterType]?.light,color:COLORS[filterType]?.badge,border:`1.5px solid ${COLORS[filterType]?.accent}`}}>
                {ICONS[filterType]} {filterType}
              </span>
            )}
            {filterRevenue!=="Tutti" && (
              <span style={{fontSize:12,fontWeight:700,padding:"3px 12px",borderRadius:20,background:"#F0F7E8",color:"#3A5A20",border:"1.5px solid #90C070"}}>
                💰 {filterRevenue}
              </span>
            )}
            {hasDateFilter && (
              <span style={{fontSize:12,fontWeight:700,padding:"3px 12px",borderRadius:20,background:"#F0F4FF",color:"#3A4A80",border:"1.5px solid #A0B0E0"}}>
                📆 {filterDateFrom?formatDateShort(filterDateFrom):"inizio"} → {filterDateTo?formatDateShort(filterDateTo):"oggi"}
              </span>
            )}
          </div>
        )}
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          {[
            {label:"Prenotazioni",value:filtered.length,icon:"📋"},
            {label:"Prossimi eventi",value:upcoming.length,icon:"📅"},
            {label:"Persone totali",value:totalPeople,icon:"👥"},
            {label:"Ricavi location",value:`€${totalLocation.toLocaleString("it-IT")}`,icon:"🏡"},
            {label:"Ricavi catering",value:`€${totalCatering.toLocaleString("it-IT")}`,icon:"🍽"},
            {label:"Totale ricavi",value:`€${(totalLocation+totalCatering).toLocaleString("it-IT")}`,icon:"💰",highlight:true},
          ].map(s=>(
            <div key={s.label} style={{flex:"1 1 110px",background:s.highlight?"#3A2A1A":"#fff",borderRadius:14,padding:"14px 16px",
              boxShadow:"0 2px 10px rgba(0,0,0,0.06)",border:s.highlight?"none":"1px solid #EDE0CC"}}>
              <div style={{fontSize:18}}>{s.icon}</div>
              <div style={{fontSize:20,fontWeight:900,color:s.highlight?"#F5E6C8":"#3A2A1A",fontFamily:"'Playfair Display',serif",lineHeight:1.1,marginTop:3}}>{s.value}</div>
              <div style={{fontSize:10,color:s.highlight?"#9A8A60":"#9A8A70",marginTop:3,textTransform:"uppercase",letterSpacing:"0.07em"}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{padding:"16px 24px 40px"}}>
        {view==="calendario" && (
          <div style={{background:"#fff",borderRadius:20,padding:22,boxShadow:"0 2px 16px rgba(0,0,0,0.07)",border:"1px solid #EDE0CC"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <button onClick={()=>{if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1);}}
                style={{...btnStyle,padding:"8px 16px",background:"#F0EAE0",color:"#5A4A30",fontSize:18}}>‹</button>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:"#3A2A1A"}}>{MONTHS[calMonth]} {calYear}</div>
              <button onClick={()=>{if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1);}}
                style={{...btnStyle,padding:"8px 16px",background:"#F0EAE0",color:"#5A4A30",fontSize:18}}>›</button>
            </div>
            <CalendarView bookings={bookings} onDayClick={setDaySelected} year={calYear} month={calMonth}/>
            {daySelected && (
              <div style={{marginTop:16,padding:16,background:"#FFF7ED",borderRadius:14,border:"1.5px solid #EDD0A0"}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:"#3A2A1A",marginBottom:10}}>
                  {daySelected} {MONTHS[calMonth]} {calYear}
                </div>
                {dayBookings.length===0
                  ? <div style={{color:"#9A8A70",fontSize:14}}>Nessuna prenotazione in questo giorno</div>
                  : dayBookings.map(b=><BookingCard key={b.id} b={b} onEdit={openEdit} onDelete={id=>setConfirmDelete(id)} formatDate={formatDate}/>)
                }
              </div>
            )}
          </div>
        )}

        {view==="lista" && (
          <div>
            {upcoming.length>0 && (
              <div style={{marginBottom:22}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,color:"#3A2A1A",marginBottom:10}}>📅 Prossimi eventi ({upcoming.length})</div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {upcoming.map(b=><BookingCard key={b.id} b={b} onEdit={openEdit} onDelete={id=>setConfirmDelete(id)} formatDate={formatDate}/>)}
                </div>
              </div>
            )}
            {past.length>0 && (
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,color:"#9A8A70",marginBottom:10}}>🕰 Passati ({past.length})</div>
                <div style={{display:"flex",flexDirection:"column",gap:10,opacity:0.7}}>
                  {[...past].reverse().map(b=><BookingCard key={b.id} b={b} onEdit={openEdit} onDelete={id=>setConfirmDelete(id)} formatDate={formatDate}/>)}
                </div>
              </div>
            )}
            {filtered.length===0 && (
              <div style={{textAlign:"center",padding:"60px 20px",color:"#B0A080"}}>
                <div style={{fontSize:48,marginBottom:12}}>🌾</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,marginBottom:8}}>Nessuna prenotazione trovata</div>
                <div style={{fontSize:14}}>Premi "+ Nuova Prenotazione" per iniziare</div>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && <Modal booking={editBooking} onClose={()=>{setShowModal(false);setEditBooking(null);}} onSave={handleSave}/>}
      {confirmDelete!==null && <ConfirmDialog message="Sei sicuro di voler eliminare questa prenotazione?" onConfirm={handleDeleteConfirmed} onCancel={()=>setConfirmDelete(null)}/>}
    </div>
  );
}

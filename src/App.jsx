import { useState, useEffect, useRef } from "react";

// Carica SheetJS dinamicamente
async function loadSheetJS() {
  if (window.XLSX) return window.XLSX;
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload = () => resolve(window.XLSX);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function parseExcelFile(file) {
  const XLSX = await loadSheetJS();
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

  // Struttura colonne:
  // 0=data, 1=tipo/nome, 2=nome cliente, 3=acconto, 4=quota affitto, 5=quota catering, 7=ricavo totale
  const bookings = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawDate = row[0];
    // Salta righe senza data valida (Date object da SheetJS)
    if (!rawDate || typeof rawDate !== "object" || !(rawDate instanceof Date)) continue;

    // Formattiamo la data come YYYY-MM-DD evitando problemi di timezone
    const y = rawDate.getFullYear();
    const m = String(rawDate.getMonth()+1).padStart(2,"0");
    const d = String(rawDate.getDate()).padStart(2,"0");
    const dateStr = `${y}-${m}-${d}`;

    const tipoRaw = row[1] ? String(row[1]).trim() : "";
    const nomeRaw = row[2] ? String(row[2]).trim() : "";
    const notes = [tipoRaw, nomeRaw].filter(Boolean).join(" - ") || "Evento";
    const priceLocation = row[4] ? String(Math.round(Number(row[4]))) : "";
    const priceCatering = row[5] ? String(Math.round(Number(row[5]))) : "";
    const deposit = row[3] ? String(Math.round(Number(row[3]))) : "";

    // Tipo: se c'è solo affitto → Solo location, se solo catering → Solo catering
    let type = "Pranzo";
    const tipoLow = tipoRaw.toLowerCase();
    if (tipoLow.includes("cena")) type = "Cena";
    else if (priceLocation && !priceCatering) type = "Solo location";
    else if (!priceLocation && priceCatering) type = "Solo catering";

    bookings.push({
      id: `xl_${dateStr}_${i}`,
      date: dateStr,
      type,
      status: "confermato",
      notes,
      people: "",
      priceLocation,
      priceCatering,
      deposit,
    });
  }
  return bookings;
}

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
  await fetch(`${FIREBASE_URL}/bookings/${id}.json`, { method: "PUT", body: JSON.stringify(data) });
}
async function fbDelete(id) {
  await fetch(`${FIREBASE_URL}/bookings/${id}.json`, { method: "DELETE" });
}

const INITIAL_BOOKINGS = [
  {id:"p1",date:"2026-03-06",type:"Pranzo",status:"confermato",notes:"18esimo Figlia Moreno",people:"",priceLocation:"600",priceCatering:"120",deposit:"600"},
  {id:"p2",date:"2026-03-07",type:"Pranzo",status:"confermato",notes:"Patrizia Casolari",people:"",priceLocation:"500",priceCatering:"1500",deposit:"1500"},
  {id:"p3",date:"2026-03-13",type:"Pranzo",status:"confermato",notes:"Spinelli",people:"",priceLocation:"600",priceCatering:"800",deposit:"500"},
  {id:"p4",date:"2026-03-14",type:"Pranzo",status:"confermato",notes:"Alessandro Ceramella",people:"",priceLocation:"600",priceCatering:"",deposit:"500"},
  {id:"p5",date:"2026-03-14",type:"Cena",status:"confermato",notes:"18esimo Valli",people:"",priceLocation:"800",priceCatering:"300",deposit:""},
  {id:"p6",date:"2026-03-17",type:"Pranzo",status:"confermato",notes:"Slow food",people:"",priceLocation:"600",priceCatering:"",deposit:""},
  {id:"p7",date:"2026-03-19",type:"Pranzo",status:"confermato",notes:"Falconeri",people:"",priceLocation:"300",priceCatering:"",deposit:""},
  {id:"p8",date:"2026-03-21",type:"Pranzo",status:"confermato",notes:"Compleanno Luigi e Sonia",people:"",priceLocation:"500",priceCatering:"1750",deposit:"1000"},
  {id:"p9",date:"2026-03-22",type:"Pranzo",status:"confermato",notes:"Gender reveal Letizia Seminara",people:"",priceLocation:"700",priceCatering:"",deposit:"500"},
  {id:"p10",date:"2026-03-27",type:"Pranzo",status:"confermato",notes:"18esimo figlia Anna di Martino",people:"",priceLocation:"500",priceCatering:"1000",deposit:"500"},
  {id:"p11",date:"2026-03-28",type:"Pranzo",status:"confermato",notes:"Cavadini",people:"",priceLocation:"860",priceCatering:"400",deposit:"500"},
  {id:"p12",date:"2026-04-11",type:"Pranzo",status:"confermato",notes:"18esimo Gallazzi",people:"",priceLocation:"800",priceCatering:"",deposit:""},
  {id:"p13",date:"2026-04-12",type:"Pranzo",status:"confermato",notes:"Battesimo Luana",people:"",priceLocation:"500",priceCatering:"3000",deposit:"1000"},
  {id:"p14",date:"2026-04-16",type:"Pranzo",status:"confermato",notes:"Laurea con menu Motalbano",people:"",priceLocation:"500",priceCatering:"900",deposit:"500"},
  {id:"p15",date:"2026-04-18",type:"Pranzo",status:"confermato",notes:"Matrimonio Romina Pozzi",people:"",priceLocation:"500",priceCatering:"5370",deposit:"1500"},
  {id:"p16",date:"2026-04-19",type:"Pranzo",status:"confermato",notes:"Pelli",people:"",priceLocation:"700",priceCatering:"200",deposit:"500"},
  {id:"p17",date:"2026-05-02",type:"Pranzo",status:"confermato",notes:"18esimo Mirella",people:"",priceLocation:"800",priceCatering:"",deposit:"400"},
  {id:"p18",date:"2026-05-03",type:"Pranzo",status:"confermato",notes:"Battesimo Laura Molteni",people:"",priceLocation:"500",priceCatering:"2000",deposit:"500"},
  {id:"p19",date:"2026-05-09",type:"Pranzo",status:"confermato",notes:"18esimo dodo72",people:"",priceLocation:"700",priceCatering:"",deposit:"500"},
  {id:"p20",date:"2026-05-10",type:"Pranzo",status:"confermato",notes:"Comunione Cilente (baita brunate)",people:"",priceLocation:"600",priceCatering:"1400",deposit:"500"},
  {id:"p21",date:"2026-05-16",type:"Pranzo",status:"confermato",notes:"Rezzonico",people:"",priceLocation:"500",priceCatering:"3200",deposit:"500"},
  {id:"p22",date:"2026-05-17",type:"Pranzo",status:"confermato",notes:"Alberto",people:"",priceLocation:"600",priceCatering:"850",deposit:"1000"},
  {id:"p23",date:"2026-05-23",type:"Pranzo",status:"confermato",notes:"Figlia Alina",people:"",priceLocation:"500",priceCatering:"",deposit:""},
  {id:"p24",date:"2026-05-31",type:"Pranzo",status:"confermato",notes:"Miriam",people:"",priceLocation:"700",priceCatering:"200",deposit:"500"},
  {id:"p25",date:"2026-06-01",type:"Pranzo",status:"confermato",notes:"18esimo Matilde Zanini",people:"",priceLocation:"600",priceCatering:"1300",deposit:"500"},
  {id:"p26",date:"2026-06-06",type:"Pranzo",status:"sospeso",notes:"Greg",people:"",priceLocation:"500",priceCatering:"4800",deposit:"500"},
  {id:"p27",date:"2026-06-07",type:"Pranzo",status:"sospeso",notes:"Battesimo Beatrice",people:"",priceLocation:"600",priceCatering:"1560",deposit:"1000"},
  {id:"p28",date:"2026-06-13",type:"Pranzo",status:"sospeso",notes:"Matrimonio sig. Matteo",people:"",priceLocation:"1000",priceCatering:"",deposit:"500"},
  {id:"p29",date:"2026-06-21",type:"Pranzo",status:"confermato",notes:"Battesimo Giorgia",people:"",priceLocation:"500",priceCatering:"2800",deposit:"1000"},
  {id:"p30",date:"2026-06-27",type:"Pranzo",status:"confermato",notes:"Matrimonio Gianluca",people:"",priceLocation:"500",priceCatering:"4500",deposit:"500"},
  {id:"p31",date:"2026-07-04",type:"Pranzo",status:"confermato",notes:"Matrimonio Eleonora Doria",people:"",priceLocation:"500",priceCatering:"3600",deposit:"500"},
  {id:"p32",date:"2026-07-05",type:"Pranzo",status:"confermato",notes:"Compleanno Stefania",people:"",priceLocation:"500",priceCatering:"2000",deposit:"500"},
  {id:"p33",date:"2026-07-09",type:"Pranzo",status:"confermato",notes:"Matrimonio Roberta",people:"",priceLocation:"500",priceCatering:"1500",deposit:"500"},
  {id:"p34",date:"2026-09-04",type:"Pranzo",status:"confermato",notes:"Pre-matrimonio Marika",people:"",priceLocation:"600",priceCatering:"1000",deposit:"500"},
  {id:"p35",date:"2026-09-18",type:"Pranzo",status:"confermato",notes:"Festa ospedale Erika Cella",people:"",priceLocation:"2000",priceCatering:"",deposit:""},
  {id:"p36",date:"2026-09-19",type:"Pranzo",status:"confermato",notes:"Matrimonio Sara Cantaluppi",people:"",priceLocation:"500",priceCatering:"3325",deposit:"500"},
  {id:"p37",date:"2026-09-26",type:"Pranzo",status:"confermato",notes:"Matrimonio Marina Lo Schiavo",people:"",priceLocation:"500",priceCatering:"1200",deposit:"500"},
  {id:"p38",date:"2026-10-17",type:"Pranzo",status:"confermato",notes:"Comunione Negretti",people:"",priceLocation:"600",priceCatering:"1000",deposit:"500"},
];

const EVENT_TYPES = ["Pranzo", "Cena", "Solo location", "Solo catering"];
const COLORS = {
  "Pranzo":        { accent: "#D4A017", light: "#FEF9E7", badge: "#7A5C00" },
  "Cena":          { accent: "#C2732A", light: "#FFF0E0", badge: "#7A3A00" },
  "Solo location": { accent: "#5A8A3A", light: "#EEF8E0", badge: "#2A5A10" },
  "Solo catering": { accent: "#3A6A9A", light: "#E0F0FF", badge: "#1A3A6A" },
};
const ICONS = { "Pranzo": "☀️", "Cena": "🌙", "Solo location": "🏡", "Solo catering": "🍽" };
const MONTHS = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const DAYS = ["Lun","Mar","Mer","Gio","Ven","Sab","Dom"];

const labelStyle = {display:"block",fontFamily:"'Lato',sans-serif",fontSize:11,fontWeight:700,color:"#9A8A70",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:4,marginTop:14};
const inputStyle = {width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px solid #E0D4C0",background:"#FFFAF3",fontFamily:"'Lato',sans-serif",fontSize:15,color:"#3A2A1A",outline:"none",boxSizing:"border-box"};
const btnStyle = {padding:"12px 20px",borderRadius:12,border:"none",fontFamily:"'Lato',sans-serif",fontSize:14,fontWeight:700,cursor:"pointer",letterSpacing:"0.04em"};

function Modal({ booking, onClose, onSave }) {
  const [form, setForm] = useState(
    booking ? { ...booking } : { date:"", type:"Pranzo", status:"confermato", people:"", priceLocation:"", priceCatering:"", deposit:"", notes:"" }
  );
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const total = (Number(form.priceLocation)||0) + (Number(form.priceCatering)||0);
  const valid = form.date && (form.priceLocation !== "" || form.priceCatering !== "");

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
        <div style={{display:"flex",gap:8,marginBottom:4,flexWrap:"wrap"}}>
          {EVENT_TYPES.map(t=>(
            <button key={t} onClick={()=>set("type",t)}
              style={{flex:"1 1 80px",padding:"10px 6px",borderRadius:12,border:"2px solid",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Lato',sans-serif",
                borderColor:form.type===t?COLORS[t].accent:"#E0D4C0",
                background:form.type===t?COLORS[t].light:"#FFFAF3",
                color:form.type===t?COLORS[t].badge:"#9A8A70"}}>
              {ICONS[t]} {t}
            </button>
          ))}
        </div>
        <label style={labelStyle}>Stato evento</label>
        <div style={{display:"flex",gap:10,marginBottom:4}}>
          {[{key:"confermato",label:"Confermato",icon:"✅"},{key:"sospeso",label:"In sospeso",icon:"⏳"}].map(s=>(
            <button key={s.key} onClick={()=>set("status",s.key)}
              style={{flex:1,padding:"11px 8px",borderRadius:12,border:"2px solid",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'Lato',sans-serif",
                borderColor:form.status===s.key?(s.key==="confermato"?"#4A9A30":"#C2732A"):"#E0D4C0",
                background:form.status===s.key?(s.key==="confermato"?"#E8F8D8":"#FFF0E0"):"#FFFAF3",
                color:form.status===s.key?(s.key==="confermato"?"#2A6A10":"#7A3A00"):"#9A8A70"}}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>
        <label style={labelStyle}>Note evento</label>
        <input type="text" placeholder="es. Battesimo Marco, Compleanno 50 anni..." value={form.notes} onChange={e=>set("notes",e.target.value)} style={inputStyle}/>
        <label style={labelStyle}>Numero persone</label>
        <input type="number" min="1" placeholder="es. 40" value={form.people} onChange={e=>set("people",e.target.value)} style={inputStyle}/>
        <div style={{background:"#FFF7ED",borderRadius:14,padding:"16px",marginTop:14,border:"1.5px solid #EDD8B0"}}>
          <div style={{fontFamily:"'Lato',sans-serif",fontSize:11,fontWeight:700,color:"#C2732A",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>💰 Ricavi</div>
          <div style={{display:"flex",gap:12}}>
            <div style={{flex:1}}>
              <label style={{...labelStyle,marginTop:0,color:"#7A5A30"}}>🏡 Location (€)</label>
              <input type="number" min="0" placeholder="es. 2000" value={form.priceLocation} onChange={e=>set("priceLocation",e.target.value)} style={inputStyle}/>
            </div>
            <div style={{flex:1}}>
              <label style={{...labelStyle,marginTop:0,color:"#7A5A30"}}>🍽 Catering (€)</label>
              <input type="number" min="0" placeholder="es. 3500" value={form.priceCatering} onChange={e=>set("priceCatering",e.target.value)} style={inputStyle}/>
            </div>
          </div>
          <div style={{marginTop:12}}>
            <label style={{...labelStyle,marginTop:0,color:"#2A6A10"}}>✅ Già incassato (€)</label>
            <input type="number" min="0" placeholder="es. 500" value={form.deposit} onChange={e=>set("deposit",e.target.value)} style={inputStyle}/>
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
          const dow = day ? new Date(year, month, day).getDay() : null;
          const isWeekend = dow===6||dow===0;
          return (
            <div key={i} onClick={()=>day&&onDayClick(day)}
              style={{minHeight:72,borderRadius:10,padding:"6px 7px",
                background:day?(bks.length?"#FFF7ED":(isWeekend?"#F0F7FF":"#FFFAF3")):"transparent",
                border:isToday?"2px solid #C2732A":(day?"1.5px solid #EDE0CC":"none"),
                cursor:day?"pointer":"default",transition:"all 0.12s",
                boxShadow:bks.length?"0 2px 8px rgba(194,115,42,0.13)":"none"}}>
              {day&&<>
                <div style={{fontFamily:"'Lato',sans-serif",fontSize:13,fontWeight:isToday?700:500,color:isToday?"#C2732A":"#5A4A30",marginBottom:3}}>{day}</div>
                {bks.map((b,j)=>(
                  <div key={j} style={{fontSize:9,fontWeight:700,padding:"2px 4px",borderRadius:5,marginBottom:2,
                    background:COLORS[b.type]?.accent||"#888",color:"#fff",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>
                    {ICONS[b.type]} {b.notes||b.type}
                  </div>
                ))}
                {isWeekend&&bks.length===0&&<div style={{fontSize:9,color:"#6A90C0",fontWeight:700,marginTop:2}}>{dow===6?"Sab libero":"Dom libera"}</div>}
              </>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BookingCard({b, onEdit, onDelete, formatDate}) {
  const c = COLORS[b.type]||{accent:"#888",light:"#eee",badge:"#333"};
  const total = (Number(b.priceLocation)||0)+(Number(b.priceCatering)||0);
  const deposit = Number(b.deposit)||0;
  const daIncassare = total - deposit;
  return (
    <div style={{background:"#fff",borderRadius:16,padding:"16px 18px",border:`1.5px solid ${c.light}`,boxShadow:"0 2px 10px rgba(0,0,0,0.05)",display:"flex",alignItems:"flex-start",gap:14,flexWrap:"wrap"}}>
      <div style={{width:44,height:44,borderRadius:12,background:c.light,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0,marginTop:2}}>
        {ICONS[b.type]}
      </div>
      <div style={{flex:1,minWidth:160}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:"#3A2A1A"}}>{b.type}</span>
          {b.notes&&<span style={{fontSize:12,padding:"2px 10px",borderRadius:20,background:c.light,color:c.badge,fontWeight:700}}>{b.notes}</span>}
          {b.people&&<span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,background:"#F0EAE0",color:"#7A5A30"}}>{b.people} persone</span>}
          {b.status==="sospeso"&&<span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,background:"#FFF0E0",color:"#C2732A",border:"1px solid #F0C090"}}>⏳ In sospeso</span>}
        </div>
        <div style={{fontSize:13,color:"#9A8A70",marginBottom:6}}>📅 {formatDate(b.date)}</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {b.priceLocation?<div style={{fontSize:12,padding:"3px 10px",borderRadius:8,background:"#F0EAE0",color:"#7A5A30",fontWeight:700}}>🏡 €{Number(b.priceLocation).toLocaleString("it-IT")}</div>:null}
          {b.priceCatering?<div style={{fontSize:12,padding:"3px 10px",borderRadius:8,background:"#EEF5E0",color:"#3A5A20",fontWeight:700}}>🍽 €{Number(b.priceCatering).toLocaleString("it-IT")}</div>:null}
          {deposit>0?<div style={{fontSize:12,padding:"3px 10px",borderRadius:8,background:"#E0F8E8",color:"#1A6A30",fontWeight:700}}>✅ €{deposit.toLocaleString("it-IT")}</div>:null}
          {daIncassare>0&&deposit>0?<div style={{fontSize:12,padding:"3px 10px",borderRadius:8,background:"#FFF0E0",color:"#C2732A",fontWeight:700}}>⏳ €{daIncassare.toLocaleString("it-IT")}</div>:null}
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
  const [filterPeriod, setFilterPeriod] = useState("settimana"); // settimana | mese | tutti
  const [includePast, setIncludePast] = useState(false);
  const [daySelected, setDaySelected] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showImportExcel, setShowImportExcel] = useState(false);
  const [importExcelPreview, setImportExcelPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(()=>{
    const load = async () => {
      const data = await fbGet();
      if (data.length === 0) {
        for (const b of INITIAL_BOOKINGS) await fbSet(b);
        const fresh = await fbGet();
        setBookings(fresh);
      } else {
        setBookings(data);
      }
      setLoaded(true);
    };
    load();
    const interval = setInterval(async () => { const data = await fbGet(); setBookings(data); }, 30000);
    return () => clearInterval(interval);
  },[]);

  const handleSave = async (form) => {
    setSyncing(true);
    const id = editBooking ? editBooking.id : Date.now().toString();
    const booking = { ...form, id };
    await fbSet(booking);
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

  const handleImport = async () => {
    setSyncing(true);
    setShowImport(false);
    const payload = {};
    for (const b of INITIAL_BOOKINGS) {
      const { id, ...data } = b;
      payload[id] = data;
    }
    await fetch(`${FIREBASE_URL}/bookings.json`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" }
    });
    const data = await fbGet();
    setBookings(data);
    setSyncing(false);
  };
  const handleExcelFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const parsed = await parseExcelFile(file);
      setImportExcelPreview(parsed);
      setShowImportExcel(true);
    } catch(err) {
      alert("Errore nel leggere il file Excel: " + err.message);
    }
    e.target.value = "";
  };

  const handleImportExcel = async () => {
    if (!importExcelPreview) return;
    setSyncing(true);
    setShowImportExcel(false);
    try {
      // Carica tutti gli eventi in una singola chiamata PATCH
      const payload = {};
      for (const b of importExcelPreview) {
        const { id, ...data } = b;
        payload[id] = data;
      }
      await fetch(`${FIREBASE_URL}/bookings.json`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" }
      });
      const data = await fbGet();
      setBookings(data);
    } catch(err) {
      alert("Errore durante l'import: " + err.message);
    }
    setSyncing(false);
    setImportExcelPreview(null);
  };

  const clearDateFilter = () => { setFilterDateFrom(""); setFilterDateTo(""); };
  const hasDateFilter = filterDateFrom || filterDateTo;
  const hasAnyFilter = filterType !== "Tutti" || hasDateFilter || filterRevenue !== "Tutti";

  const today = new Date(new Date().toDateString());

  // Calcola range settimana corrente (lun-dom)
  const getWeekRange = () => {
    const d = new Date(today);
    const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
    const mon = new Date(d); mon.setDate(d.getDate() - dow);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return { from: mon, to: sun };
  };
  const getMonthRange = () => {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { from, to };
  };

  const allFiltered = bookings
    .filter(b=>{
      if(filterType!=="Tutti" && b.type!==filterType) return false;
      const d = new Date(b.date);
      if(filterDateFrom && d < new Date(filterDateFrom)) return false;
      if(filterDateTo && d > new Date(filterDateTo)) return false;
      return true;
    })
    .sort((a,b)=>new Date(a.date)-new Date(b.date));

  const upcoming = allFiltered.filter(b=>new Date(b.date)>=today);
  const past = allFiltered.filter(b=>new Date(b.date)<today);

  // Filtra per periodo solo gli attivi
  const filterByPeriod = (list) => {
    if (filterPeriod === "settimana") {
      const { from, to } = getWeekRange();
      return list.filter(b=>{ const d=new Date(b.date); return d>=from && d<=to; });
    }
    if (filterPeriod === "mese") {
      const { from, to } = getMonthRange();
      return list.filter(b=>{ const d=new Date(b.date); return d>=from && d<=to; });
    }
    return list;
  };

  const upcomingFiltered = filterByPeriod(upcoming);
  const pastFiltered = filterByPeriod(past);

  // Per le statistiche: base = attivi filtrati per periodo, + passati se includePast
  const statsBase = includePast ? [...pastFiltered, ...upcomingFiltered] : upcomingFiltered;
  const filtered = statsBase; // alias per compatibilità

  const totalLocation = filterRevenue==="Solo catering" ? 0 : statsBase.reduce((s,b)=>s+Number(b.priceLocation||0),0);
  const totalCatering = filterRevenue==="Solo location" ? 0 : statsBase.reduce((s,b)=>s+Number(b.priceCatering||0),0);
  const totalPeople = statsBase.reduce((s,b)=>s+Number(b.people||0),0);
  const totalDeposit = statsBase.reduce((s,b)=>s+Number(b.deposit||0),0);
  const totalDaIncassare = (totalLocation+totalCatering) - totalDeposit;

  const bookedDates = new Set(bookings.map(b=>b.date));
  let freeSaturdays = 0, freeSundays = 0;
  for (let m=0; m<12; m++) {
    const days = new Date(2026, m+1, 0).getDate();
    for (let d=1; d<=days; d++) {
      const dow = new Date(2026, m, d).getDay();
      const dateStr = `2026-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      if (!bookedDates.has(dateStr)) {
        if (dow===6) freeSaturdays++;
        if (dow===0) freeSundays++;
      }
    }
  }

  const formatDate = (d)=>new Date(d).toLocaleDateString("it-IT",{weekday:"short",day:"numeric",month:"long",year:"numeric"});
  const formatDateShort = (d)=>new Date(d+"T00:00:00").toLocaleDateString("it-IT",{day:"numeric",month:"short",year:"numeric"});
  const openEdit = (b)=>{setEditBooking(b);setShowModal(true);};
  const dayBookings = daySelected ? bookings.filter(b=>{ const dt=new Date(b.date); return dt.getDate()===daySelected&&dt.getMonth()===calMonth&&dt.getFullYear()===calYear; }) : [];

  if (!loaded) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:"'Playfair Display',serif",color:"#9A8A70",fontSize:22,flexDirection:"column",gap:16}}>
      <div style={{fontSize:48}}>🌿</div>
      <div>Caricamento prenotazioni…</div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#FDF8F0 0%,#F5EDD8 100%)",fontFamily:"'Lato',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@300;400;700;900&display=swap" rel="stylesheet"/>

      <div style={{background:"#3A2A1A",padding:"24px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:14}}>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:"#F5E6C8"}}>🌿 Agriturismo</div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:2}}>
            <div style={{fontSize:12,color:"#9A8A60",letterSpacing:"0.1em",textTransform:"uppercase"}}>Gestione Prenotazioni</div>
            {syncing && <div style={{fontSize:11,color:"#C2732A",fontWeight:700}}>⟳ Sincronizzazione…</div>}
            {!syncing && loaded && <div style={{fontSize:11,color:"#6A8A50"}}>● Online</div>}
          </div>
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{display:"none"}} onChange={handleExcelFile}/>
          <button onClick={()=>fileInputRef.current.click()}
            style={{...btnStyle,background:"#1D6A3A",color:"#fff",padding:"12px 18px",fontSize:13}}>
            📊 Importa da Excel
          </button>

          <button onClick={()=>{setEditBooking(null);setShowModal(true);}}
            style={{...btnStyle,background:"#C2732A",color:"#fff",padding:"12px 22px",fontSize:14,boxShadow:"0 4px 16px rgba(194,115,42,0.4)"}}>
            + Nuova Prenotazione
          </button>
        </div>
      </div>

      <div style={{padding:"16px 24px 0",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {["Tutti","Pranzo","Cena"].map(t=>(
            <button key={t} onClick={()=>setFilterType(t)}
              style={{...btnStyle,padding:"8px 14px",fontSize:12,background:filterType===t?"#C2732A":"#fff",color:filterType===t?"#fff":"#7A6A50",border:"1.5px solid",borderColor:filterType===t?"#C2732A":"#DDD0BC"}}>
              {t==="Tutti"?"Tutti":ICONS[t]+" "+t}
            </button>
          ))}
        </div>
        <div style={{marginLeft:8,position:"relative"}}>
          <button onClick={()=>setShowDateFilter(v=>!v)}
            style={{...btnStyle,padding:"8px 14px",fontSize:12,background:hasDateFilter?"#3A2A1A":"#fff",color:hasDateFilter?"#F5E6C8":"#7A6A50",border:"1.5px solid",borderColor:hasDateFilter?"#3A2A1A":"#DDD0BC",display:"flex",alignItems:"center",gap:6}}>
            📆 {hasDateFilter ? `${filterDateFrom?formatDateShort(filterDateFrom):"..."} → ${filterDateTo?formatDateShort(filterDateTo):"..."}` : "Periodo"}
          </button>
          {showDateFilter && (
            <div style={{position:"absolute",top:"calc(100% + 8px)",left:0,zIndex:50,background:"#FFFDF8",borderRadius:14,padding:"16px 18px",boxShadow:"0 8px 30px rgba(0,0,0,0.15)",border:"1.5px solid #E8DCC8",minWidth:280}}>
              <div style={{display:"flex",gap:10,marginBottom:10}}>
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
              style={{...btnStyle,padding:"8px 16px",background:view===v?"#3A2A1A":"#fff",color:view===v?"#F5E6C8":"#7A6A50",border:"1.5px solid",borderColor:view===v?"#3A2A1A":"#DDD0BC",fontSize:12}}>
              {v==="lista"?"📋 Lista":"📅 Calendario"}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:"8px 24px 0",display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
        <span style={{fontSize:11,fontWeight:700,color:"#9A8A70",letterSpacing:"0.08em",textTransform:"uppercase",marginRight:4}}>Ricavi:</span>
        {[{key:"Tutti",label:"Tutti",icon:"💰"},{key:"Solo location",label:"Solo location",icon:"🏡"},{key:"Solo catering",label:"Solo catering",icon:"🍽"}].map(opt=>(
          <button key={opt.key} onClick={()=>setFilterRevenue(opt.key)}
            style={{...btnStyle,padding:"6px 13px",fontSize:11,background:filterRevenue===opt.key?"#3A2A1A":"#fff",color:filterRevenue===opt.key?"#F5E6C8":"#7A6A50",border:"1.5px solid",borderColor:filterRevenue===opt.key?"#3A2A1A":"#DDD0BC"}}>
            {opt.icon} {opt.label}
          </button>
        ))}
      </div>

      <div style={{padding:"14px 24px 0"}}>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          {[
            {label:"Prenotazioni",value:filtered.length,icon:"📋"},
            {label:"Prossimi eventi",value:upcoming.length,icon:"📅"},
            {label:"Persone totali",value:totalPeople||"—",icon:"👥"},
            ...(filterRevenue!=="Solo catering"?[{label:"Ricavi location",value:`€${totalLocation.toLocaleString("it-IT")}`,icon:"🏡"}]:[]),
            ...(filterRevenue!=="Solo location"?[{label:"Ricavi catering",value:`€${totalCatering.toLocaleString("it-IT")}`,icon:"🍽"}]:[]),
            {label:"Totale ricavi",value:`€${(totalLocation+totalCatering).toLocaleString("it-IT")}`,icon:"💰",highlight:true},
            {label:"Già incassato",value:`€${totalDeposit.toLocaleString("it-IT")}`,icon:"✅",green:true},
            {label:"Da incassare",value:`€${totalDaIncassare.toLocaleString("it-IT")}`,icon:"⏳",orange:true},
            {label:"Sabati liberi",value:freeSaturdays,icon:"🟡",blue:true},
            {label:"Domeniche libere",value:freeSundays,icon:"🔵",blue:true},
          ].map(s=>(
            <div key={s.label} style={{flex:"1 1 110px",background:s.highlight?"#3A2A1A":s.green?"#D8F0C8":s.orange?"#FFE8D0":s.blue?"#E8F0FF":"#fff",borderRadius:14,padding:"14px 16px",boxShadow:"0 2px 10px rgba(0,0,0,0.06)",border:s.highlight?"none":s.green?"1px solid #90C870":s.orange?"1px solid #F0C090":s.blue?"1px solid #A0B8F0":"1px solid #EDE0CC"}}>
              <div style={{fontSize:18}}>{s.icon}</div>
              <div style={{fontSize:20,fontWeight:900,color:s.highlight?"#F5E6C8":s.green?"#1A6A30":s.orange?"#7A3A00":s.blue?"#2A3A80":"#3A2A1A",fontFamily:"'Playfair Display',serif",lineHeight:1.1,marginTop:3}}>{s.value}</div>
              <div style={{fontSize:10,color:s.highlight?"#9A8A60":s.green?"#2A8A40":s.orange?"#9A5020":s.blue?"#4A5A90":"#9A8A70",marginTop:3,textTransform:"uppercase",letterSpacing:"0.07em"}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{padding:"16px 24px 40px"}}>
        {view==="calendario" && (
          <div style={{background:"#fff",borderRadius:20,padding:22,boxShadow:"0 2px 16px rgba(0,0,0,0.07)",border:"1px solid #EDE0CC"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <button onClick={()=>{if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1);}} style={{...btnStyle,padding:"8px 16px",background:"#F0EAE0",color:"#5A4A30",fontSize:18}}>‹</button>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:"#3A2A1A"}}>{MONTHS[calMonth]} {calYear}</div>
              <button onClick={()=>{if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1);}} style={{...btnStyle,padding:"8px 16px",background:"#F0EAE0",color:"#5A4A30",fontSize:18}}>›</button>
            </div>
            <CalendarView bookings={bookings} onDayClick={setDaySelected} year={calYear} month={calMonth}/>
            {daySelected && (
              <div style={{marginTop:16,padding:16,background:"#FFF7ED",borderRadius:14,border:"1.5px solid #EDD0A0"}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:"#3A2A1A",marginBottom:10}}>{daySelected} {MONTHS[calMonth]} {calYear}</div>
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
            {/* FILTRI PERIODO */}
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,flexWrap:"wrap"}}>
              {[{key:"settimana",label:"Questa settimana"},{key:"mese",label:"Questo mese"},{key:"tutti",label:"Tutti"}].map(p=>(
                <button key={p.key} onClick={()=>setFilterPeriod(p.key)}
                  style={{...btnStyle,padding:"8px 16px",fontSize:12,
                    background:filterPeriod===p.key?"#3A2A1A":"#fff",
                    color:filterPeriod===p.key?"#F5E6C8":"#7A6A50",
                    border:"1.5px solid",borderColor:filterPeriod===p.key?"#3A2A1A":"#DDD0BC"}}>
                  {p.label}
                </button>
              ))}
              <button onClick={()=>setIncludePast(v=>!v)}
                style={{...btnStyle,padding:"8px 16px",fontSize:12,marginLeft:"auto",
                  background:includePast?"#7A5A30":"#fff",
                  color:includePast?"#fff":"#7A6A50",
                  border:"1.5px solid",borderColor:includePast?"#7A5A30":"#DDD0BC"}}>
                {includePast?"✓ Includi passati":"+ Includi passati"}
              </button>
            </div>

            {upcomingFiltered.length>0 && (
              <div style={{marginBottom:22}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,color:"#3A2A1A",marginBottom:10}}>📅 Prossimi eventi ({upcomingFiltered.length})</div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {upcomingFiltered.map(b=><BookingCard key={b.id} b={b} onEdit={openEdit} onDelete={id=>setConfirmDelete(id)} formatDate={formatDate}/>)}
                </div>
              </div>
            )}
            {includePast && pastFiltered.length>0 && (
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:17,color:"#9A8A70",marginBottom:10}}>🕰 Passati ({pastFiltered.length})</div>
                <div style={{display:"flex",flexDirection:"column",gap:10,opacity:0.7}}>
                  {[...pastFiltered].reverse().map(b=><BookingCard key={b.id} b={b} onEdit={openEdit} onDelete={id=>setConfirmDelete(id)} formatDate={formatDate}/>)}
                </div>
              </div>
            )}
            {upcomingFiltered.length===0 && (!includePast || pastFiltered.length===0) && (
              <div style={{textAlign:"center",padding:"60px 20px",color:"#B0A080"}}>
                <div style={{fontSize:48,marginBottom:12}}>🌾</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,marginBottom:8}}>Nessuna prenotazione trovata</div>
                <div style={{fontSize:14}}>Premi "+ Nuova Prenotazione" per iniziare</div>
              </div>
            )}
          </div>
        )}
      </div>

      {showImportExcel && importExcelPreview && (
        <div style={{position:"fixed",inset:0,background:"rgba(30,20,10,0.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)",overflowY:"auto",padding:"20px 0"}}>
          <div style={{background:"#FFFDF8",borderRadius:18,padding:"28px",width:480,maxWidth:"95vw",boxShadow:"0 16px 50px rgba(0,0,0,0.2)",border:"1.5px solid #E8DCC8"}}>
            <div style={{fontSize:36,textAlign:"center",marginBottom:8}}>📊</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:"#3A2A1A",marginBottom:4,textAlign:"center"}}>Importa da Excel</div>
            <div style={{fontSize:13,color:"#9A8A70",marginBottom:16,textAlign:"center"}}>Trovati <strong>{importExcelPreview.length}</strong> eventi. Verranno aggiunti a Firebase (senza sovrascrivere quelli esistenti con ID diverso).</div>
            <div style={{maxHeight:240,overflowY:"auto",border:"1px solid #EDE0CC",borderRadius:10,marginBottom:16}}>
              {importExcelPreview.slice(0,10).map((b,i)=>(
                <div key={i} style={{padding:"8px 12px",borderBottom:"1px solid #F0EAE0",fontSize:12,display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{color:"#9A8A70",minWidth:90}}>{b.date}</span>
                  <span style={{fontWeight:700,color:"#3A2A1A",flex:1}}>{b.notes}</span>
                  <span style={{color:"#5A7A40",fontWeight:700}}>€{(Number(b.priceLocation||0)+Number(b.priceCatering||0)).toLocaleString("it-IT")}</span>
                </div>
              ))}
              {importExcelPreview.length > 10 && (
                <div style={{padding:"8px 12px",fontSize:12,color:"#9A8A70",textAlign:"center"}}>... e altri {importExcelPreview.length - 10} eventi</div>
              )}
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>{setShowImportExcel(false);setImportExcelPreview(null);}} style={{...btnStyle,flex:1,background:"#F0EAE0",color:"#7A6A50",fontSize:13}}>Annulla</button>
              <button onClick={handleImportExcel} style={{...btnStyle,flex:1,background:"#1D6A3A",color:"#fff",fontSize:13}}>✅ Importa {importExcelPreview.length} eventi</button>
            </div>
          </div>
        </div>
      )}
      {showImport && (
        <div style={{position:"fixed",inset:0,background:"rgba(30,20,10,0.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>
          <div style={{background:"#FFFDF8",borderRadius:18,padding:"28px",width:360,maxWidth:"90vw",boxShadow:"0 16px 50px rgba(0,0,0,0.2)",border:"1.5px solid #E8DCC8",textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:12}}>📥</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,color:"#3A2A1A",marginBottom:8}}>Importa eventi 2026</div>
            <div style={{fontSize:14,color:"#9A8A70",marginBottom:24}}>Questo aggiungerà/aggiornerà tutti i 38 eventi su Firebase. I dati esistenti con lo stesso ID verranno sovrascritti. Continuare?</div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowImport(false)} style={{...btnStyle,flex:1,background:"#F0EAE0",color:"#7A6A50",fontSize:13}}>Annulla</button>
              <button onClick={handleImport} style={{...btnStyle,flex:1,background:"#5A7A40",color:"#fff",fontSize:13}}>Importa</button>
            </div>
          </div>
        </div>
      )}
      {showModal && <Modal booking={editBooking} onClose={()=>{setShowModal(false);setEditBooking(null);}} onSave={handleSave}/>}
      {confirmDelete!==null && <ConfirmDialog message="Sei sicuro di voler eliminare questa prenotazione?" onConfirm={handleDeleteConfirmed} onCancel={()=>setConfirmDelete(null)}/>}
    </div>
  );
}

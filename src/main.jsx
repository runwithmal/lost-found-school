import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import {
  Search, Heart, MessageCircle, ShieldCheck, Plus, LogIn, LogOut,
  Pencil, Trash2, X, PackageSearch, Sparkles, MapPin, CalendarDays,
  Camera, ArrowUpRight, CheckCircle2, Menu
} from "lucide-react";
import "./style.css";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const ADMIN_WA = (import.meta.env.VITE_ADMIN_WHATSAPP || "").replace(/\D/g, "");
const SCHOOL = import.meta.env.VITE_SCHOOL_NAME || "Lost & Found Sekolah";

const categories = ["Semua", "Elektronik", "Alat Tulis", "Tas", "Pakaian", "Aksesori", "Lainnya"];
const emptyForm = { name: "", category: "Lainnya", description: "", location: "", found_date: new Date().toISOString().slice(0,10), status: "available" };
const waLink = (text) => ADMIN_WA ? `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(text)}` : null;

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");
  const [status, setStatus] = useState("available");
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [message, setMessage] = useState("");

  async function loadItems() {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase.from("items").select("*").order("created_at", { ascending: false });
    if (error) setMessage(error.message);
    else setItems(data || []);
    setLoading(false);
  }

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session;
      setSession(s);
      setIsAdmin(s?.user?.app_metadata?.role === "admin");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setIsAdmin(s?.user?.app_metadata?.role === "admin");
    });
    loadItems();
    return () => listener.subscription.unsubscribe();
  }, []);

  const filtered = useMemo(() => items.filter(item => {
    const q = search.toLowerCase();
    return (status === "all" || item.status === status)
      && (category === "Semua" || item.category === category)
      && [item.name, item.description, item.location, item.category].some(v => (v || "").toLowerCase().includes(q));
  }), [items, search, category, status]);

  function openNew() {
    setEditing(null); setForm(emptyForm); setPhoto(null); setShowForm(true);
  }
  function openEdit(item) {
    setEditing(item); setForm({ ...emptyForm, ...item }); setPhoto(null); setShowForm(true);
  }
  async function saveItem(e) {
    e.preventDefault();
    if (!isAdmin || !supabase) return;
    setSaving(true); setMessage("");
    try {
      let image_url = editing?.image_url || null;
      if (photo) {
        const ext = photo.name.split(".").pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("found-items").upload(path, photo, { upsert: false });
        if (uploadError) throw uploadError;
        image_url = supabase.storage.from("found-items").getPublicUrl(path).data.publicUrl;
      }
      const payload = { ...form, image_url };
      delete payload.id; delete payload.created_at; delete payload.updated_at;
      const result = editing
        ? await supabase.from("items").update(payload).eq("id", editing.id)
        : await supabase.from("items").insert(payload);
      if (result.error) throw result.error;
      setShowForm(false); setPhoto(null); await loadItems();
      setMessage(editing ? "Data barang berhasil diperbarui ♡" : "Barang berhasil ditambahkan ♡");
    } catch (err) { setMessage(err.message || "Terjadi kesalahan."); }
    finally { setSaving(false); }
  }
  async function deleteItem(item) {
    if (!isAdmin || !supabase || !window.confirm(`Hapus data "${item.name}"?`)) return;
    const { error } = await supabase.from("items").delete().eq("id", item.id);
    if (error) setMessage(error.message); else { setMessage("Barang berhasil dihapus."); loadItems(); }
  }
  async function login(e) {
    e.preventDefault();
    if (!supabase) return;
    const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    if (error) setMessage(error.message);
    else if (data.user?.app_metadata?.role !== "admin") {
      await supabase.auth.signOut();
      setMessage("Akun ini belum memiliki akses admin.");
    } else {
      setShowLogin(false); setLoginEmail(""); setLoginPassword(""); setMessage("Berhasil masuk sebagai admin ♡");
    }
  }
  async function logout() { await supabase?.auth.signOut(); setMessage("Kamu sudah keluar dari akun admin."); }

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#"><span className="brand-icon"><Heart size={20} fill="currentColor"/></span><span>lost<span className="brand-amp">&</span>found<small>school edition</small></span></a>
      <nav><a href="#barang">Daftar Barang</a><a href="#cara">Cara Kerja</a><a href="#kontak">Kontak</a></nav>
      <button className="admin-btn" onClick={() => isAdmin ? logout() : setShowLogin(true)}>
        {isAdmin ? <><LogOut size={16}/> Keluar</> : <><ShieldCheck size={16}/> Admin</>}
      </button>
    </header>

    <main>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><Sparkles size={14}/> SMALL THINGS, BIG MEANING</span>
          <h1>Barangmu hilang?<br/><span>Yuk, kita cari!</span></h1>
          <p>Tempat sederhana untuk mempertemukan kembali barang yang tertinggal dengan pemiliknya. Siapa tahu, barang kesayanganmu sedang menunggu di sini. ♡</p>
          <div className="hero-actions">
            <a className="primary-btn" href="#barang">Cari Barang <ArrowUpRight size={17}/></a>
            <a className="soft-btn" href="#kontak"><MessageCircle size={17}/> Hubungi Admin</a>
          </div>
          <div className="hero-note"><span className="tiny-hearts">♡ ♡ ♡</span> Bersama, kita bantu barang pulang.</div>
        </div>
        <div className="hero-art">
          <div className="art-spark s1">✦</div><div className="art-spark s2">♡</div>
          <div className="art-circle"><div className="art-card">
            <div className="art-bag">🎒</div><div className="art-tag">FOUND IT!</div>
            <div className="art-mini">a little thing<br/>looking for its owner</div>
          </div></div>
          <div className="floating f1">♡ found with love</div><div className="floating f2">✿ have you seen me?</div>
        </div>
      </section>

      <section className="stats">
        <div><span className="stat-icon">♡</span><strong>{items.length}</strong><small>Total barang tercatat</small></div>
        <div><span className="stat-icon">✿</span><strong>{items.filter(x=>x.status==="available").length}</strong><small>Menunggu pemilik</small></div>
        <div><span className="stat-icon">✓</span><strong>{items.filter(x=>x.status==="returned").length}</strong><small>Sudah dikembalikan</small></div>
      </section>

      {isAdmin && <section className="admin-dashboard">
        <div className="admin-welcome">
          <div><span className="eyebrow">ADMIN CONTROL CENTER</span><h2>Hai, Admin! <span>♡</span></h2><p>Ini ringkasan aktivitas Lost & Found sekolah hari ini.</p></div>
          <button className="primary-btn" onClick={openNew}><Plus size={17}/> Input Barang</button>
        </div>
        <div className="admin-metrics">
          <div><span className="metric-icon">📦</span><small>Total data</small><strong>{items.length}</strong></div>
          <div><span className="metric-icon">🔎</span><small>Belum diklaim</small><strong>{items.filter(x=>x.status==="available").length}</strong></div>
          <div><span className="metric-icon">💗</span><small>Sudah kembali</small><strong>{items.filter(x=>x.status==="returned").length}</strong></div>
        </div>
        <div className="admin-recent">
          <div><h3>Barang terbaru</h3><p>Kelola data yang baru ditambahkan.</p></div>
          {items.length === 0 ? <span className="admin-empty">Belum ada data barang.</span> : items.slice(0,4).map(item=><div className="recent-row" key={item.id}>
            <span className="recent-thumb">{item.image_url ? <img src={item.image_url} alt=""/> : "🎒"}</span>
            <span className="recent-info"><strong>{item.name}</strong><small>{item.category} · {item.location || "Lokasi belum diisi"}</small></span>
            <span className={`recent-status ${item.status}`}>{item.status==="available" ? "Belum diklaim" : "Dikembalikan"}</span>
            <button className="recent-edit" onClick={()=>openEdit(item)} aria-label={`Edit ${item.name}`}><Pencil size={15}/></button>
          </div>)}
        </div>
      </section>}

      <section className="items-section" id="barang">
        <div className="section-heading"><div><span className="eyebrow">THE LOST & FOUND CORNER</span><h2>Temukan barangmu <span>di sini ♡</span></h2><p>Lihat daftar barang yang sudah ditemukan oleh warga sekolah.</p></div>
          {isAdmin && <button className="primary-btn add-btn" onClick={openNew}><Plus size={17}/> Tambah Barang</button>}
        </div>
        {!supabase && <div className="notice"><strong>Mode pratinjau.</strong> Hubungkan Supabase dengan mengisi file <code>.env</code> agar database dan login admin aktif.</div>}
        <div className="filters">
          <label className="search-box"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari nama barang, lokasi, atau kata kunci..."/></label>
          <select value={category} onChange={e=>setCategory(e.target.value)} aria-label="Kategori">{categories.map(c=><option key={c}>{c}</option>)}</select>
          <select value={status} onChange={e=>setStatus(e.target.value)} aria-label="Status"><option value="available">Belum diklaim</option><option value="returned">Sudah kembali</option><option value="all">Semua status</option></select>
        </div>
        {message && <div className="toast" role="status">{message}<button onClick={()=>setMessage("")}><X size={15}/></button></div>}
        {loading ? <div className="empty"><div className="loader"></div><p>Sebentar ya, sedang memuat barang...</p></div>
          : filtered.length === 0 ? <div className="empty"><div className="empty-emoji">🧸</div><h3>Belum ada barang di sini</h3><p>Coba kata kunci atau kategori lain, ya!</p></div>
          : <div className="item-grid">{filtered.map(item=><article className="item-card" key={item.id}>
            <div className="item-image">{item.image_url ? <img src={item.image_url} alt={item.name}/> : <div className="image-placeholder"><PackageSearch size={42}/><span>found item ♡</span></div>}
              <span className={`status-pill ${item.status}`}>{item.status==="available" ? "Menunggu pemilik" : "Sudah kembali"}</span>
            </div>
            <div className="item-content"><span className="category-label">{item.category}</span><h3>{item.name}</h3>
              {item.description && <p className="item-desc">{item.description}</p>}
              <div className="item-meta">{item.location && <span><MapPin size={14}/>{item.location}</span>}<span><CalendarDays size={14}/>{new Date(item.found_date+"T00:00:00").toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})}</span></div>
              <div className="card-actions">{item.status==="available" ? <a className="claim-btn" href={waLink(`Halo Admin, saya ingin menanyakan barang: ${item.name}. Saya akan menjelaskan ciri khususnya untuk verifikasi.`) || "#kontak"} target="_blank" rel="noreferrer" onClick={e=>{if(!ADMIN_WA){e.preventDefault();setMessage("Nomor WhatsApp admin belum diatur di file .env.");}}}><MessageCircle size={15}/> Tanya Admin</a> : <span className="returned-label"><CheckCircle2 size={15}/> Sudah dikembalikan</span>}
                {isAdmin && <div className="admin-actions"><button title="Edit" onClick={()=>openEdit(item)}><Pencil size={15}/></button><button title="Hapus" onClick={()=>deleteItem(item)}><Trash2 size={15}/></button></div>}
              </div>
            </div>
          </article>)}</div>}
      </section>

      <section className="how-section" id="cara"><div className="section-heading centered"><div><span className="eyebrow">IT'S AS EASY AS 1, 2, 3</span><h2>Gimana cara kerjanya?</h2><p>Proses sederhana supaya barang bisa kembali ke pemiliknya.</p></div></div>
        <div className="steps"><div className="step"><div className="step-icon">🔎</div><span>01</span><h3>Cari barangmu</h3><p>Lihat daftar barang yang ditemukan di website ini.</p></div><div className="step"><div className="step-icon">💬</div><span>02</span><h3>Hubungi admin</h3><p>Jika merasa itu milikmu, chat admin melalui WhatsApp.</p></div><div className="step"><div className="step-icon">🎀</div><span>03</span><h3>Verifikasi & ambil</h3><p>Admin akan mencocokkan ciri barang sebelum diserahkan.</p></div></div>
      </section>

      <section className="contact-section" id="kontak"><div className="contact-inner"><div><span className="eyebrow">WE'RE HERE TO HELP</span><h2>Butuh bantuan?<br/><span>Yuk, ngobrol dengan admin!</span></h2><p>Belum menemukan barangmu? Hubungi admin sekolah. Ceritakan barang yang hilang atau tanyakan barang yang kamu temukan.</p><a className="whatsapp-btn" href={waLink("Halo Admin Lost & Found, saya ingin bertanya tentang barang hilang/temuan.") || "#"} target="_blank" rel="noreferrer" onClick={e=>{if(!ADMIN_WA){e.preventDefault();setMessage("Nomor WhatsApp admin belum diatur di file .env.");}}}><MessageCircle size={18}/> Chat Admin via WhatsApp</a></div><div className="contact-deco">💌<span>we're just<br/>one chat away!</span></div></div></section>
    </main>
    <footer><a className="brand footer-brand" href="#"><span className="brand-icon"><Heart size={17} fill="currentColor"/></span><span>lost<span className="brand-amp">&</span>found</span></a><p>Made with ♡ to help little things find their way home.</p><small>© {new Date().getFullYear()} {SCHOOL}</small></footer>

    {showLogin && <div className="modal-backdrop" onClick={()=>setShowLogin(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close-btn" onClick={()=>setShowLogin(false)}><X/></button><div className="modal-icon"><ShieldCheck/></div><span className="eyebrow">KHUSUS PENGELOLA</span><h2>Admin Login</h2><p>Masuk untuk mengelola daftar barang.</p><form onSubmit={login}><label>Email admin<input type="email" required value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} placeholder="admin@sekolah.sch.id"/></label><label>Password<input type="password" required value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} placeholder="Masukkan password"/></label><button className="primary-btn full-btn" type="submit"><LogIn size={17}/> Masuk sebagai Admin</button></form></div></div>}

    {showForm && <div className="modal-backdrop" onClick={()=>setShowForm(false)}><div className="modal form-modal" onClick={e=>e.stopPropagation()}><button className="close-btn" onClick={()=>setShowForm(false)}><X/></button><div className="modal-icon"><PackageSearch/></div><span className="eyebrow">ADMIN WORKSPACE</span><h2>{editing ? "Edit barang" : "Tambah barang baru"}</h2><p>Isi informasi barang yang diserahkan kepada admin.</p>
      <form onSubmit={saveItem}><label>Nama barang<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Contoh: Botol minum pink"/></label><div className="form-row"><label>Kategori<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.filter(c=>c!=="Semua").map(c=><option key={c}>{c}</option>)}</select></label><label>Tanggal ditemukan<input type="date" required value={form.found_date} onChange={e=>setForm({...form,found_date:e.target.value})}/></label></div><label>Lokasi ditemukan<input value={form.location||""} onChange={e=>setForm({...form,location:e.target.value})} placeholder="Contoh: Perpustakaan"/></label><label>Deskripsi<textarea rows="3" value={form.description||""} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Ceritakan kondisi umum barang. Jangan tulis ciri rahasia untuk verifikasi."/></label><label>Foto barang <span className="muted">(opsional)</span><span className="upload-box"><Camera size={18}/><span>{photo ? photo.name : "Pilih foto dari perangkat"}</span><input type="file" accept="image/*" onChange={e=>setPhoto(e.target.files?.[0]||null)}/></span></label><label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="available">Menunggu pemilik</option><option value="returned">Sudah dikembalikan</option></select></label><button className="primary-btn full-btn" disabled={saving}>{saving ? "Menyimpan..." : <><CheckCircle2 size={17}/> Simpan Barang</>}</button></form>
    </div></div>}
  </div>;
}

createRoot(document.getElementById("root")).render(<App/>);

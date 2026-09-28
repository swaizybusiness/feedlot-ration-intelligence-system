import React, { useEffect, useMemo, useState } from 'react';
import AppV3 from './AppV3.jsx';
import { calculateGuided, guidedDefaults } from './lib/guidedEngine.js';

const money = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number.isFinite(n) ? n : 0);
const num = (n, digits = 1) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number.isFinite(n) ? n : 0);
const pct = (n, digits = 2) => `${num(n, digits)}%`;
const kg = (n, digits = 1) => `${num(n, digits)} kg`;

const guidedFields = [
  ['heads', 'Jumlah sapi', 'Berapa ekor dalam lot ini?', 'ekor', 1],
  ['purchaseWeight', 'Bobot saat beli', 'Rata-rata bobot sapi ketika dibeli.', 'kg', 1],
  ['purchasePrice', 'Harga beli', 'Harga yang dibayar per kg bobot hidup.', 'Rp/kg', 500],
  ['daysOnFeed', 'Lama dipelihara', 'Total hari sapi berada dalam periode feeding.', 'hari', 1],
  ['adg', 'Pertambahan bobot/hari', 'ADG: rata-rata kenaikan bobot per ekor per hari.', 'kg/hari', 0.01],
  ['rationPrice', 'Harga pakan', 'Harga rata-rata ration as-fed per kg.', 'Rp/kg', 100],
  ['dressingPct', 'Perkiraan karkas', 'Persentase bobot potong yang menjadi gross carcass.', '%', 0.1],
  ['carcassPrice', 'Harga jual karkas', 'Harga jual per kg karkas.', 'Rp/kg', 500],
  ['byproductRevenuePerSoldHead', 'Hasil sampingan', 'Nilai kulit, jeroan, kepala, kaki, dan hasil lain per ekor.', 'Rp/ekor', 50000],
  ['targetProfitPerInitialHead', 'Target keuntungan', 'Keuntungan minimum yang ingin dicapai per ekor awal.', 'Rp/ekor', 100000],
];

function FriendlyField({ label, help, suffix, step, value, onChange }) {
  return <label className="os-field">
    <span><b>{label}</b><small>{help}</small></span>
    <div><input type="number" value={value} step={step} onChange={(e) => onChange(Number(e.target.value))} /><em>{suffix}</em></div>
  </label>;
}

function Metric({ label, value, note, tone = '' }) {
  return <div className={`os-metric ${tone}`}><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>;
}

function StatusBanner({ analysis }) {
  const { result, status } = analysis;
  const title = status === 'loss' ? 'Perhitungan ini masih rugi' : status === 'target' ? 'Target keuntungan tercapai' : 'Masih untung, tetapi target belum tercapai';
  const tone = status === 'loss' ? 'danger' : status === 'target' ? 'good' : 'warning';
  const detail = status === 'loss'
    ? `Dengan angka sekarang, estimasi rugi ${money(Math.abs(result.carcassProfitPerInitialHead))} per ekor.`
    : `Estimasi keuntungan ${money(result.carcassProfitPerInitialHead)} per ekor.`;
  return <div className={`os-status ${tone}`}><span>HASIL UTAMA</span><strong>{title}</strong><p>{detail}</p></div>;
}

function Home({ analysis, savedLots, onGo }) {
  const r = analysis.result;
  return <div className="os-home">
    <header className="os-hero">
      <div><span className="os-kicker">CATTLE OS · V0.4</span><h1>Sistem ekonomi sapi yang bisa dipahami siapa pun.</h1><p>Mulai dari pertanyaan sederhana. Sistem akan membawa Anda sedalam yang diperlukan—tanpa memaksa orang awam membaca 30 variabel teknis.</p></div>
      <div className="os-hero-chip"><span>Model default saat ini</span><strong>{money(r.carcassProfitPerInitialHead)}</strong><small>estimasi profit / ekor</small></div>
    </header>

    <section className="os-question">
      <div><span className="os-kicker">MULAI DARI PERTANYAAN</span><h2>Apa yang ingin Anda ketahui?</h2><p>Pilih berdasarkan tujuan, bukan berdasarkan istilah teknis.</p></div>
      <div className="os-action-grid">
        <button onClick={() => onGo('quick')}><span>⚡</span><b>Hitung untung cepat</b><small>Saya cuma ingin tahu untung atau rugi.</small></button>
        <button onClick={() => onGo('guided', 'deal')}><span>🐂</span><b>Sapi ini layak dibeli?</b><small>Cari harga beli maksimal dan ruang negosiasi.</small></button>
        <button onClick={() => onGo('guided', 'slaughter')}><span>🔪</span><b>Kapan sebaiknya dipotong?</b><small>Bandingkan potong sekarang vs lanjut feeding.</small></button>
        <button onClick={() => onGo('guided', 'leakage')}><span>📉</span><b>Uang bocor di mana?</b><small>Lihat faktor yang paling banyak menggerus profit.</small></button>
        <button onClick={() => onGo('lots')}><span>🗂️</span><b>Bandingkan beberapa lot</b><small>Simpan skenario di browser dan buka lagi nanti.</small></button>
        <button onClick={() => onGo('professional')}><span>🧠</span><b>Saya mau hitung sedetail mungkin</b><small>Buka full feedlot, carcass, finance, RPH, sensitivity dan audit.</small></button>
      </div>
    </section>

    <section className="os-home-summary">
      <div><span>Profit model</span><strong>{money(r.carcassProfitPerInitialHead)}/ekor</strong></div>
      <div><span>Harga beli maksimal</span><strong>{money(r.maxPurchasePriceTarget)}/kg</strong></div>
      <div><span>Minimal karkas target</span><strong>{pct(r.requiredDressingTargetPct)}</strong></div>
      <div><span>Lot tersimpan</span><strong>{savedLots.length}</strong></div>
    </section>

    <section className="os-principles">
      <div><b>Untuk orang awam</b><p>Bahasa manusia, hasil utama dulu, rumus di belakang.</p></div>
      <div><b>Untuk manager</b><p>Deal analyzer, slaughter timing, leakage dan lot comparison.</p></div>
      <div><b>Untuk profesional</b><p>Seluruh asumsi teknis tetap bisa dibuka, diedit, dan diaudit.</p></div>
    </section>
  </div>;
}

function GuidedInputs({ state, setState, onReset }) {
  return <section className="os-input-card">
    <div className="os-section-head"><div><span className="os-kicker">10 ANGKA PENTING</span><h3>Masukkan kondisi sapi Anda</h3><p>Sistem profesional tetap bekerja di belakang. Asumsi teknis lain memakai default dan bisa dibuka di mode profesional.</p></div><button onClick={onReset}>Reset</button></div>
    <div className="os-fields">{guidedFields.map(([key,label,help,suffix,step]) =>
      <FriendlyField key={key} label={label} help={help} suffix={suffix} step={step} value={state[key]} onChange={(value) => setState((s) => ({ ...s, [key]: value }))} />
    )}</div>
    <details className="os-glossary"><summary>📖 Saya belum paham istilahnya</summary><div>
      <p><b>ADG</b> = pertambahan bobot rata-rata per hari.</p>
      <p><b>Dressing / karkas %</b> = persentase bobot hidup saat potong yang menjadi karkas.</p>
      <p><b>HCW</b> = berat karkas panas setelah pemotongan.</p>
      <p><b>Break-even</b> = titik di mana pendapatan sama dengan seluruh biaya.</p>
    </div></details>
  </section>;
}

function OverviewPanel({ analysis }) {
  const r = analysis.result;
  return <section className="os-result-card"><StatusBanner analysis={analysis} /><div className="os-metric-grid">
    <Metric label="Estimasi profit / ekor" value={money(r.carcassProfitPerInitialHead)} tone={analysis.status === 'loss' ? 'danger' : 'good'} />
    <Metric label="Estimasi profit seluruh lot" value={money(r.lotCarcassProfit)} note={`${num(r.x.heads,0)} ekor awal`} />
    <Metric label="Bobot akhir proyeksi" value={kg(r.finalFeedlotWeight)} note={`${num(r.x.daysOnFeed,0)} hari feeding`} />
    <Metric label="Karkas bersih proyeksi" value={kg(r.netHCW)} note={`gross dressing ${pct(r.x.dressingPct,1)}`} />
    <Metric label="Harga beli maksimal" value={`${money(r.maxPurchasePriceTarget)}/kg`} note="untuk menjaga target profit" />
    <Metric label="Minimal dressing target" value={pct(r.requiredDressingTargetPct)} note={`break-even ${pct(r.requiredDressingBreakEvenPct)}`} />
    <Metric label="Biaya pakan / ekor awal" value={money(r.feedCostPerInitialHead)} />
    <Metric label="ROI per siklus" value={pct(r.carcassRoiPct)} />
  </div></section>;
}

function DealPanel({ analysis }) {
  const r = analysis.result;
  const gap = analysis.buyGapPerKg;
  const tone = gap >= 0 ? 'good' : 'danger';
  return <section className="os-result-card">
    <div className={`os-decision ${tone}`}><span>DEAL ANALYZER</span><strong>{gap >= 0 ? 'Harga beli masih berada di bawah batas target' : 'Harga beli melewati batas target'}</strong><p>Harga saat ini {money(r.x.purchasePrice)}/kg · batas model {money(r.maxPurchasePriceTarget)}/kg.</p></div>
    <div className="os-metric-grid">
      <Metric label="Harga offer" value={`${money(r.x.purchasePrice)}/kg`} />
      <Metric label="Target bid ceiling" value={`${money(r.maxPurchasePriceTarget)}/kg`} tone={tone} />
      <Metric label="Selisih terhadap batas" value={`${gap >= 0 ? '+' : '-'}${money(Math.abs(gap))}/kg`} />
      <Metric label="Landed cost / kg arrival" value={`${money(r.landedCostPerKgArrival)}/kg`} />
    </div>
    <div className="os-explain"><b>Artinya apa?</b><p>{gap >= 0 ? 'Pada asumsi yang Anda masukkan, harga beli masih memberi ruang untuk mencapai target profit model.' : 'Agar target tetap tercapai, salah satu harus berubah: harga beli turun, dressing naik, biaya turun, atau harga karkas naik.'}</p></div>
  </section>;
}

function SlaughterPanel({ analysis }) {
  const best = analysis.bestSlaughter;
  return <section className="os-result-card">
    <div className="os-decision good"><span>SLAUGHTER WINDOW</span><strong>{analysis.slaughterAction}</strong><p>Di antara empat titik waktu yang dibandingkan, profit model tertinggi berada pada total DOF {num(best.totalDays,0)} hari.</p></div>
    <div className="os-scenario-grid">{analysis.slaughterScenarios.map((s) =>
      <div key={s.extraDays} className={s.extraDays === best.extraDays ? 'best' : ''}><span>{s.extraDays === 0 ? 'Sekarang' : `+${s.extraDays} hari`}</span><strong>{money(s.profitPerHead)}</strong><small>{kg(s.finalWeight)} final BW · {kg(s.netHCW)} net HCW</small>{s.extraDays === best.extraDays && <em>MODEL TERTINGGI</em>}</div>
    )}</div>
    <div className="os-explain"><b>Catatan penting</b><p>Ini membandingkan ekonomi berdasarkan ADG, konsumsi, biaya, dressing dan harga yang sedang Anda masukkan. Jika ADG atau harga berubah, jendela optimal juga berubah.</p></div>
  </section>;
}

function LeakagePanel({ analysis }) {
  const maxImpact = Math.max(1, ...analysis.leakages.map((x) => x.impact));
  return <section className="os-result-card">
    <div className="os-decision warning"><span>PROFIT LEAKAGE</span><strong>{analysis.largestLeakage?.name || 'Belum ada leakage material'}</strong><p>Faktor terbesar dalam model saat ini bernilai sekitar {money(analysis.largestLeakage?.impact || 0)} per ekor.</p></div>
    <div className="os-leak-list">{analysis.leakages.map((item) => <div key={item.name}>
      <div className="os-leak-row"><span><b>{item.name}</b><small>{item.explanation}</small></span><strong>{money(item.impact)}</strong></div>
      <div className="os-bar"><i style={{ width: `${Math.max(2, item.impact / maxImpact * 100)}%` }} /></div>
    </div>)}</div>
  </section>;
}

function Guided({ state, setState, tab, setTab, onHome, onProfessional }) {
  const analysis = useMemo(() => calculateGuided(state), [state]);
  const tabs = [['overview','Ringkasan'],['deal','Beli Sapi'],['slaughter','Kapan Potong'],['leakage','Profit Bocor']];
  return <div className="os-page">
    <header className="os-topbar"><div><button onClick={onHome}>← Cattle OS</button><span className="os-kicker">GUIDED ANALYSIS</span><h1>Detail secukupnya, keputusan sejelas mungkin.</h1></div><button className="os-pro-btn" onClick={onProfessional}>Buka Mode Profesional →</button></header>
    <nav className="os-tabs">{tabs.map(([key,label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>)}</nav>
    <div className="os-guided-layout">
      <GuidedInputs state={state} setState={setState} onReset={() => setState({ ...guidedDefaults })} />
      <div>{tab === 'overview' && <OverviewPanel analysis={analysis} />}{tab === 'deal' && <DealPanel analysis={analysis} />}{tab === 'slaughter' && <SlaughterPanel analysis={analysis} />}{tab === 'leakage' && <LeakagePanel analysis={analysis} />}</div>
    </div>
  </div>;
}

function Lots({ savedLots, setSavedLots, currentState, setCurrentState, onHome, onGuided }) {
  const [name, setName] = useState('');
  const saveCurrent = () => {
    const lotName = name.trim() || `Lot ${savedLots.length + 1}`;
    const next = [{ id: String(Date.now()), name: lotName, savedAt: new Date().toISOString(), state: { ...currentState } }, ...savedLots].slice(0, 30);
    setSavedLots(next);
    setName('');
  };
  return <div className="os-page">
    <header className="os-topbar"><div><button onClick={onHome}>← Cattle OS</button><span className="os-kicker">LOT COMMAND CENTER · LOCAL</span><h1>Simpan dan bandingkan skenario lot.</h1><p>Versi ini menyimpan data hanya di browser perangkat ini. Belum menjadi database perusahaan.</p></div></header>
    <section className="os-savebar"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lot, mis. BX-AUS-01" /><button onClick={saveCurrent}>Simpan kondisi Guided saat ini</button></section>
    {savedLots.length === 0 ? <div className="os-empty"><span>🗂️</span><h3>Belum ada lot tersimpan</h3><p>Atur angka di Guided Analysis, lalu simpan sebagai lot untuk dibandingkan.</p><button onClick={onGuided}>Buka Guided Analysis</button></div> :
      <div className="os-lot-grid">{savedLots.map((lot) => {
        const a = calculateGuided(lot.state);
        return <article key={lot.id} className="os-lot-card"><div className="os-lot-head"><div><span>LOT</span><h3>{lot.name}</h3></div><b className={a.status}>{a.status === 'loss' ? 'RUGI' : a.status === 'target' ? 'TARGET' : 'UNTUNG'}</b></div>
          <div className="os-lot-metrics"><p><span>Profit / ekor</span><strong>{money(a.result.carcassProfitPerInitialHead)}</strong></p><p><span>Final BW</span><strong>{kg(a.result.finalFeedlotWeight)}</strong></p><p><span>Max buy</span><strong>{money(a.result.maxPurchasePriceTarget)}/kg</strong></p><p><span>Slaughter</span><strong>{a.slaughterAction}</strong></p></div>
          <div className="os-lot-actions"><button onClick={() => { setCurrentState({ ...lot.state }); onGuided(); }}>Buka</button><button onClick={() => setSavedLots(savedLots.filter((x) => x.id !== lot.id))}>Hapus</button></div>
        </article>;
      })}</div>}
  </div>;
}

export default function AppV4() {
  const [view, setView] = useState('home');
  const [guidedTab, setGuidedTab] = useState('overview');
  const [guidedState, setGuidedState] = useState({ ...guidedDefaults });
  const [savedLots, setSavedLots] = useState(() => {
    try {
      const raw = localStorage.getItem('cattle-os-lots-v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try { localStorage.setItem('cattle-os-lots-v1', JSON.stringify(savedLots)); } catch { /* local storage may be unavailable */ }
  }, [savedLots]);

  const analysis = useMemo(() => calculateGuided(guidedState), [guidedState]);
  const go = (nextView, tab) => {
    if (tab) setGuidedTab(tab);
    setView(nextView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (view === 'quick') return <AppV3 initialMode="quick" onExit={() => go('home')} />;
  if (view === 'professional') return <AppV3 initialMode="professional" onExit={() => go('home')} />;
  if (view === 'guided') return <Guided state={guidedState} setState={setGuidedState} tab={guidedTab} setTab={setGuidedTab} onHome={() => go('home')} onProfessional={() => go('professional')} />;
  if (view === 'lots') return <Lots savedLots={savedLots} setSavedLots={setSavedLots} currentState={guidedState} setCurrentState={setGuidedState} onHome={() => go('home')} onGuided={() => go('guided', 'overview')} />;

  return <Home analysis={analysis} savedLots={savedLots} onGo={go} />;
}

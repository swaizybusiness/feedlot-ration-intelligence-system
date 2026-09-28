import React, { useMemo, useState } from 'react';
import AppV3 from './AppV3.jsx';
import {
  calculateQuickLive,
  calculateQuickCarcass,
  quickLiveDefaults,
  quickCarcassDefaults,
} from './lib/quickEngine.js';
import { buildDressingScenarioSteps } from './lib/scenario.js';

const money = (n) => Number.isFinite(n)
  ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
  : 'Tidak mungkin';
const num = (n, digits = 1) => Number.isFinite(n)
  ? new Intl.NumberFormat('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n)
  : '—';
const pct = (n, digits = 2) => Number.isFinite(n) ? `${num(n, digits)}%` : 'Tidak mungkin';
const kg = (n, digits = 1) => Number.isFinite(n) ? `${num(n, digits)} kg` : 'Tidak mungkin';

function Field({ label, value, step, suffix, onChange }) {
  return <label className="simple-field">
    <span>{label}</span>
    <div>
      <input type="number" value={value} step={step} onChange={(e) => onChange(Number(e.target.value))} />
      <b>{suffix}</b>
    </div>
  </label>;
}

function ResultCard({ label, value, note, tone = '' }) {
  return <div className={`simple-result ${tone}`}>
    <span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}
  </div>;
}

function Formula({ children }) {
  return <div className="simple-formula">{children}</div>;
}

function ImpossibleTarget({ requiredPct }) {
  return <div className="simple-impossible">
    <span>⚠️ TARGET TIDAK MUNGKIN DENGAN ANGKA INI</span>
    <strong>{pct(requiredPct)} karkas diperlukan</strong>
    <p>Persentase karkas tidak bisa melebihi 100%. Agar target bisa dicapai, turunkan harga beli/biaya/target profit atau naikkan harga karkas/hasil sampingan.</p>
  </div>;
}

function ScenarioGrid({ state, targetPct, feasible }) {
  if (!feasible) return <ImpossibleTarget requiredPct={targetPct} />;
  const steps = buildDressingScenarioSteps(targetPct);
  const firstMeeting = steps.find((dp) => dp >= targetPct);
  return <div className="simple-scenarios">
    {steps.map((dp) => {
      const r = calculateQuickCarcass({ ...state, dressingPct: dp });
      const meets = dp >= targetPct;
      const label = dp === firstMeeting ? 'MINIMAL AMAN' : meets ? 'DI ATAS TARGET' : r.profit < 0 ? 'RUGI' : 'DI BAWAH TARGET';
      const tone = dp === firstMeeting ? 'target' : meets ? 'good' : r.profit < 0 ? 'bad' : 'mid';
      return <div key={dp} className={tone}>
        <span>{dp}%</span><strong>{money(r.profit)}</strong><small>{kg(r.carcassWeight)}</small><em>{label}</em>
      </div>;
    })}
  </div>;
}

function ProfitCalculator({ liveState, setLiveState, carcassState, setCarcassState }) {
  const [channel, setChannel] = useState('live');
  const live = useMemo(() => calculateQuickLive(liveState), [liveState]);
  const carcass = useMemo(() => calculateQuickCarcass(carcassState), [carcassState]);

  return <>
    <div className="simple-switch">
      <button className={channel === 'live' ? 'active' : ''} onClick={() => setChannel('live')}>🐂 Jual Sapi Hidup</button>
      <button className={channel === 'carcass' ? 'active' : ''} onClick={() => setChannel('carcass')}>🔪 Jual Karkas</button>
    </div>

    {channel === 'live' ? <div className="simple-workspace">
      <section className="simple-panel">
        <h3>Masukkan angkanya</h3>
        <div className="simple-fields">
          <Field label="Bobot beli" suffix="kg" step={1} value={liveState.purchaseWeight} onChange={(v) => setLiveState(s => ({ ...s, purchaseWeight: v }))} />
          <Field label="Harga beli" suffix="Rp/kg" step={500} value={liveState.purchasePrice} onChange={(v) => setLiveState(s => ({ ...s, purchasePrice: v }))} />
          <Field label="Bobot jual" suffix="kg" step={1} value={liveState.saleWeight} onChange={(v) => setLiveState(s => ({ ...s, saleWeight: v }))} />
          <Field label="Harga jual" suffix="Rp/kg" step={500} value={liveState.salePrice} onChange={(v) => setLiveState(s => ({ ...s, salePrice: v }))} />
          <Field label="Biaya tambahan" suffix="Rp/ekor" step={100000} value={liveState.additionalCostPerHead} onChange={(v) => setLiveState(s => ({ ...s, additionalCostPerHead: v }))} />
          <Field label="Jumlah ekor" suffix="ekor" step={1} value={liveState.heads} onChange={(v) => setLiveState(s => ({ ...s, heads: v }))} />
        </div>
      </section>
      <section className="simple-panel result-panel">
        <div className={`simple-hero-result ${live.profit < 0 ? 'danger' : 'good'}`}>
          <span>UNTUNG / RUGI PER EKOR</span><strong>{money(live.profit)}</strong><b>{live.profit < 0 ? 'RUGI' : 'UNTUNG'}</b>
        </div>
        <div className="simple-result-grid">
          <ResultCard label="Total pembelian sapi / ekor" value={money(live.purchaseCost)} note={`${num(live.x.purchaseWeight,1)} kg × ${money(live.x.purchasePrice)}/kg`} />
          <ResultCard label="Nilai jual / ekor" value={money(live.saleRevenue)} note={`${num(live.x.saleWeight,1)} kg × ${money(live.x.salePrice)}/kg`} />
          <ResultCard label="Total modal / ekor" value={money(live.totalCost)} />
          <ResultCard label="Untung seluruh lot" value={money(live.lotProfit)} tone={live.lotProfit < 0 ? 'danger' : 'good'} />
        </div>
        <Formula><b>Rumus:</b> {money(live.saleRevenue)} − {money(live.purchaseCost)} − {money(live.x.additionalCostPerHead)} = <strong>{money(live.profit)}</strong></Formula>
      </section>
    </div> : <div className="simple-workspace">
      <section className="simple-panel">
        <h3>Masukkan angkanya</h3>
        <div className="simple-fields">
          <Field label="Bobot sapi" suffix="kg" step={1} value={carcassState.liveWeight} onChange={(v) => setCarcassState(s => ({ ...s, liveWeight: v }))} />
          <Field label="Harga beli sapi" suffix="Rp/kg" step={500} value={carcassState.livePrice} onChange={(v) => setCarcassState(s => ({ ...s, livePrice: v }))} />
          <Field label="Karkas" suffix="%" step={0.1} value={carcassState.dressingPct} onChange={(v) => setCarcassState(s => ({ ...s, dressingPct: v }))} />
          <Field label="Harga karkas" suffix="Rp/kg" step={500} value={carcassState.carcassPrice} onChange={(v) => setCarcassState(s => ({ ...s, carcassPrice: v }))} />
          <Field label="Biaya tambahan" suffix="Rp/ekor" step={100000} value={carcassState.additionalCostPerHead} onChange={(v) => setCarcassState(s => ({ ...s, additionalCostPerHead: v }))} />
          <Field label="Hasil sampingan" suffix="Rp/ekor" step={100000} value={carcassState.byproductRevenuePerHead} onChange={(v) => setCarcassState(s => ({ ...s, byproductRevenuePerHead: v }))} />
          <Field label="Jumlah ekor" suffix="ekor" step={1} value={carcassState.heads} onChange={(v) => setCarcassState(s => ({ ...s, heads: v }))} />
        </div>
      </section>
      <section className="simple-panel result-panel">
        <div className={`simple-hero-result ${carcass.profit < 0 ? 'danger' : 'good'}`}>
          <span>UNTUNG / RUGI PER EKOR</span><strong>{money(carcass.profit)}</strong><b>{carcass.profit < 0 ? 'RUGI' : 'UNTUNG'}</b>
        </div>
        <div className="simple-result-grid">
          <ResultCard label="Berat karkas" value={kg(carcass.carcassWeight)} note={`${num(carcass.x.liveWeight,1)} kg × ${pct(carcass.x.dressingPct,1)}`} />
          <ResultCard label="Revenue karkas" value={money(carcass.carcassRevenue)} note={`${kg(carcass.carcassWeight)} × ${money(carcass.x.carcassPrice)}/kg`} />
          <ResultCard label="Total pemasukan" value={money(carcass.totalRevenue)} note="Revenue karkas + hasil sampingan" />
          <ResultCard label="Untung seluruh lot" value={money(carcass.lotProfit)} tone={carcass.lotProfit < 0 ? 'danger' : 'good'} />
        </div>
        <Formula><b>Rumus:</b> {money(carcass.totalRevenue)} − {money(carcass.purchaseCost)} − {money(carcass.x.additionalCostPerHead)} = <strong>{money(carcass.profit)}</strong></Formula>
      </section>
    </div>}
  </>;
}

function CarcassCalculator({ state, setState }) {
  const r = useMemo(() => calculateQuickCarcass(state), [state]);
  return <div className="simple-workspace">
    <section className="simple-panel">
      <h3>Hitung karkas</h3>
      <p className="simple-help">Hitungan kasar langsung: bobot sapi × persentase karkas.</p>
      <div className="simple-fields">
        <Field label="Bobot sapi" suffix="kg" step={1} value={state.liveWeight} onChange={(v) => setState(s => ({ ...s, liveWeight: v }))} />
        <Field label="Karkas" suffix="%" step={0.1} value={state.dressingPct} onChange={(v) => setState(s => ({ ...s, dressingPct: v }))} />
        <Field label="Harga beli sapi" suffix="Rp/kg" step={500} value={state.livePrice} onChange={(v) => setState(s => ({ ...s, livePrice: v }))} />
        <Field label="Harga karkas" suffix="Rp/kg" step={500} value={state.carcassPrice} onChange={(v) => setState(s => ({ ...s, carcassPrice: v }))} />
        <Field label="Biaya tambahan" suffix="Rp/ekor" step={100000} value={state.additionalCostPerHead} onChange={(v) => setState(s => ({ ...s, additionalCostPerHead: v }))} />
        <Field label="Hasil sampingan" suffix="Rp/ekor" step={100000} value={state.byproductRevenuePerHead} onChange={(v) => setState(s => ({ ...s, byproductRevenuePerHead: v }))} />
        <Field label="Target keuntungan" suffix="Rp/ekor" step={100000} value={state.targetProfitPerHead} onChange={(v) => setState(s => ({ ...s, targetProfitPerHead: v }))} />
      </div>
    </section>
    <section className="simple-panel result-panel">
      <div className="simple-hero-result good">
        <span>BERAT KARKAS</span><strong>{kg(r.carcassWeight)}</strong><b>{num(r.x.liveWeight,1)} kg × {pct(r.x.dressingPct,1)}</b>
      </div>
      <Formula><b>Rumus karkas:</b> {num(r.x.liveWeight,1)} kg × {pct(r.x.dressingPct,1)} = <strong>{kg(r.carcassWeight)}</strong></Formula>
      <h4>Skenario sekitar minimal target {pct(r.requiredDressingTargetPct)}</h4>
      <ScenarioGrid state={state} targetPct={r.requiredDressingTargetPct} feasible={r.targetDressingFeasible} />
      <div className="simple-result-grid">
        <ResultCard label="Minimal karkas untuk target" value={pct(r.requiredDressingTargetPct)} tone={r.targetDressingFeasible ? '' : 'danger'} />
        <ResultCard label="Minimal berat karkas" value={kg(r.requiredCarcassWeightTarget)} />
        <ResultCard label="Break-even karkas" value={pct(r.requiredDressingBreakEvenPct)} />
        <ResultCard label="Profit pada input sekarang" value={money(r.profit)} tone={r.profit < 0 ? 'danger' : 'good'} />
      </div>
    </section>
  </div>;
}

function BuyCalculator({ state, setState }) {
  const r = useMemo(() => calculateQuickCarcass(state), [state]);
  const gap = r.maxLivePriceTarget - r.x.livePrice;
  return <div className="simple-workspace">
    <section className="simple-panel">
      <h3>Cari harga beli maksimal</h3>
      <p className="simple-help">Semua faktor yang dipakai terlihat di bawah. Tidak ada karkas tersembunyi.</p>
      <div className="simple-fields">
        <Field label="Bobot sapi" suffix="kg" step={1} value={state.liveWeight} onChange={(v) => setState(s => ({ ...s, liveWeight: v }))} />
        <Field label="Harga supplier sekarang" suffix="Rp/kg" step={500} value={state.livePrice} onChange={(v) => setState(s => ({ ...s, livePrice: v }))} />
        <Field label="Perkiraan karkas" suffix="%" step={0.1} value={state.dressingPct} onChange={(v) => setState(s => ({ ...s, dressingPct: v }))} />
        <Field label="Harga karkas" suffix="Rp/kg" step={500} value={state.carcassPrice} onChange={(v) => setState(s => ({ ...s, carcassPrice: v }))} />
        <Field label="Biaya tambahan" suffix="Rp/ekor" step={100000} value={state.additionalCostPerHead} onChange={(v) => setState(s => ({ ...s, additionalCostPerHead: v }))} />
        <Field label="Hasil sampingan" suffix="Rp/ekor" step={100000} value={state.byproductRevenuePerHead} onChange={(v) => setState(s => ({ ...s, byproductRevenuePerHead: v }))} />
        <Field label="Target keuntungan" suffix="Rp/ekor" step={100000} value={state.targetProfitPerHead} onChange={(v) => setState(s => ({ ...s, targetProfitPerHead: v }))} />
      </div>
    </section>
    <section className="simple-panel result-panel">
      <div className={`simple-hero-result ${gap >= 0 ? 'good' : 'danger'}`}>
        <span>HARGA BELI MAKSIMAL</span><strong>{money(r.maxLivePriceTarget)} / kg</strong>
        <b>{gap >= 0 ? `Harga supplier masih di bawah batas sebesar ${money(gap)}/kg` : `Harga supplier melewati batas sebesar ${money(Math.abs(gap))}/kg`}</b>
      </div>
      <div className="simple-result-grid">
        <ResultCard label="Harga supplier" value={`${money(r.x.livePrice)}/kg`} />
        <ResultCard label="Maksimal total pembelian / ekor" value={money(r.maxPurchaseCostTarget)} />
        <ResultCard label="Karkas proyeksi" value={kg(r.carcassWeight)} note={`${num(r.x.liveWeight,1)} kg × ${pct(r.x.dressingPct,1)}`} />
        <ResultCard label="Target keuntungan" value={money(r.x.targetProfitPerHead)} />
      </div>
      <Formula><b>Logika:</b> revenue karkas + hasil sampingan − biaya tambahan − target profit = maksimal uang untuk membeli sapi.</Formula>
    </section>
  </div>;
}

function TargetCalculator({ state, setState }) {
  const r = useMemo(() => calculateQuickCarcass(state), [state]);
  return <div className="simple-workspace">
    <section className="simple-panel">
      <h3>Cari target minimal</h3>
      <p className="simple-help">Pertanyaan yang dijawab: “Dengan harga sapi dan harga karkas ini, minimal harus keluar berapa persen karkas?”</p>
      <div className="simple-fields">
        <Field label="Bobot sapi" suffix="kg" step={1} value={state.liveWeight} onChange={(v) => setState(s => ({ ...s, liveWeight: v }))} />
        <Field label="Harga beli sapi" suffix="Rp/kg" step={500} value={state.livePrice} onChange={(v) => setState(s => ({ ...s, livePrice: v }))} />
        <Field label="Harga karkas" suffix="Rp/kg" step={500} value={state.carcassPrice} onChange={(v) => setState(s => ({ ...s, carcassPrice: v }))} />
        <Field label="Biaya tambahan" suffix="Rp/ekor" step={100000} value={state.additionalCostPerHead} onChange={(v) => setState(s => ({ ...s, additionalCostPerHead: v }))} />
        <Field label="Hasil sampingan" suffix="Rp/ekor" step={100000} value={state.byproductRevenuePerHead} onChange={(v) => setState(s => ({ ...s, byproductRevenuePerHead: v }))} />
        <Field label="Target keuntungan" suffix="Rp/ekor" step={100000} value={state.targetProfitPerHead} onChange={(v) => setState(s => ({ ...s, targetProfitPerHead: v }))} />
      </div>
    </section>
    <section className="simple-panel result-panel">
      {r.targetDressingFeasible ? <div className="simple-hero-result good">
        <span>MINIMAL KARKAS UNTUK TARGET</span><strong>{pct(r.requiredDressingTargetPct)}</strong><b>{kg(r.requiredCarcassWeightTarget)} karkas</b>
      </div> : <ImpossibleTarget requiredPct={r.requiredDressingTargetPct} />}
      <Formula><b>Rumus target:</b> (total beli + biaya + target profit − hasil sampingan) ÷ harga karkas ÷ bobot sapi.</Formula>
      <ScenarioGrid state={state} targetPct={r.requiredDressingTargetPct} feasible={r.targetDressingFeasible} />
      <div className="simple-result-grid">
        <ResultCard label="Minimal karkas untuk target" value={pct(r.requiredDressingTargetPct)} tone={r.targetDressingFeasible ? '' : 'danger'} />
        <ResultCard label="Minimal berat karkas" value={kg(r.requiredCarcassWeightTarget)} />
        <ResultCard label="Karkas break-even" value={pct(r.requiredDressingBreakEvenPct)} tone={r.breakEvenDressingFeasible ? '' : 'danger'} />
        <ResultCard label="Berat karkas break-even" value={kg(r.requiredCarcassWeightBreakEven)} />
      </div>
      <p className="simple-footnote">Tidak ada persentase karkas tersembunyi di halaman ini. Harga beli maksimal dan harga karkas minimal sengaja tidak ditampilkan karena keduanya membutuhkan asumsi % karkas tertentu.</p>
    </section>
  </div>;
}

export default function SimpleCalculator() {
  const [task, setTask] = useState('profit');
  const [professional, setProfessional] = useState(false);

  const [profitLiveState, setProfitLiveState] = useState({ ...quickLiveDefaults });
  const [profitCarcassState, setProfitCarcassState] = useState({ ...quickCarcassDefaults });
  const [carcassState, setCarcassState] = useState({ ...quickCarcassDefaults });
  const [buyState, setBuyState] = useState({ ...quickCarcassDefaults });
  const [targetState, setTargetState] = useState({ ...quickCarcassDefaults });

  if (professional) return <AppV3 initialMode="professional" onExit={() => setProfessional(false)} />;

  const tasks = [
    ['profit', '💰', 'Untung / Rugi', 'Saya mau tahu untung berapa.'],
    ['carcass', '🔪', 'Karkas', 'Saya mau hitung kg karkas dan skenarionya.'],
    ['buy', '🐂', 'Harga Beli Maksimal', 'Saya mau tahu batas harga beli sapi.'],
    ['target', '🎯', 'Target Minimal', 'Saya mau tahu minimal karkas harus berapa.'],
  ];

  const resetAll = () => {
    setProfitLiveState({ ...quickLiveDefaults });
    setProfitCarcassState({ ...quickCarcassDefaults });
    setCarcassState({ ...quickCarcassDefaults });
    setBuyState({ ...quickCarcassDefaults });
    setTargetState({ ...quickCarcassDefaults });
  };

  return <main className="simple-shell">
    <header className="simple-header">
      <div>
        <span className="simple-kicker">KALKULATOR EKONOMI SAPI</span>
        <h1>Hitung kasar. Cepat. Bisa dicek sendiri.</h1>
        <p>Masukkan angka yang Anda tahu. Tidak ada shrink, trim, finance, atau asumsi teknis tersembunyi di mode ini.</p>
      </div>
      <button className="simple-pro-link" onClick={() => setProfessional(true)}>Perhitungan Profesional →</button>
    </header>

    <nav className="simple-task-grid">
      {tasks.map(([key, icon, title, desc]) => <button key={key} className={task === key ? 'active' : ''} onClick={() => setTask(key)}>
        <span>{icon}</span><b>{title}</b><small>{desc}</small>
      </button>)}
    </nav>

    {task === 'profit' && <ProfitCalculator liveState={profitLiveState} setLiveState={setProfitLiveState} carcassState={profitCarcassState} setCarcassState={setProfitCarcassState} />}
    {task === 'carcass' && <CarcassCalculator state={carcassState} setState={setCarcassState} />}
    {task === 'buy' && <BuyCalculator state={buyState} setState={setBuyState} />}
    {task === 'target' && <TargetCalculator state={targetState} setState={setTargetState} />}

    <footer className="simple-footer">
      <span>Setiap kalkulator berdiri sendiri. Angka dari menu lain tidak memengaruhi hasil menu ini.</span>
      <button onClick={resetAll}>Reset semua angka</button>
    </footer>
  </main>;
}

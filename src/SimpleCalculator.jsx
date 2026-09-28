import React, { useMemo, useState } from 'react';
import AppV3 from './AppV3.jsx';
import {
  calculateQuickLive,
  calculateQuickCarcass,
  quickLiveDefaults,
  quickCarcassDefaults,
} from './lib/quickEngine.js';
import { buildDressingScenarioSteps } from './lib/scenario.js';

const money = (n) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
}).format(Number.isFinite(n) ? n : 0);

const num = (n, digits = 1) => new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: digits,
  maximumFractionDigits: digits,
}).format(Number.isFinite(n) ? n : 0);

const pct = (n, digits = 2) => `${num(n, digits)}%`;
const kg = (n, digits = 1) => `${num(n, digits)} kg`;

function Field({ label, value, step, suffix, onChange }) {
  return <label className="simple-field">
    <span>{label}</span>
    <div>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <b>{suffix}</b>
    </div>
  </label>;
}

function ResultCard({ label, value, note, tone = '' }) {
  return <div className={`simple-result ${tone}`}>
    <span>{label}</span>
    <strong>{value}</strong>
    {note && <small>{note}</small>}
  </div>;
}

function ScenarioGrid({ state, targetPct }) {
  const steps = buildDressingScenarioSteps(targetPct);
  return <div className="simple-scenarios">
    {steps.map((dp) => {
      const r = calculateQuickCarcass({ ...state, dressingPct: dp });
      const tone = r.profit < 0 ? 'bad' : r.profit >= r.x.targetProfitPerHead ? 'good' : 'mid';
      return <div key={dp} className={tone}>
        <span>{dp}%</span>
        <strong>{money(r.profit)}</strong>
        <small>{kg(r.carcassWeight)}</small>
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
          <span>UNTUNG / RUGI PER EKOR</span>
          <strong>{money(live.profit)}</strong>
          <b>{live.profit < 0 ? 'RUGI' : 'UNTUNG'}</b>
        </div>
        <div className="simple-result-grid">
          <ResultCard label="Harga beli sapi" value={money(live.purchaseCost)} />
          <ResultCard label="Nilai jual" value={money(live.saleRevenue)} />
          <ResultCard label="Total modal" value={money(live.totalCost)} />
          <ResultCard label="Untung seluruh lot" value={money(live.lotProfit)} tone={live.lotProfit < 0 ? 'danger' : 'good'} />
        </div>
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
          <span>UNTUNG / RUGI PER EKOR</span>
          <strong>{money(carcass.profit)}</strong>
          <b>{carcass.profit < 0 ? 'RUGI' : 'UNTUNG'}</b>
        </div>
        <div className="simple-result-grid">
          <ResultCard label="Berat karkas" value={kg(carcass.carcassWeight)} note={`${num(carcass.x.liveWeight,1)} kg × ${pct(carcass.x.dressingPct,1)}`} />
          <ResultCard label="Revenue karkas" value={money(carcass.carcassRevenue)} />
          <ResultCard label="Total revenue" value={money(carcass.totalRevenue)} />
          <ResultCard label="Untung seluruh lot" value={money(carcass.lotProfit)} tone={carcass.lotProfit < 0 ? 'danger' : 'good'} />
        </div>
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
        <span>BERAT KARKAS</span>
        <strong>{kg(r.carcassWeight)}</strong>
        <b>{num(r.x.liveWeight,1)} kg × {pct(r.x.dressingPct,1)}</b>
      </div>
      <h4>Skenario sekitar minimal target {pct(r.requiredDressingTargetPct)}</h4>
      <ScenarioGrid state={state} targetPct={r.requiredDressingTargetPct} />
      <div className="simple-result-grid">
        <ResultCard label="Minimal karkas target" value={pct(r.requiredDressingTargetPct)} />
        <ResultCard label="Minimal kg karkas" value={kg(r.requiredCarcassWeightTarget)} />
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
        <span>HARGA BELI MAKSIMAL</span>
        <strong>{money(r.maxLivePriceTarget)} / kg</strong>
        <b>{gap >= 0 ? `Masih ada ruang ${money(gap)}/kg` : `Terlalu mahal ${money(Math.abs(gap))}/kg`}</b>
      </div>
      <div className="simple-result-grid">
        <ResultCard label="Harga supplier" value={`${money(r.x.livePrice)}/kg`} />
        <ResultCard label="Maksimal total beli / ekor" value={money(r.maxPurchaseCostTarget)} />
        <ResultCard label="Karkas proyeksi" value={kg(r.carcassWeight)} />
        <ResultCard label="Target keuntungan" value={money(r.x.targetProfitPerHead)} />
      </div>
    </section>
  </div>;
}

function TargetCalculator({ state, setState }) {
  const r = useMemo(() => calculateQuickCarcass(state), [state]);
  return <div className="simple-workspace">
    <section className="simple-panel">
      <h3>Cari target minimal</h3>
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
      <div className="simple-hero-result good">
        <span>MINIMAL KARKAS UNTUK TARGET</span>
        <strong>{pct(r.requiredDressingTargetPct)}</strong>
        <b>{kg(r.requiredCarcassWeightTarget)} karkas</b>
      </div>
      <ScenarioGrid state={state} targetPct={r.requiredDressingTargetPct} />
      <div className="simple-result-grid">
        <ResultCard label="Harga karkas minimal" value={`${money(r.requiredCarcassPriceTarget)}/kg`} />
        <ResultCard label="Harga beli maksimal" value={`${money(r.maxLivePriceTarget)}/kg`} />
        <ResultCard label="Karkas break-even" value={pct(r.requiredDressingBreakEvenPct)} />
        <ResultCard label="Karkas kg break-even" value={kg(r.requiredCarcassWeightBreakEven)} />
      </div>
    </section>
  </div>;
}

export default function SimpleCalculator() {
  const [task, setTask] = useState('profit');
  const [professional, setProfessional] = useState(false);
  const [liveState, setLiveState] = useState({ ...quickLiveDefaults });
  const [carcassState, setCarcassState] = useState({ ...quickCarcassDefaults });

  if (professional) return <AppV3 initialMode="professional" onExit={() => setProfessional(false)} />;

  const tasks = [
    ['profit', '💰', 'Untung / Rugi', 'Saya mau tahu untung berapa.'],
    ['carcass', '🔪', 'Karkas', 'Saya mau hitung kg karkas dan skenarionya.'],
    ['buy', '🐂', 'Harga Beli Maksimal', 'Saya mau tahu batas harga beli sapi.'],
    ['target', '🎯', 'Target Minimal', 'Saya mau tahu minimal karkas dan harga target.'],
  ];

  return <main className="simple-shell">
    <header className="simple-header">
      <div>
        <span className="simple-kicker">KALKULATOR EKONOMI SAPI</span>
        <h1>Hitung kasar. Cepat. Jelas.</h1>
        <p>Masukkan angka yang Anda tahu. Tidak ada shrink, trim, finance, atau asumsi teknis tersembunyi di mode ini.</p>
      </div>
      <button className="simple-pro-link" onClick={() => setProfessional(true)}>Perhitungan Profesional →</button>
    </header>

    <nav className="simple-task-grid">
      {tasks.map(([key, icon, title, desc]) => <button
        key={key}
        className={task === key ? 'active' : ''}
        onClick={() => setTask(key)}
      >
        <span>{icon}</span><b>{title}</b><small>{desc}</small>
      </button>)}
    </nav>

    {task === 'profit' && <ProfitCalculator
      liveState={liveState}
      setLiveState={setLiveState}
      carcassState={carcassState}
      setCarcassState={setCarcassState}
    />}
    {task === 'carcass' && <CarcassCalculator state={carcassState} setState={setCarcassState} />}
    {task === 'buy' && <BuyCalculator state={carcassState} setState={setCarcassState} />}
    {task === 'target' && <TargetCalculator state={carcassState} setState={setCarcassState} />}

    <footer className="simple-footer">
      <span>Mode kasar memakai angka yang Anda masukkan secara langsung.</span>
      <button onClick={() => {
        setLiveState({ ...quickLiveDefaults });
        setCarcassState({ ...quickCarcassDefaults });
      }}>Reset semua angka</button>
    </footer>
  </main>;
}

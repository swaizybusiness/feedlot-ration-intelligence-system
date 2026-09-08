import React, { useMemo, useState } from 'react';
import {
  buildIntegratedSensitivity,
  buildJagalBidTable,
  calculateIntegrated,
  calculateJagal,
  integratedDefaults,
  jagalDefaults,
} from './lib/engine.js';
import {
  calculateQuickCarcass,
  calculateQuickLive,
  quickCarcassDefaults,
  quickLiveDefaults,
} from './lib/quickEngine.js';
import { buildDressingScenarioSteps } from './lib/scenario.js';

const money = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number.isFinite(n) ? n : 0);
const num = (n, digits = 2) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number.isFinite(n) ? n : 0);
const percent = (n, digits = 2) => `${num(n, digits)}%`;
const kg = (n, digits = 1) => `${num(n, digits)} kg`;

const inputSections = [
  { title: 'Procurement & Receiving', fields: [
    ['heads', 'Jumlah sapi / lot', 1], ['purchaseWeight', 'Bobot beli (kg)', 1], ['purchasePrice', 'Harga beli (Rp/kg)', 500],
    ['arrivalShrinkPct', 'Arrival shrink (%)', 0.1], ['freightPerHead', 'Freight / head', 50000], ['commissionPerHead', 'Commission / head', 50000],
    ['mortalityPct', 'Mortality (%)', 0.1], ['deathTimingPct', 'Timing kematian (% DOF)', 1],
  ]},
  { title: 'Growth, Feed & Cost', fields: [
    ['daysOnFeed', 'Days on feed', 1], ['adg', 'ADG (kg/hari)', 0.01], ['asFedIntake', 'As-fed intake (kg/hari)', 0.1],
    ['dryMatterPct', 'Dry matter ration (%)', 0.1], ['feedWastePct', 'Feed wastage (%)', 0.1], ['rationPrice', 'Harga ration (Rp/kg)', 100],
    ['healthPerAnimalDay', 'Health / animal-day', 500], ['laborPerAnimalDay', 'Labor / animal-day', 500], ['yardagePerAnimalDay', 'Yardage / animal-day', 500],
    ['fixedOverheadPerInitialHead', 'Fixed overhead / head', 50000], ['otherProductionCostPerInitialHead', 'Other production cost', 50000],
    ['annualInterestPct', 'Cost of capital (% p.a.)', 0.1], ['operatingCapitalExposurePct', 'Operating exposure (%)', 1],
  ]},
  { title: 'Carcass, Slaughter & Meat', fields: [
    ['preSlaughterShrinkPct', 'Pre-slaughter shrink (%)', 0.1], ['dressingPct', 'Gross dressing (%)', 0.1], ['entryDressingPct', 'Entry dressing est. (%)', 0.1],
    ['trimPct', 'Trim / condemnation (%)', 0.1], ['carcassPrice', 'Harga karkas (Rp/kg net HCW)', 500], ['slaughterCostPerSoldHead', 'Slaughter + outbound / sold head', 50000],
    ['byproductRevenuePerSoldHead', 'By-product / sold head', 50000], ['coolerShrinkPct', 'Cooler shrink (%)', 0.1], ['boningYieldPct', 'Boning yield (%)', 0.1],
    ['blendedMeatPrice', 'Blended meat price (Rp/kg)', 1000], ['processingCostPerSoldHead', 'Processing / sold head', 50000],
    ['targetProfitPerInitialHead', 'Target profit / initial head', 100000], ['targetMarginPct', 'Target margin (%)', 0.1], ['targetRoiPct', 'Target ROI (%)', 0.1],
  ]},
];

const jagalSections = [
  { title: 'Pembelian Sapi', fields: [
    ['heads', 'Jumlah ekor', 1], ['liveWeight', 'Bobot hidup (kg)', 1], ['livePrice', 'Harga beli hidup (Rp/kg)', 500],
    ['purchaseBasisShrinkPct', 'Shrink basis pembelian (%)', 0.1], ['preSlaughterShrinkPct', 'Pre-slaughter shrink (%)', 0.1],
    ['inboundPerHead', 'Inbound / head', 50000], ['holdingPerHead', 'Holding / head', 50000],
  ]},
  { title: 'Karkas & Penjagalan', fields: [
    ['dressingPct', 'Gross dressing (%)', 0.1], ['trimPct', 'Trim / condemnation (%)', 0.1], ['carcassPrice', 'Harga jual karkas (Rp/kg)', 500],
    ['slaughterCostPerHead', 'Biaya potong / head', 50000], ['overheadPerHead', 'Labor + overhead / head', 50000], ['byproductRevenuePerHead', 'By-product / head', 50000],
  ]},
  { title: 'Meat & Target', fields: [
    ['coolerShrinkPct', 'Cooler shrink (%)', 0.1], ['boningYieldPct', 'Boning yield (%)', 0.1], ['blendedMeatPrice', 'Blended meat price (Rp/kg)', 1000],
    ['processingCostPerHead', 'Deboning/packing / head', 50000], ['targetProfitPerHead', 'Target profit / head', 100000], ['targetMarginPct', 'Target margin (%)', 0.1], ['targetRoiPct', 'Target ROI (%)', 0.1],
  ]},
];

const liveQuickFields = [
  ['purchaseWeight', 'Bobot beli', 'kg', 1], ['purchasePrice', 'Harga beli', 'Rp/kg', 500],
  ['saleWeight', 'Bobot jual', 'kg', 1], ['salePrice', 'Harga jual', 'Rp/kg', 500],
  ['additionalCostPerHead', 'Total biaya tambahan', 'Rp/ekor', 100000], ['targetProfitPerHead', 'Target keuntungan', 'Rp/ekor', 100000],
  ['heads', 'Jumlah ekor', 'ekor', 1],
];

const carcassQuickFields = [
  ['liveWeight', 'Bobot sapi', 'kg', 1], ['livePrice', 'Harga beli sapi', 'Rp/kg', 500],
  ['dressingPct', 'Persentase karkas', '%', 0.1], ['carcassPrice', 'Harga jual karkas', 'Rp/kg', 500],
  ['additionalCostPerHead', 'Total biaya jagal/lainnya', 'Rp/ekor', 100000], ['byproductRevenuePerHead', 'Hasil sampingan', 'Rp/ekor', 100000],
  ['targetProfitPerHead', 'Target keuntungan', 'Rp/ekor', 100000], ['heads', 'Jumlah ekor', 'ekor', 1],
];

function NumberField({ label, value, step, onChange, suffix }) {
  return <label className="field"><span>{label}</span><div className="input-with-suffix"><input type="number" value={value} step={step} onChange={(e) => onChange(Number(e.target.value))} />{suffix && <b>{suffix}</b>}</div></label>;
}
function Kpi({ label, value, tone = '' }) { return <div className={`kpi ${tone}`}><span>{label}</span><strong>{value}</strong></div>; }
function DataRows({ rows }) { return <div className="data-rows">{rows.map(([label, value]) => <div className="data-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>; }
function Verdict({ profit, target, detail, title }) {
  const tone = profit < 0 ? 'danger' : profit >= target ? 'good' : 'warning';
  return <div className={`verdict ${tone}`}><span>Decision Engine</span><strong>{title}</strong><p>{detail}</p></div>;
}

function ModeHome({ onChoose }) {
  return <div className="mode-home"><div className="mode-intro"><span className="eyebrow">PILIH CARA MENGHITUNG</span><h1>Sederhana kalau perlu. Detail kalau dibutuhkan.</h1><p>Mode Cepat memakai hitungan transparan tanpa asumsi tersembunyi. Mode Profesional membuka seluruh model feedlot, karkas, RPH, meat yield, finance, dan audit.</p></div><div className="mode-cards">
    <button className="mode-card quick-card" onClick={() => onChoose('quick')}><span className="mode-icon">⚡</span><b>Hitung Cepat</b><p>Untuk orang yang hanya ingin mengetahui untung/rugi, batas harga beli, minimal karkas, dan target harga.</p><em>Hanya variabel yang Anda masukkan</em></button>
    <button className="mode-card pro-card" onClick={() => onChoose('professional')}><span className="mode-icon">🧠</span><b>Analisis Profesional</b><p>Untuk procurement, ADG, DMI, FCR, COG, mortality, shrink, karkas, jagal, meat yield, sensitivity, dan formula audit.</p><em>Full enterprise calculation</em></button>
  </div></div>;
}

function QuickMode({ liveState, setLiveState, carcassState, setCarcassState, onProfessional }) {
  const [task, setTask] = useState('profit');
  const [channel, setChannel] = useState('live');
  const live = useMemo(() => calculateQuickLive(liveState), [liveState]);
  const carcass = useMemo(() => calculateQuickCarcass(carcassState), [carcassState]);
  const activeChannel = task === 'jagal' ? 'carcass' : channel;
  const fields = activeChannel === 'live' ? liveQuickFields : carcassQuickFields;
  const state = activeChannel === 'live' ? liveState : carcassState;
  const setState = activeChannel === 'live' ? setLiveState : setCarcassState;
  const scenarioDps = buildDressingScenarioSteps(carcass.requiredDressingTargetPct);
  const scenarios = scenarioDps.map((dp) => ({ dp, result: calculateQuickCarcass({ ...carcassState, dressingPct: dp }) }));

  const reset = () => activeChannel === 'live' ? setLiveState({ ...quickLiveDefaults }) : setCarcassState({ ...quickCarcassDefaults });
  const tasks = [
    ['profit','💰','Hitung Untung','Untung/rugi berapa?'], ['buy','🐂','Beli Sapi','Harga beli maksimal?'],
    ['jagal','🔪','Jagal / Karkas','Harus keluar berapa %?'], ['target','🎯','Target Harga','Harga jual minimal?'],
  ];

  return <>
    <div className="quick-header"><div><span className="eyebrow">⚡ MODE CEPAT · V0.3.1</span><h1>Hitung sesuai kenyataan yang Anda masukkan.</h1><p>Tidak ada shrink, trim, finance, atau overhead tersembunyi. Jika Anda ingin faktor itu dihitung, pindah ke Analisis Profesional.</p></div><button className="ghost-btn" onClick={onProfessional}>Buka Analisis Profesional →</button></div>
    <div className="quick-task-grid">{tasks.map(([key,icon,title,desc]) => <button key={key} className={`quick-task ${task === key ? 'active' : ''}`} onClick={() => { setTask(key); if (key === 'jagal') setChannel('carcass'); }}><span>{icon}</span><b>{title}</b><small>{desc}</small></button>)}</div>

    {task !== 'jagal' && <nav className="tabs" aria-label="Basis penjualan"><button className={channel === 'live' ? 'active' : ''} onClick={() => setChannel('live')}>🐂 Jual Sapi Hidup</button><button className={channel === 'carcass' ? 'active' : ''} onClick={() => setChannel('carcass')}>🔪 Jual Karkas</button></nav>}

    <div className="quick-layout"><section className="panel quick-input-panel"><div className="section-heading"><div><h3>{activeChannel === 'live' ? 'Sapi Hidup' : 'Jagal / Karkas'}</h3><p className="muted">Semua angka di hasil berasal langsung dari input di bawah.</p></div><button className="mini-btn" onClick={reset}>Reset</button></div><div className="quick-field-grid">{fields.map(([key,label,suffix,step]) => <NumberField key={key} label={label} suffix={suffix} step={step} value={state[key]} onChange={(value) => setState((s) => ({ ...s, [key]: value }))} />)}</div></section>

      <section className="panel quick-result-panel">
        {task === 'profit' && activeChannel === 'live' && <><div className={`profit-hero ${live.profit < 0 ? 'danger' : live.profit >= live.x.targetProfitPerHead ? 'good' : 'warning'}`}><span>KEUNTUNGAN JUAL HIDUP</span><strong>{money(live.profit)} / ekor</strong><b>{live.profit < 0 ? 'RUGI' : live.profit >= live.x.targetProfitPerHead ? 'TARGET TERCAPAI' : 'UNTUNG, DI BAWAH TARGET'}</b></div><div className="kpi-grid quick-kpis"><Kpi label="Harga beli" value={money(live.purchaseCost)} /><Kpi label="Nilai jual" value={money(live.saleRevenue)} /><Kpi label="Total modal" value={money(live.totalCost)} /><Kpi label="Profit lot" value={money(live.lotProfit)} /></div><DataRows rows={[["Margin penjualan",percent(live.marginPct)],["Return terhadap modal",percent(live.returnOnCostPct)],["Harga jual untuk target",`${money(live.targetSalePrice)}/kg`],["Harga beli maksimal",`${money(live.maxPurchasePriceTarget)}/kg`]]} /></>}
        {task === 'profit' && activeChannel === 'carcass' && <><div className={`profit-hero ${carcass.profit < 0 ? 'danger' : carcass.profit >= carcass.x.targetProfitPerHead ? 'good' : 'warning'}`}><span>KEUNTUNGAN JUAL KARKAS</span><strong>{money(carcass.profit)} / ekor</strong><b>{carcass.profit < 0 ? 'RUGI' : carcass.profit >= carcass.x.targetProfitPerHead ? 'TARGET TERCAPAI' : 'UNTUNG, DI BAWH TARGET'}</b></div><div className="kpi-grid quick-kpis"><Kpi label="Harga beli" value={money(carcass.purchaseCost)} /><Kpi label="Karkas" value={kg(carcass.carcassWeight)} /><Kpi label="Total revenue" value={money(carcass.totalRevenue)} /><Kpi label="Profit lot" value={money(carcass.lotProfit)} /></div><DataRows rows={[["Margin penjualan",percent(carcass.marginPct)],["Return terhadap modal",percent(carcass.returnOnCostPct)],["Minimal karkas untuk target",percent(carcass.requiredDressingTargetPct)],["Harga beli maksimal",`${money(carcass.maxLivePriceTarget)}/kg`]]} /></>}

        {task === 'buy' && activeChannel === 'live' && <><div className={`profit-hero ${live.maxPurchasePriceTarget >= live.x.purchasePrice ? 'good' : 'danger'}`}><span>HARGA BELI MAKSIMAL</span><strong>{money(live.maxPurchasePriceTarget)} / kg</strong><b>{live.maxPurchasePriceTarget >= live.x.purchasePrice ? 'MASIH LAYAK PADA TARGET SAAT INI' : 'HARGA BELI TERLALU TINGGI'}</b></div><DataRows rows={[["Harga beli sekarang",`${money(live.x.purchasePrice)}/kg`],["Maksimal total beli / ekor",money(live.maxPurchaseCostTarget)],["Nilai jual proyeksi",money(live.saleRevenue)],["Biaya tambahan",money(live.x.additionalCostPerHead)],["Target profit",money(live.x.targetProfitPerHead)]]} /></>}
        {task === 'buy' && activeChannel === 'carcass' && <><div className={`profit-hero ${carcass.maxLivePriceTarget >= carcass.x.livePrice ? 'good' : 'danger'}`}><span>HARGA BELI MAKSIMAL</span><strong>{money(carcass.maxLivePriceTarget)} / kg hidup</strong><b>{carcass.maxLivePriceTarget >= carcass.x.livePrice ? 'MASIH LAYAK PADA TARGET SAAT INI' : 'HARGA BELI TERLALU TINGGI'}</b></div><DataRows rows={[["Harga beli sekarang",`${money(carcass.x.livePrice)}/kg`],["Maksimal total beli / ekor",money(carcass.maxPurchaseCostTarget)],["Karkas proyeksi",kg(carcass.carcassWeight)],["Revenue total",money(carcass.totalRevenue)],["Target profit",money(carcass.x.targetProfitPerHead)]]} /></>}

        {task === 'jagal' && <><div className={`profit-hero ${carcass.x.dressingPct >= carcass.requiredDressingTargetPct ? 'good' : 'warning'}`}><span>MINIMAL KARKAS UNTUK TARGET</span><strong>{percent(carcass.requiredDressingTargetPct)}</strong><b>{kg(carcass.requiredCarcassWeightTarget)} KARKAS</b></div><div className="scenario-strip">{scenarios.map(({dp,result}) => <div key={dp} className={result.profit < 0 ? 'bad' : result.profit >= carcassState.targetProfitPerHead ? 'good' : 'mid'}><span>{dp}%</span><strong>{money(result.profit)}</strong><small>{kg(result.carcassWeight)}</small></div>)}</div><DataRows rows={[["Rumus karkas",`${num(carcass.x.liveWeight,1)} kg × ${percent(carcass.x.dressingPct)} = ${kg(carcass.carcassWeight)}`],["Break-even karkas",percent(carcass.requiredDressingBreakEvenPct)],["Target karkas",percent(carcass.requiredDressingTargetPct)],["Harga karkas target",`${money(carcass.requiredCarcassPriceTarget)}/kg`]]} /></>}

        {task === 'target' && activeChannel === 'live' && <><div className="target-grid"><Kpi label="Harga jual minimal target" value={`${money(live.targetSalePrice)}/kg`} /><Kpi label="Harga beli maksimal" value={`${money(live.maxPurchasePriceTarget)}/kg`} /><Kpi label="Bobot jual target" value={kg(live.targetSaleWeight)} /><Kpi label="Harga jual BEP" value={`${money(live.breakEvenSalePrice)}/kg`} /></div><DataRows rows={[["Total modal",money(live.totalCost)],["Target profit",money(live.x.targetProfitPerHead)],["Bobot jual BEP",kg(live.breakEvenSaleWeight)],["Profit sekarang",money(live.profit)]]} /></>}
        {task === 'target' && activeChannel === 'carcass' && <><div className="target-grid"><Kpi label="Harga karkas minimal" value={`${money(carcass.requiredCarcassPriceTarget)}/kg`} /><Kpi label="Harga sapi maksimal" value={`${money(carcass.maxLivePriceTarget)}/kg`} /><Kpi label="Minimal dressing" value={percent(carcass.requiredDressingTargetPct)} /><Kpi label="Minimal karkas" value={kg(carcass.requiredCarcassWeightTarget)} /></div><DataRows rows={[["Harga karkas BEP",`${money(carcass.requiredCarcassPriceBreakEven)}/kg`],["Karkas BEP",kg(carcass.requiredCarcassWeightBreakEven)],["Hasil sampingan minimum",money(carcass.requiredByproductTarget)],["Profit sekarang",money(carcass.profit)]]} /></>}

        <button className="detail-link" onClick={onProfessional}>Butuh shrink, trim, feedlot, financing, cooler loss, atau meat yield? Buka Analisis Profesional →</button>
      </section></div>
  </>;
}

function IntegratedDashboard({ r }) {
  const decision = r.carcassProfitPerInitialHead < 0 ? ['ECONOMIC LOSS', `Break-even membutuhkan dressing ${percent(r.requiredDressingBreakEvenPct)} atau harga karkas ${money(r.requiredCarcassPriceBreakEven)}/kg.`] : r.carcassProfitPerInitialHead >= r.x.targetProfitPerInitialHead ? ['TARGET PROFIT TERCAPAI', `Bid ceiling sapi sekitar ${money(r.maxPurchasePriceTarget)}/kg. Marginal spread harian ${money(r.marginalSpreadPerAdditionalDay)}.`] : ['PROFITABLE — BELOW TARGET', `Target membutuhkan dressing ${percent(r.requiredDressingTargetPct)}, net HCW ${kg(r.requiredNetHCWTarget)}, atau harga karkas ${money(r.requiredCarcassPriceTarget)}/kg.`];
  return <><div className="kpi-grid"><Kpi label="Arrival BW" value={kg(r.arrivalWeight)} /><Kpi label="Final Feedlot BW" value={kg(r.finalFeedlotWeight)} /><Kpi label="Slaughter BW" value={kg(r.slaughterLiveWeight)} /><Kpi label="Net HCW" value={kg(r.netHCW)} /><Kpi label="FCR DM" value={num(r.fcrDM)} /><Kpi label="All-in COG" value={`${money(r.allInFinishingCOG)}/kg`} /><Kpi label="Profit / initial head" value={money(r.carcassProfitPerInitialHead)} tone={r.carcassProfitPerInitialHead >= r.x.targetProfitPerInitialHead ? 'good' : r.carcassProfitPerInitialHead < 0 ? 'danger' : 'warning'} /><Kpi label="ROI / cycle" value={percent(r.carcassRoiPct)} /></div><div className="two-col"><section className="panel"><h3>Production & Feed</h3><DataRows rows={[["Live gain",kg(r.liveGain)],["ADG",`${num(r.x.adg)} kg/hari`],["DOF",`${num(r.x.daysOnFeed,0)} hari`],["Expected sold heads",num(r.expectedSoldHeads,1)],["DMI / day",`${num(r.dmiPerDay)} kg DM`],["DMI % average BW",percent(r.dmiPctAverageBW)],["Feed cost / day",money(r.feedCostPerDay)],["Feed COG",`${money(r.feedCostOfGain)}/kg gain`],["Carcass ADG",`${num(r.carcassADG,3)} kg/hari`]]} /></section><section className="panel"><h3>Economics</h3><DataRows rows={[["Purchase animal",money(r.purchaseAnimalCost)],["Landed purchase",money(r.landedPurchaseCost)],["Feed / initial head",money(r.feedCostPerInitialHead)],["Financing / head",money(r.financingCostPerInitialHead)],["All-in cost / head",money(r.allInCostPerInitialHead)],["Revenue / initial head",money(r.expectedRevenuePerInitialHead)],["Profit / sold head",money(r.carcassProfitPerSoldHead)],["Margin",percent(r.carcassMarginPct)],["Lot projected profit",money(r.lotCarcassProfit)]]} /></section></div><Verdict profit={r.carcassProfitPerInitialHead} target={r.x.targetProfitPerInitialHead} title={decision[0]} detail={decision[1]} /></>;
}

function ReverseSolver({ r }) {
  const cards = [['Dressing BE',percent(r.requiredDressingBreakEvenPct)],['Dressing target profit',percent(r.requiredDressingTargetPct)],['Dressing target margin',percent(r.requiredDressingMarginPct)],['Dressing target ROI',percent(r.requiredDressingRoiPct)],['Net HCW BE',kg(r.requiredNetHCWBreakEven)],['Net HCW target',kg(r.requiredNetHCWTarget)],['Harga karkas BE',`${money(r.requiredCarcassPriceBreakEven)}/kg`],['Harga karkas target',`${money(r.requiredCarcassPriceTarget)}/kg`],['Final BW target',kg(r.requiredFinalFeedlotWeightTarget)],['ADG target',`${num(r.requiredAdgTarget,3)} kg/hari`],['Max harga beli',`${money(r.maxPurchasePriceTarget)}/kg`],['Max ration price',`${money(r.maxRationPriceTarget)}/kg`],['Min by-product target',money(r.requiredByproductTarget)],['Meat price target',`${money(r.requiredMeatPriceTarget)}/kg`]];
  return <><section className="panel"><h3>Reverse Solver — “Kalau X segini, Y harus berapa?”</h3><p className="muted">Solver profesional memasukkan mortality, shrink, trim, financing, cost, dan by-product.</p><div className="kpi-grid compact">{cards.map(([l,v]) => <Kpi key={l} label={l} value={v} />)}</div></section><div className="two-col"><section className="panel"><h3>Value of Improvement</h3><DataRows rows={[["+0,1 point dressing",money(r.valuePerTenthPointDressing)],["+1,0 point dressing",money(r.valuePerPointDressing)],["+1 kg final live",money(r.valuePerKgFinalLive)],["+1 kg net HCW",money(r.valuePerKgNetHCW)],["+1 point boning yield",money(r.valuePerPointBoningYield)],["Marginal spread / extra day",money(r.marginalSpreadPerAdditionalDay)]]} /></section><section className="panel"><h3>Economic Leakage</h3><DataRows rows={[["Mortality impact",money(r.mortalityEconomicImpact)],["Arrival shrink impact",money(r.arrivalShrinkEconomicImpact)],["Pre-slaughter shrink impact",money(r.preSlaughterShrinkEconomicImpact)],["Trim impact",money(r.trimEconomicImpact)],["Feed wastage impact",money(r.feedWasteEconomicImpact)],["Cooler revenue impact",money(r.coolerShrinkRevenueImpact)]]} /></section></div></>;
}

function CarcassMeat({ r }) { return <div className="two-col"><section className="panel"><h3>Carcass Conversion</h3><DataRows rows={[["Slaughter live BW",kg(r.slaughterLiveWeight)],["Gross dressing",percent(r.x.dressingPct)],["Gross HCW",kg(r.grossHCW)],["Trim / condemnation",kg(r.trimKg)],["Net HCW",kg(r.netHCW)],["Effective net dressing",percent(r.effectiveNetDressingPct)],["Cold carcass",kg(r.coldCarcassWeight)],["Carcass gain",kg(r.carcassGain)],["Cost / kg net HCW",`${money(r.costPerKgNetHCW)}/kg`]]} /></section><section className="panel"><h3>Meat Yield Economics</h3><DataRows rows={[["Boning yield",percent(r.x.boningYieldPct)],["Saleable meat / sold head",kg(r.saleableMeatWeight)],["Live-to-meat yield",percent(r.liveToMeatYieldPct)],["Lot saleable meat",kg(r.lotSaleableMeat,0)],["Meat revenue / initial head",money(r.meatRevenuePerInitialHead)],["Meat cost / initial head",money(r.meatCostPerInitialHead)],["Meat profit / initial head",money(r.meatProfitPerInitialHead)],["Meat margin",percent(r.meatMarginPct)],["Cost / kg saleable meat",`${money(r.costPerKgSaleableMeat)}/kg`]]} /></section></div>; }

function JagalModule({ state, setState }) {
  const r = useMemo(() => calculateJagal(state), [state]);
  const bidTable = useMemo(() => buildJagalBidTable(state, [50,52,54,56,58,60]), [state]);
  const decision = r.carcassProfit < 0 ? ['JANGAN BELI PADA KONDISI INI', `Break-even dressing ${percent(r.requiredDressingBreakEvenPct)} atau harga karkas ${money(r.requiredCarcassPriceBreakEven)}/kg.`] : r.carcassProfit >= r.x.targetProfitPerHead ? ['TARGET JAGAL TERCAPAI', `Harga beli maksimal sekitar ${money(r.maxLivePriceTarget)}/kg hidup.`] : ['UNTUNG, TAPI DI BAWAH TARGET', `Butuh dressing ${percent(r.requiredDressingTargetPct)}, harga karkas ${money(r.requiredCarcassPriceTarget)}/kg, atau harga beli maksimal ${money(r.maxLivePriceTarget)}/kg.`];
  return <><div className="input-stack">{jagalSections.map((section) => <details open key={section.title}><summary>{section.title}</summary><div className="field-grid">{section.fields.map(([key,label,step]) => <NumberField key={key} label={label} step={step} value={state[key]} onChange={(value) => setState((s) => ({...s,[key]:value}))} />)}</div></details>)}</div><div className="toolbar"><button onClick={() => setState({...jagalDefaults})}>Reset Jagal</button></div><div className="kpi-grid"><Kpi label="Purchase cost / head" value={money(r.purchaseCost)} /><Kpi label="Net HCW" value={kg(r.netHCW)} /><Kpi label="Profit / head" value={money(r.carcassProfit)} tone={r.carcassProfit >= r.x.targetProfitPerHead ? 'good' : r.carcassProfit < 0 ? 'danger' : 'warning'} /><Kpi label="Margin" value={percent(r.carcassMarginPct)} /><Kpi label="Dressing target" value={percent(r.requiredDressingTargetPct)} /><Kpi label="Carcass price target" value={`${money(r.requiredCarcassPriceTarget)}/kg`} /><Kpi label="Max live buy price" value={`${money(r.maxLivePriceTarget)}/kg`} /><Kpi label="HCW target" value={kg(r.requiredNetHCWTarget)} /></div><div className="two-col"><section className="panel"><h3>Reverse Solver Jagal</h3><DataRows rows={[["Dressing BE",percent(r.requiredDressingBreakEvenPct)],["Dressing target profit",percent(r.requiredDressingTargetPct)],["Dressing target margin",percent(r.requiredDressingMarginPct)],["Harga karkas BE",`${money(r.requiredCarcassPriceBreakEven)}/kg`],["Harga karkas target",`${money(r.requiredCarcassPriceTarget)}/kg`],["Max purchase cost",money(r.maxPurchaseCostTarget)],["Max live price",`${money(r.maxLivePriceTarget)}/kg`],["Required live BW",kg(r.requiredLiveWeightBeforeShrinkTarget)],["Required by-product",money(r.requiredByproductTarget)]]} /></section><section className="panel"><h3>Jagal P&L & Yield</h3><DataRows rows={[["Slaughter BW",kg(r.slaughterLiveWeight)],["Gross HCW",kg(r.grossHCW)],["Trim kg",kg(r.trimKg)],["Net HCW",kg(r.netHCW)],["Effective net dressing",percent(r.effectiveNetDressingPct)],["Cold carcass",kg(r.coldCarcass)],["Saleable meat",kg(r.saleableMeat)],["Total cost",money(r.totalCost)],["Carcass revenue",money(r.carcassRevenue)],["Total revenue",money(r.totalCarcassRevenue)],["Lot profit",money(r.lotProfit)]]} /></section></div><section className="panel"><h3>Purchase Bid Ceiling by Expected Dressing</h3><div className="table-wrap"><table><thead><tr><th>Expected DP</th><th>Net HCW</th><th>Max buy Rp/kg</th><th>Profit at current buy</th></tr></thead><tbody>{bidTable.map((row) => <tr key={row.dressingPct}><td>{percent(row.dressingPct,1)}</td><td>{kg(row.netHCW)}</td><td>{money(row.maxLivePriceTarget)}</td><td>{money(row.carcassProfitAtCurrentBuy)}</td></tr>)}</tbody></table></div></section><Verdict profit={r.carcassProfit} target={r.x.targetProfitPerHead} title={decision[0]} detail={decision[1]} /></>;
}

function Sensitivity({ state, r }) {
  const dps = [r.x.dressingPct-3,r.x.dressingPct-2,r.x.dressingPct-1,r.x.dressingPct,r.x.dressingPct+1,r.x.dressingPct+2,r.x.dressingPct+3];
  const prices = [r.x.carcassPrice-15000,r.x.carcassPrice-10000,r.x.carcassPrice-5000,r.x.carcassPrice,r.x.carcassPrice+5000,r.x.carcassPrice+10000,r.x.carcassPrice+15000].map((x) => Math.max(0,x));
  const matrix = useMemo(() => buildIntegratedSensitivity(state,{dressingSteps:dps,carcassPriceSteps:prices}), [state]);
  return <section className="panel"><h3>Profit Sensitivity — Dressing × Harga Karkas</h3><div className="table-wrap"><table><thead><tr><th>DP \ Harga</th>{prices.map((p) => <th key={p}>{money(p)}</th>)}</tr></thead><tbody>{matrix.map((row) => <tr key={row.dressingPct}><th>{percent(row.dressingPct,1)}</th>{row.cells.map((cell) => <td key={cell.carcassPrice} className={cell.result.carcassProfitPerInitialHead < 0 ? 'cell-danger' : cell.result.carcassProfitPerInitialHead >= state.targetProfitPerInitialHead ? 'cell-good' : ''}>{money(cell.result.carcassProfitPerInitialHead)}</td>)}</tr>)}</tbody></table></div></section>;
}

function FormulaAudit({ r }) {
  const rows = [['Arrival BW','Purchase BW × (1 − arrival shrink)',kg(r.arrivalWeight)],['Final Feedlot BW','Arrival BW + ADG × DOF',kg(r.finalFeedlotWeight)],['Slaughter BW','Final Feedlot BW × (1 − pre-slaughter shrink)',kg(r.slaughterLiveWeight)],['DMI/day','As-fed intake × dry matter %',`${num(r.dmiPerDay)} kg DM`],['FCR DM','Expected DMI ÷ surviving live gain',num(r.fcrDM)],['Gross HCW','Slaughter BW × gross dressing %',kg(r.grossHCW)],['Net HCW','Gross HCW × (1 − trim %)',kg(r.netHCW)],['Cold carcass','Net HCW × (1 − cooler shrink %)',kg(r.coldCarcassWeight)],['Saleable meat','Cold carcass × boning yield %',kg(r.saleableMeatWeight)],['Profit/head','Expected revenue − all-in expected cost',money(r.carcassProfitPerInitialHead)],['Required dressing','Required gross HCW ÷ slaughter BW',percent(r.requiredDressingTargetPct)],['Max purchase price','Binary solve purchase price where profit = target',`${money(r.maxPurchasePriceTarget)}/kg`]];
  return <section className="panel"><h3>Formula Audit Trail</h3><p className="muted">Definisi resmi lintas procurement, feedlot, finance, dan RPH.</p><div className="table-wrap"><table><thead><tr><th>Metric</th><th>Formula / basis</th><th>Current result</th></tr></thead><tbody>{rows.map((x) => <tr key={x[0]}><td><strong>{x[0]}</strong></td><td>{x[1]}</td><td>{x[2]}</td></tr>)}</tbody></table></div></section>;
}

function ProfessionalMode({ state, setState, jagalState, setJagalState, onQuick }) {
  const [tab, setTab] = useState('dashboard');
  const r = useMemo(() => calculateIntegrated(state), [state]);
  const tabs = [['dashboard','Executive'],['reverse','Reverse Solver'],['carcass','Carcass & Meat'],['jagal','Jagal / RPH'],['sensitivity','Sensitivity'],['audit','Formula Audit']];
  return <><header className="hero"><div><span className="eyebrow">🧠 ANALISIS PROFESIONAL · V0.3</span><h1>Feedlot → Carcass → Jagal → Meat</h1><p>Full enterprise engine untuk analisis biologis, produksi, karkas, penjagalan, finance, sensitivity dan audit.</p></div><div className="hero-actions"><button className="ghost-btn" onClick={onQuick}>← Mode Cepat</button><div className="hero-metrics"><div><span>Projected Lot Profit</span><strong>{money(r.lotCarcassProfit)}</strong></div><div><span>Target Dressing</span><strong>{percent(r.requiredDressingTargetPct)}</strong></div></div></div></header><section className="input-stack">{inputSections.map((section,index) => <details open={index === 0} key={section.title}><summary>{section.title}</summary><div className="field-grid">{section.fields.map(([key,label,step]) => <NumberField key={key} label={label} step={step} value={state[key]} onChange={(value) => setState((s) => ({...s,[key]:value}))} />)}</div></details>)}</section><div className="toolbar"><button onClick={() => setState({...integratedDefaults})}>Reset Integrated Model</button><button className="secondary" onClick={() => setState((s) => ({...s,mortalityPct:0,feedWastePct:0,trimPct:0}))}>Zero-Loss Scenario</button></div><nav className="tabs" aria-label="System modules">{tabs.map(([key,label]) => <button className={tab === key ? 'active' : ''} key={key} onClick={() => setTab(key)}>{label}</button>)}</nav><main className="module">{tab === 'dashboard' && <IntegratedDashboard r={r} />}{tab === 'reverse' && <ReverseSolver r={r} />}{tab === 'carcass' && <CarcassMeat r={r} />}{tab === 'jagal' && <JagalModule state={jagalState} setState={setJagalState} />}{tab === 'sensitivity' && <Sensitivity state={state} r={r} />}{tab === 'audit' && <FormulaAudit r={r} />}</main></>;
}

export default function AppV3() {
  const [mode, setMode] = useState('home');
  const [state, setState] = useState({ ...integratedDefaults });
  const [jagalState, setJagalState] = useState({ ...jagalDefaults });
  const [quickLiveState, setQuickLiveState] = useState({ ...quickLiveDefaults });
  const [quickCarcassState, setQuickCarcassState] = useState({ ...quickCarcassDefaults });
  return <div className="app-shell">{mode === 'home' && <ModeHome onChoose={setMode} />}{mode === 'quick' && <QuickMode liveState={quickLiveState} setLiveState={setQuickLiveState} carcassState={quickCarcassState} setCarcassState={setQuickCarcassState} onProfessional={() => setMode('professional')} />}{mode === 'professional' && <ProfessionalMode state={state} setState={setState} jagalState={jagalState} setJagalState={setJagalState} onQuick={() => setMode('quick')} />}{mode !== 'home' && <footer><button className="home-link" onClick={() => setMode('home')}>← Pilih mode lain</button><span><strong>Model governance:</strong> Quick Mode memakai model sederhana yang eksplisit tanpa asumsi tersembunyi. Professional Mode memasukkan seluruh faktor teknis yang ditampilkan dan dapat diaudit.</span></footer>}</div>;
}

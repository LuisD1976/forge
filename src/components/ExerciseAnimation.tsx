import React, { useEffect } from 'react'

export type AnimType =
  | 'squat' | 'press' | 'curl' | 'row' | 'crunch'
  | 'jumping-jacks' | 'deadlift' | 'raise' | 'dip' | 'plank' | 'run' | 'default'

export const EXERCISE_ANIM_MAP: Record<string, AnimType> = {
  squat:'squat', leg_press:'squat', leg_curl:'squat', leg_extension:'squat', lunge:'squat',
  bench_press:'press', overhead_press:'press', incline_bench:'press', incline_press:'press', push_up:'press',
  dip:'dip', tricep_pushdown:'dip',
  bicep_curl:'curl', hammer_curl:'curl', preacher_curl:'curl',
  barbell_row:'row', cable_row:'row', face_pull:'row', lat_pulldown:'row', pull_up:'row',
  crunch:'crunch', sit_up:'crunch', plank:'plank',
  jumping_jacks:'jumping-jacks', burpee:'jumping-jacks',
  deadlift:'deadlift', rdl:'deadlift', hip_thrust:'deadlift',
  lateral_raise:'raise', front_raise:'raise', calf_raise:'raise',
  run:'run', sprint:'run',
}
export const MUSCLE_ANIM_MAP: Record<string, AnimType> = {
  cuadriceps:'squat', isquiotibiales:'deadlift', gluteos:'deadlift',
  pecho:'press', triceps:'press', biceps:'curl', antebrazos:'curl',
  espalda:'row', trapecio:'row', hombros:'raise', abdominales:'crunch', gemelos:'raise',
}
export function getAnimType(id: string, muscles: string[]): AnimType {
  if (EXERCISE_ANIM_MAP[id]) return EXERCISE_ANIM_MAP[id]
  for (const m of muscles) if (MUSCLE_ANIM_MAP[m]) return MUSCLE_ANIM_MAP[m]
  return 'default'
}

// ── Colors ─────────────────────────────────────────────────────────────────
const SKN  = '#F4A882'
const HAIR = '#2D1B0E'
const SHRT = '#4FA8D5'
const SHRD = '#3A87B0'
const SHO  = '#1E2534'
const SHOE = '#151320'

// ── CSS builder: pivot-correct rotation via translate-rotate-translate ──────
function kf(name: string, a: number, b: number, cx: number, cy: number, dur: number) {
  const p = `${cx}px,${cy}px`, n = `${-cx}px,${-cy}px`
  const F = `translate(${p}) rotate(${a}deg) translate(${n})`
  const T = `translate(${p}) rotate(${b}deg) translate(${n})`
  return `@keyframes ${name}{0%,100%{transform:${F}}50%{transform:${T}}}.${name}{animation:${name} ${dur}s cubic-bezier(.45,0,.55,1) infinite;}`
}
function kfY(name: string, a: number, b: number, dur: number) {
  return `@keyframes ${name}{0%,100%{transform:translateY(${a}px)}50%{transform:translateY(${b}px)}}.${name}{animation:${name} ${dur}s cubic-bezier(.45,0,.55,1) infinite;}`
}
function kfPulse(name: string, dur: number) {
  return `@keyframes ${name}{0%,100%{opacity:.2;r:3}50%{opacity:.55;r:6}}.${name}{animation:${name} ${dur}s ease-in-out infinite;}`
}

// ── Single global CSS block (injected once into document.head) ─────────────
const ALL_CSS = [
  // jumping-jacks
  kf('jj-ar', 22,-155, 64,42, 0.72), kf('jj-al',-22, 155, 36,42, 0.72),
  kf('jj-lr',  6,  42, 57,82, 0.72), kf('jj-ll', -6, -42, 43,82, 0.72),
  // press
  kf('pr-ar', 72,-155, 64,42, 1.25), kf('pr-al',-72, 155, 36,42, 1.25),
  // squat
  kfY('sq-bd',0,13,1.6),
  kf('sq-lr',  6, 40, 57,82, 1.6), kf('sq-ll', -6,-40, 43,82, 1.6),
  kf('sq-ar', 22,-32, 64,42, 1.6), kf('sq-al',-22, 32, 36,42, 1.6),
  // curl
  kf('cu-fa', 18,-105, 72,63, 1.2),
  // crunch (side view: upper body from -85° flat to -132° crunched)
  kf('cr-up',-85,-132, 78,72, 1.7),
  // row
  kf('ro-ar', 22, 80, 64,42, 1.45), kf('ro-al',-22,-80, 36,42, 1.45),
  kf('ro-tr',  0, 28, 50,70, 1.45),
  // deadlift
  kf('dl-tr',  0, 52, 50,74, 1.8),
  // raise
  kf('ra-ar', 20, 85, 64,42, 1.35), kf('ra-al',-20,-85, 36,42, 1.35),
  // dip
  kfY('di-bd',0,16,1.25),
  kf('di-er',0,60, 68,60, 1.25), kf('di-el',0,-60, 32,60, 1.25),
  // plank breathing
  kfPulse('pl-br',2.2),
  // run
  kf('rn-ar', 38,-28, 64,42, 0.52), kf('rn-al',-28, 38, 36,42, 0.52),
  kf('rn-lr', 28,-18, 57,82, 0.52), kf('rn-ll',-18, 28, 43,82, 0.52),
  // default idle
  kfY('df-bd',0,-6,1.9),
].join('\n')

// Inject once per page load
let _injected = false
function injectCSS() {
  if (_injected || typeof document === 'undefined') return
  _injected = true
  const el = document.createElement('style')
  el.setAttribute('data-forge-anim','1')
  el.textContent = ALL_CSS
  document.head.appendChild(el)
}

// ── Shared character parts (front view, viewBox "0 0 100 140") ─────────────
// Shoulder R:(64,42) L:(36,42) | Hip R:(57,82) L:(43,82)

function Head() {
  return <>
    <circle cx={50} cy={24} r={12.5} fill={SKN}/>
    <ellipse cx={50} cy={14} rx={11} ry={9} fill={HAIR}/>
  </>
}
function Torso() {
  return <>
    <rect x={37} y={36} width={26} height={33} rx={6} fill={SHRT}/>
    <rect x={40} y={36} width={20} height={14} rx={5} fill={SHRD} opacity={0.35}/>
  </>
}
function Shorts() { return <rect x={35} y={68} width={30} height={14} rx={6} fill={SHO}/> }
function RArmRect() {
  return <>
    <rect x={59.5} y={42} width={9}  height={22} rx={4.5} fill={SKN}/>
    <rect x={60}   y={63} width={8}  height={18} rx={4}   fill={SKN}/>
  </>
}
function LArmRect() {
  return <>
    <rect x={31.5} y={42} width={9}  height={22} rx={4.5} fill={SKN}/>
    <rect x={32}   y={63} width={8}  height={18} rx={4}   fill={SKN}/>
  </>
}
function RLegRect() {
  return <>
    <rect x={51.5} y={82}  width={11} height={26} rx={5.5} fill={SKN}/>
    <rect x={52}   y={106} width={10} height={22} rx={5}   fill={SKN}/>
    <rect x={50}   y={125} width={14} height={7}  rx={3.5} fill={SHOE}/>
  </>
}
function LLegRect() {
  return <>
    <rect x={37.5} y={82}  width={11} height={26} rx={5.5} fill={SKN}/>
    <rect x={38}   y={106} width={10} height={22} rx={5}   fill={SKN}/>
    <rect x={34}   y={125} width={14} height={7}  rx={3.5} fill={SHOE}/>
  </>
}
// Static legs slightly spread (no CSS class needed)
function StaticLegs() {
  return <>
    <g transform="rotate(6,57,82)"><RLegRect/></g>
    <g transform="rotate(-6,43,82)"><LLegRect/></g>
  </>
}

// ── Animation components ───────────────────────────────────────────────────

function AnimJumpingJacks() {
  return (
    <svg viewBox="0 0 100 140" width="100%" height="100%" style={{ overflow:'visible' }}>
      <Head/><Torso/><Shorts/>
      <g className="jj-ar"><RArmRect/></g>
      <g className="jj-al"><LArmRect/></g>
      <g className="jj-lr"><RLegRect/></g>
      <g className="jj-ll"><LLegRect/></g>
    </svg>
  )
}

function AnimPress() {
  return (
    <svg viewBox="0 0 100 140" width="100%" height="100%" style={{ overflow:'visible' }}>
      <Head/><Torso/><Shorts/><StaticLegs/>
      <g className="pr-ar"><RArmRect/></g>
      <g className="pr-al"><LArmRect/></g>
    </svg>
  )
}

function AnimSquat() {
  return (
    <svg viewBox="0 0 100 150" width="100%" height="100%">
      <g className="sq-bd">
        <Head/><Torso/><Shorts/>
        <g className="sq-ar"><RArmRect/></g>
        <g className="sq-al"><LArmRect/></g>
      </g>
      <g className="sq-lr"><RLegRect/></g>
      <g className="sq-ll"><LLegRect/></g>
    </svg>
  )
}

function AnimCurl() {
  return (
    <svg viewBox="0 0 100 140" width="100%" height="100%">
      <Head/><Torso/><Shorts/><StaticLegs/>
      {/* L arm static, hanging */}
      <g transform="rotate(-18,36,42)"><LArmRect/></g>
      {/* R upper arm static */}
      <g transform="rotate(18,64,42)">
        <rect x={59.5} y={42} width={9} height={22} rx={4.5} fill={SKN}/>
      </g>
      {/* R forearm curls from elbow (72,63) */}
      <g className="cu-fa">
        <rect x={68} y={63} width={8} height={18} rx={4} fill={SKN}/>
      </g>
    </svg>
  )
}

function AnimCrunch() {
  return (
    <svg viewBox="0 0 140 100" width="100%" height="100%">
      {/* Mat */}
      <rect x={4} y={80} width={132} height={9} rx={4} fill="#B8D4E8" opacity={0.45}/>
      {/* Lower body static (bent knees) */}
      <line x1={78} y1={72} x2={102} y2={50} stroke={SKN} strokeWidth={11} strokeLinecap="round"/>
      <line x1={102} y1={50} x2={124} y2={74} stroke={SKN} strokeWidth={10} strokeLinecap="round"/>
      <rect x={66} y={63} width={24} height={16} rx={6} fill={SHO}/>
      <rect x={116} y={70} width={16} height={8} rx={4} fill={SHOE}/>
      {/* Upper body pivots at hip (78,72) — drawn pointing DOWN from pivot */}
      <g className="cr-up">
        <rect x={71} y={72} width={14} height={38} rx={7} fill={SHRT}/>
        <circle cx={78} cy={117} r={12} fill={SKN}/>
        <ellipse cx={78} cy={107} rx={10} ry={8} fill={HAIR}/>
        <rect x={86} y={108} width={8} height={20} rx={4} fill={SKN}/>
        <rect x={67} y={108} width={8} height={20} rx={4} fill={SKN}/>
      </g>
    </svg>
  )
}

function AnimRow() {
  return (
    <svg viewBox="0 0 100 140" width="100%" height="100%">
      <StaticLegs/><Shorts/>
      <g className="ro-tr">
        <Head/><Torso/>
        <g className="ro-ar"><RArmRect/></g>
        <g className="ro-al"><LArmRect/></g>
      </g>
    </svg>
  )
}

function AnimDeadlift() {
  return (
    <svg viewBox="0 0 100 140" width="100%" height="100%">
      <StaticLegs/><Shorts/>
      <g className="dl-tr">
        <Head/><Torso/>
        <rect x={59.5} y={42} width={9} height={40} rx={4.5} fill={SKN}/>
        <rect x={31.5} y={42} width={9} height={40} rx={4.5} fill={SKN}/>
      </g>
    </svg>
  )
}

function AnimRaise() {
  return (
    <svg viewBox="0 0 100 140" width="100%" height="100%">
      <Head/><Torso/><Shorts/><StaticLegs/>
      <g className="ra-ar"><RArmRect/></g>
      <g className="ra-al"><LArmRect/></g>
    </svg>
  )
}

function AnimDip() {
  return (
    <svg viewBox="0 0 100 140" width="100%" height="100%">
      <rect x={16} y={38} width={6} height={56} rx={3} fill="#666" opacity={0.35}/>
      <rect x={78} y={38} width={6} height={56} rx={3} fill="#666" opacity={0.35}/>
      {/* Static upper arms on bars */}
      <rect x={20} y={40} width={8} height={20} rx={4} fill={SKN}/>
      <rect x={72} y={40} width={8} height={20} rx={4} fill={SKN}/>
      {/* Forearms bend at elbows */}
      <g className="di-er"><rect x={64} y={60} width={8} height={18} rx={4} fill={SKN}/></g>
      <g className="di-el"><rect x={28} y={60} width={8} height={18} rx={4} fill={SKN}/></g>
      {/* Body drops */}
      <g className="di-bd">
        <Head/><Torso/><Shorts/>
        <rect x={51.5} y={82} width={11} height={44} rx={5.5} fill={SKN}/>
        <rect x={37.5} y={82} width={11} height={44} rx={5.5} fill={SKN}/>
        <rect x={50} y={123} width={14} height={7} rx={3.5} fill={SHOE}/>
        <rect x={36} y={123} width={14} height={7} rx={3.5} fill={SHOE}/>
      </g>
    </svg>
  )
}

function AnimPlank() {
  return (
    <svg viewBox="0 0 140 80" width="100%" height="100%">
      <rect x={4} y={64} width={132} height={9} rx={4} fill="#B8D4E8" opacity={0.4}/>
      <circle cx={20} cy={50} r={11} fill={SKN}/>
      <ellipse cx={20} cy={41} rx={9} ry={7} fill={HAIR}/>
      <rect x={28} y={46} width={56} height={14} rx={6} fill={SHRT}/>
      <rect x={82} y={46} width={20} height={14} rx={5} fill={SHO}/>
      <rect x={28} y={58} width={8} height={14} rx={4} fill={SKN}/>
      <rect x={24} y={68} width={22} height={7} rx={3.5} fill={SKN}/>
      <rect x={102} y={50} width={28} height={10} rx={5} fill={SKN}/>
      <rect x={124} y={54} width={14} height={8} rx={4} fill={SHOE}/>
      {/* Breathing dot */}
      <circle cx={58} cy={53} r={3} fill="white" className="pl-br"/>
    </svg>
  )
}

function AnimRun() {
  return (
    <svg viewBox="0 0 100 140" width="100%" height="100%">
      <Head/><Torso/><Shorts/>
      <g className="rn-ar"><RArmRect/></g>
      <g className="rn-al"><LArmRect/></g>
      <g className="rn-lr"><RLegRect/></g>
      <g className="rn-ll"><LLegRect/></g>
    </svg>
  )
}

function AnimDefault() {
  return (
    <svg viewBox="0 0 100 140" width="100%" height="100%">
      <g className="df-bd">
        <Head/><Torso/><Shorts/>
        <g transform="rotate(18,64,42)"><RArmRect/></g>
        <g transform="rotate(-18,36,42)"><LArmRect/></g>
        <g transform="rotate(6,57,82)"><RLegRect/></g>
        <g transform="rotate(-6,43,82)"><LLegRect/></g>
      </g>
    </svg>
  )
}

// ── Map & public component ─────────────────────────────────────────────────
const ANIM_MAP: Record<AnimType, React.FC> = {
  'jumping-jacks': AnimJumpingJacks,
  press:    AnimPress,
  squat:    AnimSquat,
  curl:     AnimCurl,
  crunch:   AnimCrunch,
  row:      AnimRow,
  deadlift: AnimDeadlift,
  raise:    AnimRaise,
  dip:      AnimDip,
  plank:    AnimPlank,
  run:      AnimRun,
  default:  AnimDefault,
}

export interface ExerciseAnimationProps {
  exerciseId?: string
  muscles?: string[]
  animType?: AnimType
  color?: string
  size?: number
  className?: string
}

export function ExerciseAnimation({
  exerciseId = '', muscles = [], animType, size = 72, className = '',
}: ExerciseAnimationProps) {
  // Inject all CSS once into document.head (avoids React 18 <style> hoisting issues)
  useEffect(() => { injectCSS() }, [])

  const type = animType ?? getAnimType(exerciseId, muscles)
  const Anim = ANIM_MAP[type] ?? AnimDefault
  return (
    <div className={className} style={{ width: size, height: size, overflow: 'hidden' }}>
      <Anim/>
    </div>
  )
}

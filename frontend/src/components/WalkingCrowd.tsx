import { BrandMark } from "@/components/ui";
import s from "./WalkingCrowd.module.css";

type Walker = {
  lane: "far" | "mid" | "near";
  cycle: number; // seconds per stride (two steps)
  delay: number; // 0..1, where in the journey this walker starts
  carry?: boolean; // holding a glowing CV card
  rest: number; // % position when motion is reduced
};

// Depth: farther lanes sit higher, smaller and dimmer.
const LANES = {
  far: { bottom: "38%", h: 58, tint: "#a5b4fc", glow: "rgb(129 140 248 / 0.8)", alpha: 0.55, z: 1 },
  mid: { bottom: "24%", h: 84, tint: "#bae6fd", glow: "rgb(56 189 248 / 0.8)", alpha: 0.8, z: 2 },
  near: { bottom: "8%", h: 116, tint: "#e0f2fe", glow: "rgb(56 189 248 / 0.95)", alpha: 1, z: 3 },
};

const WALKERS: Walker[] = [
  { lane: "far", cycle: 1.25, delay: 0.05, rest: 12 },
  { lane: "far", cycle: 1.15, delay: 0.42, rest: 40 },
  { lane: "far", cycle: 1.3, delay: 0.78, carry: true, rest: 66 },
  { lane: "mid", cycle: 1.1, delay: 0.18, carry: true, rest: 22 },
  { lane: "mid", cycle: 1.05, delay: 0.55, rest: 52 },
  { lane: "mid", cycle: 1.15, delay: 0.9, rest: 74 },
  { lane: "near", cycle: 1.0, delay: 0.3, rest: 8 },
  { lane: "near", cycle: 0.95, delay: 0.68, carry: true, rest: 44 },
];

/** Decorative hero band: candidates walking through one link into the hiring portal. */
export default function WalkingCrowd() {
  return (
    <section className={s.scene} aria-hidden="true">
      <div className={s.stars} />
      <div className={s.horizon} />
      <div className={s.floor} />
      <div className={s.portal} />
      <div className={s.portalMark}>
        <BrandMark size={40} onDark />
      </div>

      {WALKERS.map((w, i) => {
        const lane = LANES[w.lane];
        // Travel speed matches stride length (~1.4× body height per stride), so feet don't slide.
        const travel = (1000 * w.cycle) / lane.h;
        return (
          <div
            key={i}
            className={s.walker}
            style={{
              bottom: lane.bottom,
              zIndex: lane.z,
              ["--h" as string]: `${lane.h}px`,
              ["--tint" as string]: lane.tint,
              ["--glow" as string]: lane.glow,
              ["--alpha" as string]: lane.alpha,
              ["--cycle" as string]: `${w.cycle}s`,
              ["--travel" as string]: `${travel}s`,
              ["--delay" as string]: `${-w.delay * travel}s`,
              ["--rest" as string]: `${w.rest}%`,
            }}
          >
            <Figure carry={w.carry} />
          </div>
        );
      })}

      <div className={s.scan} />

      <div className={s.caption}>
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-sky-300/80">One link · Every candidate</p>
        <p className="mx-auto mt-3 max-w-xl text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Your next great hire is already on the way.
        </p>
      </div>
    </section>
  );
}

function Figure({ carry }: { carry?: boolean }) {
  return (
    <svg viewBox="0 0 40 100" className={s.figure}>
      <g className={s.body}>
        {/* far-side limbs (dimmer, half a stride out of phase) */}
        <g className={s.back}>
          <line className={s.arm} x1="20" y1="22" x2="20" y2="46" strokeWidth="4.5" />
          <g className={s.thigh}>
            <line x1="20" y1="52" x2="20" y2="74" strokeWidth="5.5" />
            <g className={s.shin}>
              <line x1="20" y1="74" x2="20" y2="95" strokeWidth="5" />
            </g>
          </g>
        </g>

        {/* head + torso */}
        <circle cx="20" cy="9.5" r="6.5" fill="currentColor" stroke="none" />
        <line x1="20" y1="19" x2="20" y2="52" strokeWidth="7" />

        {/* near-side limbs */}
        <g className={s.thigh}>
          <line x1="20" y1="52" x2="20" y2="74" strokeWidth="5.5" />
          <g className={s.shin}>
            <line x1="20" y1="74" x2="20" y2="95" strokeWidth="5" />
          </g>
        </g>
        <g className={s.arm}>
          <line x1="20" y1="22" x2="20" y2="46" strokeWidth="4.5" />
          {carry && <rect className={s.cv} x="15" y="42" width="11" height="14" rx="1.5" />}
        </g>
      </g>
    </svg>
  );
}

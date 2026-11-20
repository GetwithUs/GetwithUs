/**
 * Static fallback for BlogScene3D. Shown before WebGL loads and kept for good
 * when WebGL is unavailable. Uses theme tokens, no gradients from images, no JS.
 */
export function BlogSceneStillShapes() {
  return (
    <>
      <ellipse cx={200} cy={244} rx={126} ry={26} fill="var(--accent)" fillOpacity={0.1} />

      {/* Rear pages */}
      <rect x={118} y={72} width={164} height={150} rx={11} fill="var(--card-2)" stroke="var(--accent)" strokeOpacity={0.35} strokeWidth={1.5} transform="rotate(-7 200 147)" />
      <rect x={128} y={62} width={164} height={150} rx={11} fill="var(--card)" stroke="var(--line-2)" strokeWidth={1.5} transform="rotate(4 210 137)" />

      {/* Front page */}
      <g transform="rotate(-2 200 145)">
        <rect x={108} y={58} width={164} height={150} rx={11} fill="var(--card)" stroke="var(--line-2)" strokeWidth={1.5} />
        <rect x={124} y={78} width={76} height={9} rx={4} fill="var(--ink)" />
        <rect x={124} y={99} width={118} height={6} rx={3} fill="var(--line)" />
        <rect x={124} y={113} width={104} height={6} rx={3} fill="var(--line)" />
        <rect x={124} y={127} width={116} height={6} rx={3} fill="var(--line)" />
        <rect x={124} y={141} width={72} height={6} rx={3} fill="var(--line)" />
        <rect x={124} y={164} width={48} height={24} rx={5} fill="var(--accent)" fillOpacity={0.16} stroke="var(--accent)" strokeOpacity={0.5} strokeWidth={1.5} />
      </g>

      {/* Pen */}
      <g transform="rotate(36 286 132)">
        <rect x={280} y={74} width={8} height={112} rx={4} fill="var(--ink)" />
        <path d="M280 186 L284 202 L288 186 Z" fill="var(--accent)" />
      </g>

      {/* Orbiting orbs */}
      <circle cx={100} cy={102} r={9} fill="var(--accent)" fillOpacity={0.18} />
      <circle cx={100} cy={102} r={4.5} fill="var(--accent)" />
      <circle cx={302} cy={78} r={7} fill="var(--accent)" fillOpacity={0.18} />
      <circle cx={302} cy={78} r={3.5} fill="var(--accent)" />
      <circle cx={314} cy={198} r={8} fill="var(--accent)" fillOpacity={0.18} />
      <circle cx={314} cy={198} r={4} fill="var(--accent)" />
      <circle cx={82} cy={202} r={6} fill="var(--accent)" fillOpacity={0.18} />
      <circle cx={82} cy={202} r={3} fill="var(--accent)" />
    </>
  );
}

export default function BlogSceneStill() {
  return (
    <svg viewBox="0 0 400 300" className="h-auto w-[86%]" aria-hidden="true" focusable="false">
      <BlogSceneStillShapes />
    </svg>
  );
}

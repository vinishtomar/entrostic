/** Renders a plain-text job description: blank lines split paragraphs, "- " lines become bullets,
 *  and a short line directly followed by bullets is treated as a sub-heading. */
export default function JobDescription({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n\s*\n/);
  return (
    <div className="space-y-5 text-[15px] leading-7 text-slate-700">
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        const bulletStart = lines.findIndex((l) => /^[-•*]\s+/.test(l));
        if (bulletStart === -1) return <p key={i}>{lines.join(" ")}</p>;
        const intro = lines.slice(0, bulletStart);
        const bullets = lines.slice(bulletStart).map((l) => l.replace(/^[-•*]\s+/, ""));
        const isHeading = intro.length === 1 && intro[0].length < 60 && !/[.!?]$/.test(intro[0]);
        return (
          <div key={i}>
            {intro.length > 0 &&
              (isHeading ? (
                <h3 className="mb-2 font-semibold text-slate-900">{intro[0]}</h3>
              ) : (
                <p className="mb-2">{intro.join(" ")}</p>
              ))}
            <ul className="space-y-1.5">
              {bullets.map((b, j) => (
                <li key={j} className="flex gap-3">
                  <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

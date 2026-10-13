"use client";

import { useEffect, useState } from "react";

const GLYPHS = "▓▒░<>/\\|=+*#01ΣΔλπ";

/** Cycles through words, "decoding" each one from random glyphs like a scientific readout. */
export default function DecodeWord({ words, interval = 2800 }: { words: string[]; interval?: number }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState(words[0]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % words.length), interval);
    return () => clearInterval(t);
  }, [words.length, interval]);

  useEffect(() => {
    const target = words[index];
    let frame = 0;
    const total = 16;
    const id = setInterval(() => {
      frame++;
      const settled = Math.floor((frame / total) * target.length);
      setText(
        target
          .split("")
          .map((ch, i) => (i < settled ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join(""),
      );
      if (frame >= total) {
        clearInterval(id);
        setText(target);
      }
    }, 38);
    return () => clearInterval(id);
  }, [index, words]);

  return (
    // Reserve the longest word's width so the headline never reflows while decoding.
    <span className="relative inline-block whitespace-nowrap text-left" style={{ minWidth: `${Math.max(...words.map((w) => w.length))}ch` }}>
      <span className="sr-only">{words[index]}</span>
      <span aria-hidden="true" className="bg-gradient-to-r from-sky-300 via-indigo-300 to-violet-400 bg-clip-text font-mono text-transparent">
        {text}
      </span>
    </span>
  );
}

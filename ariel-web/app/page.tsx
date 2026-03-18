'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/lib/useAuth';
import ArielWordmark from '@/components/ArielWordmark';

// ─── Micro icons ──────────────────────────────────────────────────────────────

function HeartIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16"
      fill={filled ? '#f43f5e' : 'none'} stroke={filled ? '#f43f5e' : 'currentColor'}
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 13.5s-6-3.8-6-7.5a4 4 0 0 1 6-3.4A4 4 0 0 1 14 6c0 3.7-6 7.5-6 7.5z" />
    </svg>
  );
}
function CommentIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h12v8H9l-3 3v-3H2z" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#8b9099" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5l3 3" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#8b9099" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10V7a5 5 0 0 1 10 0v3l1.5 2.5H1.5L3 10z" /><path d="M6.5 13a1.5 1.5 0 0 0 3 0" />
    </svg>
  );
}

// ─── Shared status bar ────────────────────────────────────────────────────────

function StatusBar() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px 4px', flexShrink: 0 }}>
      <span style={{ fontSize: 10, color: '#71717a', fontWeight: 600 }}>9:41</span>
      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
        {[3, 4, 5, 5].map((h, i) => (
          <div key={i} style={{ width: 2.5, height: h, background: i < 3 ? '#8b9099' : '#3f3f46', borderRadius: 1 }} />
        ))}
        <div style={{ width: 14, height: 7, border: '1px solid #52525b', borderRadius: 2, marginLeft: 3, display: 'flex', alignItems: 'center', padding: '0 1.5px' }}>
          <div style={{ flex: 0.7, height: 3.5, background: '#8b9099', borderRadius: 1 }} />
        </div>
      </div>
    </div>
  );
}

// ─── Screen 1: Cram / Flashcard ───────────────────────────────────────────────

function CramScreen({ flipped }: { flipped: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#09090b' }}>
      <StatusBar />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 14px 10px' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#e7e9ea' }}>History</div>
          <div style={{ fontSize: 9, color: '#52525b' }}>Card 3 of 12</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', margin: '0 14px 16px', borderRadius: 99 }}>
        <div style={{ width: '25%', height: '100%', background: '#8b5cf6', borderRadius: 99, transition: 'width 0.4s' }} />
      </div>

      {/* Card */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 14px' }}>
        <div style={{
          width: '100%',
          background: flipped ? '#f0fdf4' : '#ffffff',
          borderRadius: 16,
          border: `1px solid ${flipped ? '#bbf7d0' : 'rgba(0,0,0,0.06)'}`,
          padding: '16px 14px 14px',
          boxShadow: flipped
            ? '0 8px 32px rgba(34,197,94,0.15)'
            : '0 8px 32px rgba(0,0,0,0.35)',
          transition: 'background 0.45s, border-color 0.45s, box-shadow 0.45s',
          minHeight: 160,
          position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{
              fontSize: 8.5, fontWeight: 800, letterSpacing: '0.08em',
              color: flipped ? '#16a34a' : '#7c3aed',
              padding: '2px 7px', borderRadius: 999,
              background: flipped ? 'rgba(34,197,94,0.12)' : 'rgba(124,58,237,0.1)',
            }}>
              {flipped ? 'ANSWER' : 'QUESTION'}
            </span>
            <span style={{ fontSize: 9, color: '#a1a1aa' }}>📜 History</span>
          </div>
          <div style={{ height: 1, background: flipped ? '#bbf7d0' : 'rgba(0,0,0,0.07)', marginBottom: 10 }} />
          <div style={{ position: 'relative', minHeight: 80 }}>
            <p style={{
              fontSize: 13.5, fontWeight: 700, color: '#18181b', lineHeight: 1.4,
              opacity: flipped ? 0 : 1, transition: 'opacity 0.35s',
              position: flipped ? 'absolute' : 'relative',
            }}>
              What caused the fall of the Roman Empire?
            </p>
            <p style={{
              fontSize: 11, color: '#374151', lineHeight: 1.55,
              opacity: flipped ? 1 : 0, transition: 'opacity 0.35s',
              position: flipped ? 'relative' : 'absolute',
            }}>
              A combination of military overextension, economic decay, political instability, and sustained barbarian pressure — eroding the empire over three centuries.
            </p>
          </div>
          {!flipped && (
            <p style={{ fontSize: 8.5, color: '#d4d4d8', textAlign: 'right', marginTop: 8 }}>tap to reveal →</p>
          )}
        </div>
      </div>

      {/* Spaced rep buttons */}
      <div style={{ display: 'flex', gap: 8, padding: '14px 14px 10px' }}>
        <button style={{ flex: 1, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '9px 0', fontSize: 10, fontWeight: 700, color: '#ef4444' }}>
          Again
        </button>
        <button style={{ flex: 1, background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: 10, padding: '9px 0', fontSize: 10, fontWeight: 700, color: '#eab308' }}>
          Hard
        </button>
        <button style={{ flex: 1, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, padding: '9px 0', fontSize: 10, fontWeight: 700, color: '#22c55e' }}>
          Got it ✓
        </button>
      </div>

      {/* Bottom nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '8px 0 12px', flexShrink: 0 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#8b5cf6" stroke="none"><path d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 14px rgba(139,92,246,0.5)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round"><path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
      </div>
    </div>
  );
}

// ─── Screen 2: Social feed ────────────────────────────────────────────────────

function FeedScreen() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#09090b' }}>
      <StatusBar />

      {/* App bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 14px 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#7c5cfc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>Y</div>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#fff' }}>You</span>
        </div>
        <span style={{ fontFamily: "Georgia,'Times New Roman',serif", fontStyle: 'italic', fontWeight: 700, fontSize: 14, color: '#fff' }}>
          ar<span style={{ color: '#8b5cf6' }}>i</span>el
        </span>
        <div style={{ display: 'flex', gap: 9 }}><SearchIcon /><BellIcon /></div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        {['For You', 'Following'].map((tab, i) => (
          <div key={tab} style={{
            flex: 1, textAlign: 'center', padding: '5px 0 5px',
            fontSize: 10, fontWeight: i === 0 ? 700 : 500,
            color: i === 0 ? '#e7e9ea' : '#52525b',
            borderBottom: i === 0 ? '1.5px solid #8b5cf6' : '1.5px solid transparent',
            marginBottom: -1,
          }}>{tab}</div>
        ))}
      </div>

      {/* Post */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '9px 12px 0' }}>
        {/* Author row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0ea5e9', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>P</div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#e7e9ea' }}>Dr. Priya K.</span>
            <span style={{ fontSize: 9, color: '#8b9099', background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 999 }}>Economics</span>
            <span style={{ fontSize: 9, color: '#52525b', marginLeft: 'auto' }}>4h</span>
          </div>
        </div>
        <p style={{ fontSize: 10, color: '#a1a1aa', marginBottom: 6, lineHeight: 1.35 }}>Most people confuse these two. Once you see the difference, you can't unsee it.</p>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', padding: '9px 10px 8px', boxShadow: '0 1px 6px rgba(0,0,0,0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '0.06em', color: '#7c3aed', background: 'rgba(124,58,237,0.08)', padding: '1.5px 6px', borderRadius: 999 }}>QUESTION</span>
            <span style={{ fontSize: 9, color: '#a1a1aa' }}>💰 Economics</span>
          </div>
          <div style={{ height: 1, background: 'rgba(0,0,0,0.07)', marginBottom: 6 }} />
          <p style={{ fontSize: 12.5, fontWeight: 700, color: '#18181b', lineHeight: 1.3 }}>
            What is the difference between GDP and GNP?
          </p>
          <p style={{ fontSize: 8.5, color: '#d4d4d8', textAlign: 'right', marginTop: 6 }}>tap to reveal →</p>
        </div>

        {/* Action row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 7, color: '#71717a' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9.5 }}><HeartIcon filled />24</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9.5 }}><CommentIcon />7</span>
          <span style={{ fontSize: 9, color: '#444', marginLeft: 'auto' }}>1.4k</span>
        </div>

        {/* Comments */}
        <div style={{ marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 7 }}>
          {[
            { avatar: 'M', color: '#22c55e', name: 'Maya S.', text: 'Never thought about it this way 🤯' },
            { avatar: 'K', color: '#f59e0b', name: 'Kev', text: 'Saving this for my econ exam tmrw 🙏' },
          ].map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: c.color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff' }}>{c.avatar}</div>
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '4px 8px', flex: 1 }}>
                <span style={{ fontSize: 8.5, fontWeight: 700, color: '#a1a1aa' }}>{c.name} </span>
                <span style={{ fontSize: 8.5, color: '#71717a' }}>{c.text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '8px 0 12px', flexShrink: 0 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#8b5cf6" stroke="none"><path d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 14px rgba(139,92,246,0.5)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round"><path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
      </div>
    </div>
  );
}

// ─── Screen 3: Full-bleed Clips ───────────────────────────────────────────────

function ClipsScreen() {
  return (
    <div style={{ position: 'relative', height: '100%', background: '#000', overflow: 'hidden' }}>
      {/* Full-bleed thumbnail */}
      <img
        src="https://i.pravatar.cc/540?img=47"
        alt="clip"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
      />

      {/* Gradient scrim */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 30%, transparent 45%, rgba(0,0,0,0.92) 100%)' }} />

      {/* Top: status bar + subject pill */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 4px' }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>9:41</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ background: 'rgba(239,68,68,0.9)', borderRadius: 999, padding: '2px 7px', display: 'flex', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />
              <span style={{ fontSize: 8, fontWeight: 800, color: '#fff', letterSpacing: '0.06em' }}>CLIP</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 2.5, alignItems: 'flex-end' }}>
            {[3, 4, 5, 5].map((h, i) => (
              <div key={i} style={{ width: 2.5, height: h, background: i < 3 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)', borderRadius: 1 }} />
            ))}
          </div>
        </div>
      </div>

      {/* Right side actions */}
      <div style={{
        position: 'absolute', right: 10, bottom: 120, zIndex: 2,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
      }}>
        {[
          { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8 13.5s-6-3.8-6-7.5a4 4 0 0 1 6-3.4A4 4 0 0 1 14 6c0 3.7-6 7.5-6 7.5z" /></svg>, label: '2.1k' },
          { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h12v8H9l-3 3v-3H2z" /></svg>, label: '84' },
          { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2h10v13l-5-3-5 3V2z" /></svg>, label: 'Save' },
          { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" /></svg>, label: 'Share' },
        ].map((a, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            {a.icon}
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{a.label}</span>
          </div>
        ))}
      </div>

      {/* Bottom: author + title + play */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 50, zIndex: 2, padding: '0 14px 52px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#7c5cfc', border: '1.5px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>A</div>
          <div>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: '#fff', display: 'block' }}>@alexhistory</span>
          </div>
          <div style={{ marginLeft: 4, background: 'rgba(139,92,246,0.85)', borderRadius: 999, padding: '2px 8px', fontSize: 8.5, fontWeight: 700, color: '#fff' }}>+ Follow</div>
        </div>
        <p style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', lineHeight: 1.35, marginBottom: 6 }}>
          Why the Roman Empire really fell — it wasn't what you think
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 999, fontSize: 8.5, color: 'rgba(255,255,255,0.75)', padding: '2px 7px', fontWeight: 600 }}>#History</span>
          <span style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 999, fontSize: 8.5, color: 'rgba(255,255,255,0.75)', padding: '2px 7px', fontWeight: 600 }}>#Education</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ position: 'absolute', bottom: 46, left: 14, right: 14, zIndex: 2 }}>
        <div style={{ height: 2, background: 'rgba(255,255,255,0.2)', borderRadius: 99 }}>
          <div style={{ width: '38%', height: '100%', background: '#fff', borderRadius: 99 }} />
        </div>
      </div>

      {/* Bottom nav overlay */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-around', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '6px 0 10px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', zIndex: 3 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"><path d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 14px rgba(139,92,246,0.5)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"><path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
      </div>
    </div>
  );
}

// ─── Screen indicator strip ───────────────────────────────────────────────────

const SCREEN_LABELS = ['Flashcards', 'Social Feed', 'Clips'];

function ScreenStrip({ active }: { active: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 14 }}>
      {SCREEN_LABELS.map((label, i) => (
        <div
          key={label}
          style={{
            padding: '4px 12px',
            borderRadius: 999,
            fontSize: 10.5,
            fontWeight: 700,
            transition: 'all 0.35s ease',
            background: i === active ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${i === active ? 'rgba(139,92,246,0.45)' : 'rgba(255,255,255,0.08)'}`,
            color: i === active ? '#a78bfa' : '#52525b',
          }}
        >
          {label}
        </div>
      ))}
    </div>
  );
}

// ─── Phone mockup ─────────────────────────────────────────────────────────────

function PhoneMockup() {
  const [screen, setScreen] = useState(0);
  const [visible, setVisible] = useState(true);
  const [cardFlipped, setCardFlipped] = useState(false);

  useEffect(() => {
    setCardFlipped(false);

    let flipTimer: ReturnType<typeof setTimeout> | null = null;
    if (screen === 0) {
      flipTimer = setTimeout(() => setCardFlipped(true), 1600);
    }

    const advanceTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        setScreen(s => (s + 1) % 3);
        setVisible(true);
      }, 380);
    }, 3400);

    return () => {
      if (flipTimer) clearTimeout(flipTimer);
      clearTimeout(advanceTimer);
    };
  }, [screen]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <ScreenStrip active={screen} />
      <div style={{
        width: 272, height: 540, borderRadius: 38,
        border: '1.5px solid rgba(255,255,255,0.13)',
        background: '#09090b', overflow: 'hidden', flexShrink: 0,
        position: 'relative',
        boxShadow: screen === 2
          ? '0 24px 60px rgba(0,0,0,0.8), 0 0 60px rgba(139,92,246,0.12)'
          : '0 24px 60px rgba(0,0,0,0.8)',
        transition: 'box-shadow 0.5s ease',
      }}>
        <div style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.38s ease', height: '100%' }}>
          {screen === 0 && <CramScreen flipped={cardFlipped} />}
          {screen === 1 && <FeedScreen />}
          {screen === 2 && <ClipsScreen />}
        </div>
      </div>
    </div>
  );
}

// ─── Feature pills ─────────────────────────────────────────────────────────────

function FeaturePills() {
  const [hovered, setHovered] = useState<string | null>(null);
  const pills = [
    { icon: '⚡', label: 'Cram Mode',    desc: 'High-speed review with spaced repetition' },
    { icon: '⚔️', label: 'Study Duels',  desc: 'Challenge friends to live knowledge battles' },
    { icon: '🎬', label: 'Short Clips',  desc: 'Learn from 60-second educational videos' },
    { icon: '🃏', label: 'Flashcards',   desc: 'Build and share decks on any topic' },
  ];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 28 }}>
      {pills.map(f => (
        <div
          key={f.label}
          onMouseEnter={() => setHovered(f.label)}
          onMouseLeave={() => setHovered(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px',
            borderRadius: 999,
            background: hovered === f.label ? 'rgba(155,127,255,0.15)' : 'rgba(155,127,255,0.07)',
            border: `1px solid ${hovered === f.label ? 'rgba(155,127,255,0.4)' : 'rgba(155,127,255,0.18)'}`,
            fontSize: 12, color: hovered === f.label ? '#c4b5fd' : '#a78bfa', fontWeight: 600,
            transition: 'all 0.18s ease',
            cursor: 'default',
            position: 'relative',
          }}
        >
          <span style={{ fontSize: 13 }}>{f.icon}</span>
          {f.label}
          {hovered === f.label && (
            <span style={{
              position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(20,20,20,0.96)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '5px 10px', fontSize: 10.5, color: '#a1a1aa',
              whiteSpace: 'nowrap', pointerEvents: 'none', fontWeight: 400,
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            }}>
              {f.desc}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login, checkAuth } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');

  useEffect(() => { checkAuth(); }, [checkAuth]);
  useEffect(() => {
    if (isAuthenticated && !isLoading) router.push('/dashboard');
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-800 border-t-violet-400 rounded-full animate-spin" />
      </div>
    );
  }

  const openSignup = () => { setAuthMode('signup'); setShowAuthModal(true); };
  const openLogin  = () => { setAuthMode('login');  setShowAuthModal(true); };

  return (
    <main className="min-h-screen bg-black flex flex-col">
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(user, token) => { login(user, token); router.push('/dashboard'); }}
      />

      {/* ── Mobile ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center justify-between h-screen px-6 lg:hidden" style={{ paddingTop: 28, paddingBottom: 24, position: 'relative', overflow: 'hidden' }}>

        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,92,252,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="flex justify-center" style={{ position: 'relative', zIndex: 1 }}>
          <ArielWordmark size={36} variant="dark" showTagline={false} animate />
        </div>

        <div className="flex justify-center" style={{ transform: 'scale(0.68)', transformOrigin: 'center center', margin: '-48px 0', position: 'relative', zIndex: 1 }}>
          <PhoneMockup />
        </div>

        <div className="w-full" style={{ position: 'relative', zIndex: 1 }}>
          <div className="text-center mb-6">
            <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', lineHeight: 1.0, letterSpacing: '-0.03em', marginBottom: 0 }}>
              Study smarter.{' '}
              <span style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                fontStyle: 'italic', fontWeight: 700, fontSize: 36, color: '#9B7FFF',
              }}>Together.</span>
            </h1>
            <p style={{ fontSize: 13, color: '#71717a', marginTop: 10, lineHeight: 1.6, maxWidth: 280, margin: '10px auto 0' }}>
              Flashcards, a social feed, and short clips — the whole learning stack in one place.
            </p>
          </div>

          <button
            onClick={openSignup}
            style={{ width: '100%', background: '#fff', color: '#000', borderRadius: 999, padding: '14px 0', fontSize: 15, fontWeight: 800, border: 'none', cursor: 'pointer', display: 'block', letterSpacing: '-0.01em' }}
          >
            Create account
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: 11, color: '#3f3f46', fontWeight: 500 }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>

          <button
            onClick={openLogin}
            style={{ width: '100%', background: 'transparent', color: '#a1a1aa', borderRadius: 999, padding: '12px 0', fontSize: 14, fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'block' }}
          >
            Log in
          </button>

          <p style={{ fontSize: 10, color: '#3f3f46', textAlign: 'center', marginTop: 12 }}>
            By signing up you agree to our{' '}
            <span style={{ color: '#6d28d9', cursor: 'pointer' }}>Terms</span>
            {' & '}
            <span style={{ color: '#6d28d9', cursor: 'pointer' }}>Privacy</span>
          </p>
        </div>
      </div>

      {/* ── Desktop ─────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex min-h-screen items-center" style={{ position: 'relative', overflow: 'hidden' }}>

        <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse 70% 80% at 65% 50%, rgba(124,92,252,0.09) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -120, left: -80, width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

        {/* Left */}
        <div style={{
          position: 'relative', zIndex: 1,
          width: '48%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
          paddingLeft: 'max(64px, 7vw)', paddingRight: 48, paddingTop: 48, paddingBottom: 48,
        }}>
          <div style={{ marginBottom: 44, animation: 'fadeUp 0.6s ease both' }}>
            <ArielWordmark size={52} variant="dark" showTagline={false} animate />
          </div>

          <h1 style={{ fontWeight: 900, color: '#fff', lineHeight: 0.96, letterSpacing: '-0.035em', marginBottom: 22, animation: 'fadeUp 0.6s 0.1s ease both' }}>
            <span style={{ fontSize: 'clamp(48px,5vw,66px)', display: 'block' }}>Study smarter.</span>
            <span style={{
              fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
              fontStyle: 'italic', fontWeight: 700,
              fontSize: 'clamp(58px,6vw,80px)',
              color: '#9B7FFF', letterSpacing: '-0.02em',
              display: 'block', lineHeight: 0.95,
            }}>Together.</span>
          </h1>

          <p style={{ fontSize: 'clamp(15px,1.4vw,18px)', color: '#8b9099', lineHeight: 1.65, maxWidth: 400, animation: 'fadeUp 0.6s 0.2s ease both' }}>
            Flashcards, a social feed, and short educational clips — the complete learning stack in one place.
          </p>
          <p style={{ fontSize: 13, color: '#52525b', marginTop: 8, maxWidth: 400, lineHeight: 1.6, animation: 'fadeUp 0.6s 0.25s ease both' }}>
            Cramming for an exam, growing your skills, or just staying curious — Ariel meets you exactly where you are.
          </p>

          <div style={{ animation: 'fadeUp 0.6s 0.3s ease both' }}>
            <FeaturePills />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 340, marginTop: 40, animation: 'fadeUp 0.6s 0.38s ease both' }}>
            <button
              onClick={openSignup}
              style={{ background: '#fff', color: '#000', borderRadius: 999, padding: '15px 0', fontSize: 15, fontWeight: 800, border: 'none', cursor: 'pointer', width: '100%', letterSpacing: '-0.01em', transition: 'transform 0.12s ease, box-shadow 0.12s ease' }}
              onMouseEnter={e => { (e.currentTarget).style.transform = 'scale(1.025)'; (e.currentTarget).style.boxShadow = '0 8px 32px rgba(255,255,255,0.12)'; }}
              onMouseLeave={e => { (e.currentTarget).style.transform = 'scale(1)'; (e.currentTarget).style.boxShadow = 'none'; }}
            >
              Create account
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
              <span style={{ fontSize: 12, color: '#3f3f46', fontWeight: 500 }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            </div>
            <button
              onClick={openLogin}
              style={{ background: 'transparent', color: '#a1a1aa', borderRadius: 999, padding: '14px 0', fontSize: 14, fontWeight: 600, border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', width: '100%', transition: 'border-color 0.15s ease, color 0.15s ease' }}
              onMouseEnter={e => { (e.currentTarget).style.borderColor = 'rgba(255,255,255,0.22)'; (e.currentTarget).style.color = '#e7e9ea'; }}
              onMouseLeave={e => { (e.currentTarget).style.borderColor = 'rgba(255,255,255,0.12)'; (e.currentTarget).style.color = '#a1a1aa'; }}
            >
              Log in
            </button>
          </div>

          <p style={{ fontSize: 11, color: '#3f3f46', marginTop: 18, maxWidth: 340, animation: 'fadeUp 0.6s 0.45s ease both' }}>
            By signing up you agree to our{' '}
            <span style={{ color: '#9B7FFF', cursor: 'pointer' }}>Terms</span>
            {' and '}
            <span style={{ color: '#9B7FFF', cursor: 'pointer' }}>Privacy Policy</span>.
          </p>
        </div>

        {/* Right — phone */}
        <div style={{
          position: 'relative', zIndex: 1,
          width: '52%', minHeight: '100vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderLeft: '1px solid rgba(255,255,255,0.04)',
        }}>
          <div style={{ position: 'absolute', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,92,252,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ transform: 'scale(1.22)', transformOrigin: 'center center', animation: 'phoneIn 0.8s 0.15s cubic-bezier(0.22,1,0.36,1) both' }}>
            <PhoneMockup />
          </div>
        </div>

        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(18px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes phoneIn {
            from { opacity: 0; transform: scale(1.08) translateY(24px); }
            to   { opacity: 1; transform: scale(1.22) translateY(0); }
          }
        `}</style>
      </div>
    </main>
  );
}

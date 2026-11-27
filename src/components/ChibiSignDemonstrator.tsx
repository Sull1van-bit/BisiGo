import React from 'react';

export interface ChibiSignDemonstratorProps {
  character: 'rafael' | 'kana';
  signClass: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animate?: boolean;
  ariaLabel?: string;
}

const SIZE_CLASSES: Record<NonNullable<ChibiSignDemonstratorProps['size']>, string> = {
  xs: 'w-14 h-14',
  sm: 'w-20 h-20',
  md: 'w-32 h-32',
  lg: 'w-44 h-44 sm:w-48 sm:h-48',
  xl: 'w-56 h-56',
};

type FacialMood = 'happy' | 'sleep' | 'calm' | 'cry' | 'focused' | 'read';

interface Palette {
  skin: string;
  skinDark: string;
  skinLight: string;
  hair: string;
  hairHighlight: string;
  hairShadow: string;
  top: string;
  topDark: string;
  topLight: string;
  ink: string;
  blush: string;
  accent: string;
}

const PALETTES: Record<'rafael' | 'kana', Palette> = {
  rafael: {
    skin: '#E6AE82',
    skinDark: '#CC8E61',
    skinLight: '#F7CFB0',
    hair: '#1E1B19',
    hairHighlight: '#3A3531',
    hairShadow: '#12100E',
    top: '#1A8CFF',
    topDark: '#0066CC',
    topLight: '#66B5FF',
    ink: '#281F1A',
    blush: '#FF8A9E',
    accent: '#1A8CFF',
  },
  kana: {
    skin: '#E3AA7E',
    skinDark: '#C98A5F',
    skinLight: '#F6CCA9',
    hair: '#2E231E',
    hairHighlight: '#4E3D35',
    hairShadow: '#1D1512',
    top: '#3B5BDB',
    topDark: '#2B44A8',
    topLight: '#5C7CFA',
    ink: '#281F1A',
    blush: '#FF8A9E',
    accent: '#3B5BDB',
  },
};

function getFacialMood(normalizedSign: string): FacialMood {
  switch (normalizedSign) {
    case 'tidur':
      return 'sleep';
    case 'berdoa':
      return 'calm';
    case 'menangis':
      return 'cry';
    case 'melihat':
    case 'berpikir':
      return 'focused';
    case 'membaca':
    case 'menggambar':
      return 'read';
    default:
      return 'happy';
  }
}

/** Smooth sleeve arm path from shoulder to wrist with rib cuff. */
function ArmSleeve({
  shoulder,
  elbow,
  wrist,
  palette,
  width = 18,
}: {
  shoulder: [number, number];
  elbow: [number, number];
  wrist: [number, number];
  palette: Palette;
  width?: number;
}) {
  const d = `M ${shoulder[0]} ${shoulder[1]} Q ${elbow[0]} ${elbow[1]} ${wrist[0]} ${wrist[1]}`;
  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={palette.ink}
        strokeWidth={width + 5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={d}
        fill="none"
        stroke={palette.top}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Sleeve cuff */}
      <circle
        cx={wrist[0]}
        cy={wrist[1]}
        r={width * 0.48}
        fill={palette.topDark}
        stroke={palette.ink}
        strokeWidth={2.3}
      />
    </g>
  );
}

type HandPoseKind =
  | 'fist'
  | 'point-inward'
  | 'point-up'
  | 'point-side'
  | 'cluster-pinch'
  | 'c-cup'
  | 'flat-palm-open'
  | 'flat-palm-up'
  | 'flat-palm-side'
  | 'v-up'
  | 'v-down'
  | 'two-horizontal'
  | 'ok-draw'
  | 'y-hand'
  | 'relaxed';

/** Detailed chibi hand primitive with crisp outline, thumb, and articulated fingers. */
function ChibiHand({
  kind,
  x,
  y,
  rotate = 0,
  mirrorX = false,
  scale = 1,
  palette,
}: {
  kind: HandPoseKind;
  x: number;
  y: number;
  rotate?: number;
  mirrorX?: boolean;
  scale?: number;
  palette: Palette;
}) {
  const sx = mirrorX ? -scale : scale;
  const stroke = palette.ink;
  const fill = palette.skin;
  const shadow = palette.skinDark;

  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotate}) scale(${sx}, ${scale})`}>
      {kind === 'relaxed' && (
        <g>
          <rect x="-8" y="-9" width="16" height="17" rx="7" fill={fill} stroke={stroke} strokeWidth="2.4" />
          <path d="M -3 -1 Q 0 1 3 -1" fill="none" stroke={shadow} strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}

      {kind === 'fist' && (
        <g>
          <rect x="-11" y="-11" width="22" height="21" rx="9" fill={fill} stroke={stroke} strokeWidth="2.5" />
          {/* Curled finger knuckles */}
          <path d="M -7 -3 Q -3 -6 1 -3 M 1 -3 Q 5 -6 9 -3" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          {/* Thumb wrap across front */}
          <path
            d="M -11 2 Q -3 6 4 2"
            fill="none"
            stroke={stroke}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <rect x="-9" y="1" width="11" height="6" rx="3" fill={shadow} stroke={stroke} strokeWidth="2" />
        </g>
      )}

      {(kind === 'point-up' || kind === 'point-side' || kind === 'point-inward') && (
        <g transform={kind === 'point-inward' ? 'rotate(90)' : kind === 'point-side' ? 'rotate(70)' : ''}>
          {/* Palm + 3 curled fingers */}
          <rect x="-10" y="-7" width="20" height="19" rx="8" fill={fill} stroke={stroke} strokeWidth="2.5" />
          {/* Extended index finger */}
          <rect x="-8" y="-23" width="7.5" height="20" rx="3.8" fill={fill} stroke={stroke} strokeWidth="2.4" />
          {/* Curled middle/ring/pinky bumps */}
          <path d="M 1 -5 C 5 -6 8 -2 8 2 C 8 5 3 6 0 4" fill={shadow} stroke={stroke} strokeWidth="2" />
          {/* Thumb */}
          <rect x="-13" y="-3" width="8" height="11" rx="4" transform="rotate(-15 -9 2)" fill={fill} stroke={stroke} strokeWidth="2.2" />
        </g>
      )}

      {kind === 'cluster-pinch' && (
        <g>
          {/* Wrist & clustered cone pointing toward mouth */}
          <path
            d="M -10 10 C -11 1 -8 -10 0 -17 C 8 -10 11 1 10 10 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Clustered fingertips lines */}
          <path d="M -4 -11 L -2 -3 M 3 -11 L 2 -3" fill="none" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" />
          <ellipse cx="0" cy="-14" rx="4.5" ry="3.5" fill={palette.skinLight} stroke={stroke} strokeWidth="2" />
        </g>
      )}

      {kind === 'c-cup' && (
        <g>
          {/* Curved C-shape cup grip */}
          <path
            d="M 8 -14 C -8 -15 -14 -6 -14 2 C -14 11 -7 16 7 15 C 11 15 11 9 6 9 C -2 9 -5 6 -5 1 C -5 -5 -1 -8 7 -8 C 12 -8 12 -14 8 -14 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Stacked finger ridges */}
          <path d="M 1 -13 L 1 -8 M 1 9 L 1 14" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}

      {kind === 'flat-palm-open' && (
        <g>
          {/* Palm */}
          <rect x="-11" y="-5" width="22" height="19" rx="8" fill={fill} stroke={stroke} strokeWidth="2.4" />
          {/* 4 fingers spread neatly */}
          <rect x="-11" y="-20" width="5" height="17" rx="2.5" transform="rotate(-10 -8 -5)" fill={fill} stroke={stroke} strokeWidth="2.1" />
          <rect x="-5" y="-23" width="5" height="20" rx="2.5" fill={fill} stroke={stroke} strokeWidth="2.1" />
          <rect x="1" y="-22" width="5" height="19" rx="2.5" transform="rotate(6 3 -5)" fill={fill} stroke={stroke} strokeWidth="2.1" />
          <rect x="6" y="-17" width="4.5" height="15" rx="2.2" transform="rotate(14 8 -5)" fill={fill} stroke={stroke} strokeWidth="2.1" />
          {/* Thumb */}
          <rect x="-17" y="-2" width="11" height="6" rx="3" transform="rotate(-25 -10 1)" fill={fill} stroke={stroke} strokeWidth="2.1" />
        </g>
      )}

      {kind === 'flat-palm-up' && (
        <g>
          {/* Perspective flat upward open palm like an open book/tray */}
          <ellipse cx="0" cy="0" rx="18" ry="8.5" fill={fill} stroke={stroke} strokeWidth="2.5" />
          <path d="M -11 0 L 11 0" fill="none" stroke={shadow} strokeWidth="2" strokeLinecap="round" />
          {/* Thumb tip peeking side */}
          <ellipse cx="-14" cy="-4" rx="5" ry="3.2" fill={fill} stroke={stroke} strokeWidth="2.1" />
        </g>
      )}

      {kind === 'flat-palm-side' && (
        <g>
          {/* Flat edge-on hand (chop/pray) */}
          <rect x="-6.5" y="-21" width="13" height="33" rx="6.5" fill={fill} stroke={stroke} strokeWidth="2.5" />
          <path d="M 0 -17 L 0 -5" fill="none" stroke={shadow} strokeWidth="1.8" strokeLinecap="round" />
          <rect x="-10" y="-4" width="6" height="11" rx="3" fill={fill} stroke={stroke} strokeWidth="2.1" />
        </g>
      )}

      {(kind === 'v-up' || kind === 'v-down') && (
        <g transform={kind === 'v-down' ? 'rotate(180)' : ''}>
          {/* Palm base */}
          <rect x="-10" y="-5" width="20" height="17" rx="7.5" fill={fill} stroke={stroke} strokeWidth="2.4" />
          {/* Index & Middle in crisp V */}
          <rect x="-8" y="-24" width="6.5" height="21" rx="3.2" transform="rotate(-14 -5 -4)" fill={fill} stroke={stroke} strokeWidth="2.3" />
          <rect x="2" y="-24" width="6.5" height="21" rx="3.2" transform="rotate(14 5 -4)" fill={fill} stroke={stroke} strokeWidth="2.3" />
          {/* Folded ring/pinky */}
          <ellipse cx="4" cy="1" rx="6" ry="5" fill={shadow} stroke={stroke} strokeWidth="2" />
          {/* Thumb across */}
          <rect x="-11" y="-1" width="10" height="5.5" rx="2.7" fill={fill} stroke={stroke} strokeWidth="2.1" />
        </g>
      )}

      {kind === 'two-horizontal' && (
        <g>
          {/* Two extended fingers pointing sideways together */}
          <rect x="-12" y="-8" width="18" height="16" rx="7" fill={fill} stroke={stroke} strokeWidth="2.4" />
          <rect x="-1" y="-9" width="22" height="6.5" rx="3.2" fill={fill} stroke={stroke} strokeWidth="2.3" />
          <rect x="-1" y="-2" width="21" height="6.5" rx="3.2" fill={fill} stroke={stroke} strokeWidth="2.3" />
          <ellipse cx="-2" cy="5" rx="6" ry="4" fill={shadow} stroke={stroke} strokeWidth="2" />
        </g>
      )}

      {kind === 'ok-draw' && (
        <g>
          {/* Thumb + index pinched together downward as if holding pen */}
          <rect x="-9" y="-11" width="18" height="16" rx="7.5" fill={fill} stroke={stroke} strokeWidth="2.4" />
          <path
            d="M -6 2 L -1 14 L 5 2"
            fill={fill}
            stroke={stroke}
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          <circle cx="0" cy="14" r="2.6" fill={palette.ink} />
        </g>
      )}

      {kind === 'y-hand' && (
        <g>
          {/* Palm */}
          <rect x="-10" y="-5" width="20" height="17" rx="7.5" fill={fill} stroke={stroke} strokeWidth="2.4" />
          {/* Thumb extended out to side */}
          <rect
            x="-21"
            y="-10"
            width="14"
            height="6"
            rx="3"
            transform="rotate(28 -10 -5)"
            fill={fill}
            stroke={stroke}
            strokeWidth="2.2"
          />
          {/* Pinky extended out on opposite side */}
          <rect
            x="7"
            y="-20"
            width="5.5"
            height="18"
            rx="2.7"
            transform="rotate(24 9 -5)"
            fill={fill}
            stroke={stroke}
            strokeWidth="2.2"
          />
          {/* Curled index, middle, ring fingers */}
          <rect x="-7" y="-8" width="5" height="9" rx="2.5" fill={shadow} stroke={stroke} strokeWidth="2" />
          <rect x="-2" y="-9" width="5" height="9.5" rx="2.5" fill={shadow} stroke={stroke} strokeWidth="2" />
          <rect x="3" y="-8" width="5" height="9" rx="2.5" fill={shadow} stroke={stroke} strokeWidth="2" />
        </g>
      )}
    </g>
  );
}

function ChibiHead({
  character,
  mood,
  tiltDeg = 0,
}: {
  character: 'rafael' | 'kana';
  mood: FacialMood;
  tiltDeg?: number;
}) {
  const p = PALETTES[character];
  const transform = tiltDeg !== 0 ? `rotate(${tiltDeg} 110 116)` : undefined;

  return (
    <g transform={transform}>
      {/* Back hair behind head */}
      {character === 'kana' && (
        <g>
          {/* High cute bun on top */}
          <ellipse cx="110" cy="24" rx="19" ry="13.5" fill={p.hair} stroke={p.ink} strokeWidth="2.8" />
          <path d="M 97 22 Q 110 16 122 22" fill="none" stroke={p.hairHighlight} strokeWidth="2.2" strokeLinecap="round" />
          {/* Back silhouette rounded crown (stays clear above shoulders) */}
          <circle cx="110" cy="70" r="44" fill={p.hairShadow} stroke={p.ink} strokeWidth="2.8" />
        </g>
      )}

      {character === 'rafael' && (
        <g>
          {/* Tufted curly/wavy hair back volume */}
          <path
            d="M 65 78
               C 59 62, 65 44, 78 36
               C 86 24, 102 21, 112 24
               C 125 20, 141 26, 148 39
               C 158 49, 161 65, 155 79
               Z"
            fill={p.hair}
            stroke={p.ink}
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
        </g>
      )}

      {/* Ears */}
      <g>
        <ellipse cx="67" cy="84" rx="7" ry="10" fill={p.skin} stroke={p.ink} strokeWidth="2.6" />
        <path d="M 65 81 Q 67 84 65 88" fill="none" stroke={p.skinDark} strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="153" cy="84" rx="7" ry="10" fill={p.skin} stroke={p.ink} strokeWidth="2.6" />
        <path d="M 155 81 Q 153 84 155 88" fill="none" stroke={p.skinDark} strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Face contour (chibi proportions) */}
      <path
        d="M 69 72
           C 69 44, 87 34, 110 34
           C 133 34, 151 44, 151 72
           C 151 102, 134 117, 110 117
           C 86 117, 69 102, 69 72 Z"
        fill={p.skin}
        stroke={p.ink}
        strokeWidth="2.8"
        strokeLinejoin="round"
      />

      {/* Eyebrows */}
      {mood === 'cry' ? (
        <g stroke={p.hair} strokeWidth="3.2" strokeLinecap="round" fill="none">
          <path d="M 80 65 Q 88 61 95 57" />
          <path d="M 140 65 Q 132 61 125 57" />
        </g>
      ) : (
        <g stroke={p.hair} strokeWidth="3.2" strokeLinecap="round" fill="none">
          <path d="M 80 62 Q 89 58 98 62" />
          <path d="M 122 62 Q 131 58 140 62" />
        </g>
      )}

      {/* Eyes */}
      {mood === 'sleep' || mood === 'calm' ? (
        <g stroke={p.ink} strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M 80 79 Q 90 86 100 79" />
          <path d="M 120 79 Q 130 86 140 79" />
          {character === 'kana' && (
            <>
              <path d="M 79 79 L 76 76" strokeWidth="2.3" />
              <path d="M 141 79 L 144 76" strokeWidth="2.3" />
            </>
          )}
        </g>
      ) : (
        <g>
          {/* Left eye */}
          <ellipse cx="90" cy="79" rx="9" ry="10.2" fill="#FFFFFF" stroke={p.ink} strokeWidth="2.4" />
          <ellipse cx="90" cy={mood === 'read' ? 81.5 : 80} rx="6.2" ry="7.2" fill="#3B251B" />
          <circle cx="90" cy={mood === 'read' ? 81.5 : 80} r="3.2" fill="#180F0A" />
          <circle cx="87.5" cy="76.5" r="2.6" fill="#FFFFFF" />
          <circle cx="93" cy="83" r="1.2" fill="#FFFFFF" />
          {/* Right eye */}
          <ellipse cx="130" cy="79" rx="9" ry="10.2" fill="#FFFFFF" stroke={p.ink} strokeWidth="2.4" />
          <ellipse cx="130" cy={mood === 'read' ? 81.5 : 80} rx="6.2" ry="7.2" fill="#3B251B" />
          <circle cx="130" cy={mood === 'read' ? 81.5 : 80} r="3.2" fill="#180F0A" />
          <circle cx="127.5" cy="76.5" r="2.6" fill="#FFFFFF" />
          <circle cx="133" cy="83" r="1.2" fill="#FFFFFF" />
          {character === 'kana' && (
            <>
              <path d="M 80 73 L 77 69" stroke={p.ink} strokeWidth="2.4" strokeLinecap="round" />
              <path d="M 140 73 L 143 69" stroke={p.ink} strokeWidth="2.4" strokeLinecap="round" />
            </>
          )}
          {mood === 'cry' && (
            <>
              <path d="M 82 87 Q 90 92 98 87" fill="#7DD3FC" opacity="0.7" />
              <path d="M 122 87 Q 130 92 138 87" fill="#7DD3FC" opacity="0.7" />
              <ellipse cx="86" cy="96" rx="2.6" ry="4" fill="#38BDF8" stroke="#0284C7" strokeWidth="1.2" />
              <ellipse cx="134" cy="96" rx="2.6" ry="4" fill="#38BDF8" stroke="#0284C7" strokeWidth="1.2" />
            </>
          )}
        </g>
      )}

      {/* Rosy blush */}
      <ellipse cx="79" cy="92" rx="6.5" ry="3.6" fill={p.blush} opacity="0.55" />
      <ellipse cx="141" cy="92" rx="6.5" ry="3.6" fill={p.blush} opacity="0.55" />

      {/* Cute nose */}
      <path d="M 108 87 Q 110 90 112 87" fill="none" stroke={p.skinDark} strokeWidth="2.1" strokeLinecap="round" />

      {/* Mouth */}
      {mood === 'cry' ? (
        <path d="M 102 103 Q 110 97 118 103" fill="none" stroke={p.ink} strokeWidth="2.4" strokeLinecap="round" />
      ) : mood === 'sleep' || mood === 'calm' ? (
        <path d="M 103 100 Q 110 104 117 100" fill="none" stroke={p.ink} strokeWidth="2.3" strokeLinecap="round" />
      ) : (
        <path d="M 101 99 Q 110 107 119 99" fill="none" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
      )}

      {/* Rafael thin round silver glasses */}
      {character === 'rafael' && (
        <g>
          <circle cx="90" cy="80" r="14.5" fill="#FFFFFF" fillOpacity="0.08" stroke="#9CA3AF" strokeWidth="2.5" />
          <circle cx="130" cy="80" r="14.5" fill="#FFFFFF" fillOpacity="0.08" stroke="#9CA3AF" strokeWidth="2.5" />
          <path d="M 104.5 79 Q 110 76.5 115.5 79" fill="none" stroke="#9CA3AF" strokeWidth="2.4" />
          <line x1="69" y1="78" x2="75.5" y2="79" stroke="#9CA3AF" strokeWidth="2.3" />
          <line x1="144.5" y1="79" x2="151" y2="78" stroke="#9CA3AF" strokeWidth="2.3" />
          {/* Crisp lens glint */}
          <path d="M 80 73 L 84 70" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
          <path d="M 120 73 L 124 70" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
        </g>
      )}

      {/* Front hair bangs */}
      {character === 'rafael' ? (
        <g>
          {/* Textured wavy/curly front fringe */}
          <path
            d="M 67 66
               C 67 45, 83 28, 110 28
               C 137 28, 153 45, 153 66
               C 148 56, 141 53, 136 59
               C 132 51, 124 49, 119 57
               C 113 48, 105 49, 100 57
               C 94 49, 86 50, 82 58
               C 77 52, 70 57, 67 66 Z"
            fill={p.hair}
            stroke={p.ink}
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          {/* Curly top highlight */}
          <path
            d="M 84 39 Q 93 34 101 38 M 114 36 Q 124 33 133 39"
            fill="none"
            stroke={p.hairHighlight}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </g>
      ) : (
        <g>
          {/* Kana neat bangs & wispy side locks above jaw */}
          <path
            d="M 68 72
               C 67 47, 85 32, 110 32
               C 135 32, 153 47, 152 72
               C 149 58, 143 52, 137 59
               C 133 49, 123 47, 116 58
               C 111 49, 102 48, 97 58
               C 90 49, 81 51, 78 60
               C 73 55, 70 62, 68 72 Z"
            fill={p.hair}
            stroke={p.ink}
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          {/* Cheek wispy strands (stop cleanly at jaw, never cover shoulders) */}
          <path d="M 69 72 Q 67 90 73 102" fill="none" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 151 72 Q 153 90 147 102" fill="none" stroke={p.ink} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 86 41 Q 108 34 132 41" fill="none" stroke={p.hairHighlight} strokeWidth="2.3" strokeLinecap="round" />
        </g>
      )}
    </g>
  );
}

function ChibiTorso({ character }: { character: 'rafael' | 'kana' }) {
  const p = PALETTES[character];
  return (
    <g>
      {/* Neck + chin shadow */}
      <rect x="100" y="112" width="20" height="19" rx="7" fill={p.skin} stroke={p.ink} strokeWidth="2.6" />
      <path d="M 101 117 Q 110 123 119 117 L 119 122 Q 110 126 101 122 Z" fill={p.skinDark} />

      {/* Upper torso */}
      <path
        d="M 73 136
           C 73 127, 89 124, 110 124
           C 131 124, 147 127, 147 136
           L 150 202
           C 150 207, 145 210, 139 210
           L 81 210
           C 75 210, 70 207, 70 202 Z"
        fill={p.top}
        stroke={p.ink}
        strokeWidth="2.8"
        strokeLinejoin="round"
      />

      {character === 'rafael' ? (
        <g>
          {/* Green hoodie folded collar & white drawstrings */}
          <path
            d="M 86 126 Q 110 144 134 126"
            fill={p.topDark}
            stroke={p.ink}
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path d="M 96 135 Q 110 142 124 135" fill="none" stroke={p.topLight} strokeWidth="2" strokeLinecap="round" />
          <line x1="103" y1="138" x2="101" y2="164" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
          <line x1="117" y1="138" x2="119" y2="164" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        </g>
      ) : (
        <g>
          {/* White tee inside open Royal Cobalt collar */}
          <path
            d="M 94 125 L 110 150 L 126 125 Z"
            fill="#FFFFFF"
            stroke={p.ink}
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          {/* Open jacket lapels */}
          <path
            d="M 90 126 L 106 150 L 96 146 Z"
            fill={p.topLight}
            stroke={p.ink}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M 130 126 L 114 150 L 124 146 Z"
            fill={p.topLight}
            stroke={p.ink}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Sunshine Gold collar trim & zipper accent */}
          <path d="M 90 126 L 106 150 M 130 126 L 114 150" fill="none" stroke="#FFC800" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="110" y1="150" x2="110" y2="208" stroke="#FFFFFF" strokeWidth="2.4" />
          <rect x="107.5" y="150" width="5" height="8" rx="2" fill="#FFC800" stroke="#E5B400" strokeWidth="1.4" />
        </g>
      )}
    </g>
  );
}

/** Motion guides (subtle crisp directional arrows & accents colored by character theme). */
function MotionBadge({
  children,
  animClass,
  animate,
}: {
  children: React.ReactNode;
  animClass: string;
  animate: boolean;
}) {
  return <g className={animate ? animClass : ''}>{children}</g>;
}

/** Renders arms, hands, and motion cues for the exact Roboflow BISINDO static pose. */
function SignPoseArms({
  normalizedSign,
  palette,
  animate,
}: {
  normalizedSign: string;
  palette: Palette;
  animate: boolean;
}) {
  const accent = palette.accent;
  const relaxedLeft = (
    <g>
      <ArmSleeve shoulder={[144, 136]} elbow={[162, 166]} wrist={[154, 196]} palette={palette} />
      <ChibiHand kind="relaxed" x={152} y={200} palette={palette} />
    </g>
  );
  const relaxedRight = (
    <g>
      <ArmSleeve shoulder={[76, 136]} elbow={[58, 166]} wrist={[66, 196]} palette={palette} />
      <ChibiHand kind="relaxed" x={68} y={200} palette={palette} />
    </g>
  );

  switch (normalizedSign) {
    case 'saya':
      // Right index finger pointing directly at center of chest
      return (
        <g>
          {relaxedLeft}
          <ArmSleeve shoulder={[75, 138]} elbow={[56, 164]} wrist={[90, 158]} palette={palette} />
          <MotionBadge animClass="chibi-anim-slide" animate={animate}>
            <ChibiHand kind="point-inward" x={101} y={157} rotate={-4} palette={palette} />
            <circle cx="116" cy="157" r="4" fill={accent} opacity="0.85" />
          </MotionBadge>
        </g>
      );

    case 'makan':
      // Right fingertips pinched together (clustered) held in front of mouth
      return (
        <g>
          {relaxedLeft}
          <ArmSleeve shoulder={[75, 138]} elbow={[54, 152]} wrist={[96, 122]} palette={palette} />
          <MotionBadge animClass="chibi-anim-bob" animate={animate}>
            <ChibiHand kind="cluster-pinch" x={106} y={110} rotate={18} palette={palette} />
            <path d="M 122 104 Q 126 99 122 94" fill="none" stroke={accent} strokeWidth="2.6" strokeLinecap="round" />
          </MotionBadge>
        </g>
      );

    case 'minum':
      // Right C-grip tilted right in front of mouth with thumb near lips
      return (
        <g>
          {relaxedLeft}
          <ArmSleeve shoulder={[75, 138]} elbow={[53, 146]} wrist={[86, 118]} palette={palette} />
          <MotionBadge animClass="chibi-anim-rock" animate={animate}>
            <ChibiHand kind="c-cup" x={99} y={107} rotate={-25} palette={palette} />
            <path d="M 80 96 A 14 14 0 0 1 92 84" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
          </MotionBadge>
        </g>
      );

    case 'tidur':
      // Head tilted sideways resting onto both palms pressed flat together beside right cheek
      return (
        <g>
          <ArmSleeve shoulder={[143, 138]} elbow={[164, 162]} wrist={[88, 122]} palette={palette} />
          <ArmSleeve shoulder={[75, 138]} elbow={[52, 134]} wrist={[76, 116]} palette={palette} />
          <g className={animate ? 'chibi-anim-bob' : ''}>
            <ChibiHand kind="flat-palm-side" x={81} y={102} rotate={-16} palette={palette} />
            <ChibiHand kind="flat-palm-side" x={73} y={101} rotate={-18} palette={palette} />
            <text x="150" y="54" fill={accent} fontWeight="900" fontSize="14">z</text>
            <text x="160" y="42" fill={accent} fontWeight="900" fontSize="17">Z</text>
          </g>
        </g>
      );

    case 'mandi':
      // Both hands clenched lightly in front of chest/shoulders scrubbing up and down
      return (
        <g>
          <ArmSleeve shoulder={[75, 138]} elbow={[54, 162]} wrist={[82, 152]} palette={palette} />
          <ArmSleeve shoulder={[145, 138]} elbow={[166, 162]} wrist={[138, 152]} palette={palette} />
          <MotionBadge animClass="chibi-anim-scrub" animate={animate}>
            <ChibiHand kind="fist" x={88} y={149} rotate={8} palette={palette} />
            <ChibiHand kind="fist" x={132} y={149} rotate={-8} mirrorX palette={palette} />
          </MotionBadge>
          {/* Scrub up-down rails */}
          <path d="M 65 138 L 65 160 M 155 138 L 155 160" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 3" />
        </g>
      );

    case 'duduk':
      // Left 2 fingers extended horizontally, right 2 fingers hooked/stacked directly on top
      return (
        <g>
          <ArmSleeve shoulder={[144, 138]} elbow={[164, 164]} wrist={[132, 168]} palette={palette} />
          <ChibiHand kind="two-horizontal" x={115} y={168} mirrorX palette={palette} />
          <ArmSleeve shoulder={[76, 138]} elbow={[56, 156]} wrist={[90, 146]} palette={palette} />
          <MotionBadge animClass="chibi-anim-down" animate={animate}>
            <ChibiHand kind="two-horizontal" x={105} y={149} rotate={18} palette={palette} />
          </MotionBadge>
          <path d="M 110 128 L 110 137 M 106 134 L 110 138 L 114 134" fill="none" stroke={accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );

    case 'berjalan':
      // Index and middle fingers pointed downward in inverted V stepping forward in front of chest
      return (
        <g>
          {relaxedLeft}
          <ArmSleeve shoulder={[75, 138]} elbow={[56, 156]} wrist={[98, 144]} palette={palette} />
          <MotionBadge animClass="chibi-anim-rock" animate={animate}>
            <ChibiHand kind="v-down" x={110} y={156} palette={palette} />
          </MotionBadge>
          <path d="M 96 188 L 128 188 M 123 184 L 129 188 L 123 192" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );

    case 'berhenti':
      // Left palm open flat facing upward, flat right pinky edge chopping perpendicularly down across center
      return (
        <g>
          <ArmSleeve shoulder={[144, 138]} elbow={[164, 166]} wrist={[136, 174]} palette={palette} />
          <ChibiHand kind="flat-palm-up" x={114} y={174} palette={palette} />
          <ArmSleeve shoulder={[76, 138]} elbow={[56, 148]} wrist={[98, 140]} palette={palette} />
          <MotionBadge animClass="chibi-anim-down" animate={animate}>
            <ChibiHand kind="flat-palm-side" x={112} y={146} rotate={-4} palette={palette} />
          </MotionBadge>
          <path d="M 134 132 L 134 152 M 130 148 L 134 153 L 138 148" fill="none" stroke={accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );

    case 'melihat':
      // Right V fingers held near right eye pointing forward toward camera
      return (
        <g>
          {relaxedLeft}
          <ArmSleeve shoulder={[75, 138]} elbow={[50, 128]} wrist={[68, 99]} palette={palette} />
          <MotionBadge animClass="chibi-anim-bob" animate={animate}>
            <ChibiHand kind="v-up" x={76} y={88} rotate={-14} palette={palette} />
          </MotionBadge>
          {/* Sight rays forward */}
          <path d="M 55 82 L 45 78 M 54 90 L 43 90" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );

    case 'bicara':
      // Index/flat finger held horizontally right in front of chin/mouth pulsing forward
      return (
        <g>
          {relaxedLeft}
          <ArmSleeve shoulder={[75, 138]} elbow={[55, 148]} wrist={[88, 118]} palette={palette} />
          <MotionBadge animClass="chibi-anim-slide" animate={animate}>
            <ChibiHand kind="two-horizontal" x={101} y={110} rotate={-8} palette={palette} />
          </MotionBadge>
          <path d="M 127 104 Q 134 108 127 113 M 134 101 Q 142 108 134 116" fill="none" stroke={accent} strokeWidth="2.4" strokeLinecap="round" />
        </g>
      );

    case 'membaca':
      // Left palm open like book page, right 2 fingers scanning left to right across open palm
      return (
        <g>
          <ArmSleeve shoulder={[144, 138]} elbow={[164, 166]} wrist={[136, 168]} palette={palette} />
          <ChibiHand kind="flat-palm-up" x={115} y={168} rotate={-6} palette={palette} />
          <ArmSleeve shoulder={[75, 138]} elbow={[54, 158]} wrist={[88, 152]} palette={palette} />
          <MotionBadge animClass="chibi-anim-slide" animate={animate}>
            <ChibiHand kind="v-down" x={109} y={145} rotate={20} palette={palette} />
          </MotionBadge>
        </g>
      );

    case 'berpikir':
      // Right index finger touching temple beside brow
      return (
        <g>
          {relaxedLeft}
          <ArmSleeve shoulder={[75, 138]} elbow={[44, 120]} wrist={[56, 86]} palette={palette} />
          <MotionBadge animClass="chibi-anim-pulse" animate={animate}>
            <ChibiHand kind="point-up" x={63} y={76} rotate={18} palette={palette} />
          </MotionBadge>
          {/* Thought lines */}
          <path d="M 46 54 L 38 48 M 55 47 L 52 38" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );

    case 'berdoa':
      // Both palms pressed flat vertically centered at chest
      return (
        <g>
          <ArmSleeve shoulder={[75, 138]} elbow={[58, 168]} wrist={[96, 156]} palette={palette} />
          <ArmSleeve shoulder={[145, 138]} elbow={[162, 168]} wrist={[124, 156]} palette={palette} />
          <MotionBadge animClass="chibi-anim-bob" animate={animate}>
            <ChibiHand kind="flat-palm-side" x={105} y={148} rotate={-4} palette={palette} />
            <ChibiHand kind="flat-palm-side" x={115} y={148} rotate={4} mirrorX palette={palette} />
          </MotionBadge>
        </g>
      );

    case 'bermain':
      // Both hands in Y-handshape (thumb & pinky extended) shaking playfully at shoulder height
      return (
        <g>
          <ArmSleeve shoulder={[75, 138]} elbow={[48, 152]} wrist={[66, 138]} palette={palette} />
          <ArmSleeve shoulder={[145, 138]} elbow={[172, 152]} wrist={[154, 138]} palette={palette} />
          <MotionBadge animClass="chibi-anim-rock" animate={animate}>
            <ChibiHand kind="y-hand" x={66} y={132} rotate={-16} palette={palette} />
            <ChibiHand kind="y-hand" x={154} y={132} rotate={16} mirrorX palette={palette} />
          </MotionBadge>
          <path d="M 52 106 Q 66 99 80 106 M 140 106 Q 154 99 168 106" fill="none" stroke={accent} strokeWidth="2.4" strokeLinecap="round" />
        </g>
      );

    case 'membuat':
      // Both fists stacked vertically in front of chest rotating slightly against each other
      return (
        <g>
          <ArmSleeve shoulder={[144, 138]} elbow={[164, 170]} wrist={[128, 172]} palette={palette} />
          <ChibiHand kind="fist" x={110} y={168} mirrorX palette={palette} />
          <ArmSleeve shoulder={[76, 138]} elbow={[56, 156]} wrist={[92, 144]} palette={palette} />
          <MotionBadge animClass="chibi-anim-rock" animate={animate}>
            <ChibiHand kind="fist" x={110} y={144} palette={palette} />
          </MotionBadge>
          <path d="M 134 140 A 10 10 0 0 1 134 156" fill="none" stroke={accent} strokeWidth="2.4" strokeLinecap="round" />
        </g>
      );

    case 'menggambar':
      // Left open palm facing upward like drawing pad, right pinched hand tracing zig-zag across it
      return (
        <g>
          <ArmSleeve shoulder={[144, 138]} elbow={[164, 168]} wrist={[138, 170]} palette={palette} />
          <ChibiHand kind="flat-palm-up" x={118} y={169} palette={palette} />
          <ArmSleeve shoulder={[75, 138]} elbow={[54, 154]} wrist={[90, 146]} palette={palette} />
          <MotionBadge animClass="chibi-anim-slide" animate={animate}>
            <ChibiHand kind="ok-draw" x={112} y={148} palette={palette} />
          </MotionBadge>
          {/* Drawn zigzag mark */}
          <path d="M 106 169 L 113 165 L 120 170 L 126 166" fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );

    case 'menuangkan':
      // Right fist gripping imaginary pitcher handle tilted sideways pouring downward
      return (
        <g>
          <ArmSleeve shoulder={[145, 138]} elbow={[164, 168]} wrist={[150, 192]} palette={palette} />
          <ChibiHand kind="relaxed" x={148} y={195} rotate={-10} mirrorX scale={0.92} palette={palette} />
          <ArmSleeve shoulder={[75, 138]} elbow={[50, 144]} wrist={[84, 138]} palette={palette} />
          <MotionBadge animClass="chibi-anim-rock" animate={animate}>
            <ChibiHand kind="fist" x={95} y={136} rotate={122} palette={palette} />
          </MotionBadge>
          {/* Sideways tilt arc + downward pour stream */}
          <path d="M 82 117 A 15 15 0 0 1 104 120" fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M 108 145 Q 119 156 121 178" fill="none" stroke={accent} strokeWidth="2.8" strokeLinecap="round" strokeDasharray="3 4" />
        </g>
      );

    case 'mendorong':
      // Both flat open palms forward chest-high facing outward pushing forward
      return (
        <g>
          <ArmSleeve shoulder={[75, 138]} elbow={[56, 160]} wrist={[80, 154]} palette={palette} />
          <ArmSleeve shoulder={[145, 138]} elbow={[164, 160]} wrist={[140, 154]} palette={palette} />
          <MotionBadge animClass="chibi-anim-pulse" animate={animate}>
            <ChibiHand kind="flat-palm-open" x={84} y={148} rotate={-6} palette={palette} />
            <ChibiHand kind="flat-palm-open" x={136} y={148} rotate={6} mirrorX palette={palette} />
          </MotionBadge>
          <path d="M 60 144 Q 54 148 60 154 M 160 144 Q 166 148 160 154" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );

    case 'memeluk':
      // Both arms wrapped across chest hugging opposite shoulders/upper arms
      return (
        <g>
          <MotionBadge animClass="chibi-anim-pulse" animate={animate}>
            {/* Right arm crossing toward left arm/shoulder */}
            <ArmSleeve shoulder={[74, 138]} elbow={[58, 174]} wrist={[134, 154]} palette={palette} width={17} />
            <ChibiHand kind="flat-palm-side" x={141} y={150} rotate={-45} scale={0.9} palette={palette} />
            {/* Left arm crossing over toward right shoulder */}
            <ArmSleeve shoulder={[146, 138]} elbow={[162, 174]} wrist={[86, 154]} palette={palette} width={17} />
            <ChibiHand kind="flat-palm-side" x={79} y={150} rotate={45} scale={0.9} mirrorX palette={palette} />
          </MotionBadge>
        </g>
      );

    case 'memukul':
      // Right fist punching sideways against open flat left palm
      return (
        <g>
          <ArmSleeve shoulder={[145, 138]} elbow={[166, 160]} wrist={[138, 156]} palette={palette} />
          <ChibiHand kind="flat-palm-side" x={128} y={151} rotate={-6} palette={palette} />
          <ArmSleeve shoulder={[75, 138]} elbow={[54, 158]} wrist={[82, 154]} palette={palette} />
          <MotionBadge animClass="chibi-anim-slide" animate={animate}>
            <ChibiHand kind="fist" x={97} y={152} palette={palette} />
          </MotionBadge>
          {/* Impact sparks */}
          <path d="M 113 137 L 116 143 M 113 166 L 116 160" stroke="#FF9600" strokeWidth="2.6" strokeLinecap="round" />
        </g>
      );

    case 'menangis':
      // Both index fingers tracing downward along both cheeks beneath eyes
      return (
        <g>
          <ArmSleeve shoulder={[74, 138]} elbow={[48, 126]} wrist={[68, 108]} palette={palette} />
          <ArmSleeve shoulder={[146, 138]} elbow={[172, 126]} wrist={[152, 108]} palette={palette} />
          <MotionBadge animClass="chibi-anim-down" animate={animate}>
            <ChibiHand kind="point-up" x={75} y={96} rotate={12} scale={0.92} palette={palette} />
            <ChibiHand kind="point-up" x={145} y={96} rotate={-12} mirrorX scale={0.92} palette={palette} />
          </MotionBadge>
        </g>
      );

    // === PATULI-ML ANGKA (0–10) ===
    case 'nol':
    case 'o':
    case 'c':
    case 'g':
    case 'q':
      return (
        <g>
          {relaxedLeft}
          <ArmSleeve shoulder={[75, 138]} elbow={[52, 146]} wrist={[78, 126]} palette={palette} />
          <MotionBadge animClass="chibi-anim-bob" animate={animate}>
            <ChibiHand kind="c-cup" x={84} y={114} rotate={-10} palette={palette} />
          </MotionBadge>
        </g>
      );

    case 'satu':
    case 'i':
    case 'j':
    case 'atas':
      return (
        <g>
          {relaxedLeft}
          <ArmSleeve shoulder={[75, 138]} elbow={[50, 142]} wrist={[74, 124]} palette={palette} />
          <MotionBadge animClass="chibi-anim-bob" animate={animate}>
            <ChibiHand kind="point-up" x={76} y={110} rotate={-4} palette={palette} />
          </MotionBadge>
        </g>
      );

    case 'dua':
    case 'tiga':
    case 'u':
    case 'v':
    case 'r':
      return (
        <g>
          {relaxedLeft}
          <ArmSleeve shoulder={[75, 138]} elbow={[52, 148]} wrist={[78, 130]} palette={palette} />
          <MotionBadge animClass="chibi-anim-bob" animate={animate}>
            <ChibiHand kind="v-up" x={80} y={118} rotate={-6} palette={palette} />
          </MotionBadge>
        </g>
      );

    case 'empat':
    case 'lima':
    case 'enam':
    case 'tujuh':
    case 'delapan':
    case 'sembilan':
    case 'sepuluh':
      return (
        <g>
          {relaxedLeft}
          <ArmSleeve shoulder={[75, 138]} elbow={[50, 146]} wrist={[78, 128]} palette={palette} />
          <MotionBadge animClass="chibi-anim-pulse" animate={animate}>
            <ChibiHand kind="flat-palm-open" x={80} y={116} rotate={-8} palette={palette} />
          </MotionBadge>
        </g>
      );

    // === PATULI-ML KATA (23 words) ===
    case 'kamu':
    case 'kanan':
      return (
        <g>
          {relaxedLeft}
          <ArmSleeve shoulder={[75, 138]} elbow={[50, 152]} wrist={[68, 142]} palette={palette} />
          <MotionBadge animClass="chibi-anim-slide" animate={animate}>
            <ChibiHand kind="point-side" x={60} y={140} rotate={-70} palette={palette} />
          </MotionBadge>
        </g>
      );

    case 'kiri':
      return (
        <g>
          {relaxedRight}
          <ArmSleeve shoulder={[145, 138]} elbow={[170, 152]} wrist={[152, 142]} palette={palette} />
          <MotionBadge animClass="chibi-anim-slide" animate={animate}>
            <ChibiHand kind="point-side" x={160} y={140} rotate={70} mirrorX palette={palette} />
          </MotionBadge>
        </g>
      );

    case 'bawah':
    case 'lagi':
      return (
        <g>
          {relaxedLeft}
          <ArmSleeve shoulder={[75, 138]} elbow={[52, 144]} wrist={[78, 128]} palette={palette} />
          <MotionBadge animClass="chibi-anim-down" animate={animate}>
            <ChibiHand kind="v-down" x={80} y={142} rotate={8} palette={palette} />
          </MotionBadge>
        </g>
      );

    case 'siapa':
    case 'perempuan':
      return (
        <g>
          {relaxedLeft}
          <ArmSleeve shoulder={[75, 138]} elbow={[50, 134]} wrist={[76, 114]} palette={palette} />
          <MotionBadge animClass="chibi-anim-bob" animate={animate}>
            <ChibiHand kind="fist" x={84} y={106} rotate={-14} palette={palette} />
          </MotionBadge>
        </g>
      );

    case 'apa':
    case 'mana':
    case 'sama-sama':
    case 'sama sama':
      return (
        <g>
          <ArmSleeve shoulder={[75, 138]} elbow={[54, 160]} wrist={[80, 156]} palette={palette} />
          <ArmSleeve shoulder={[145, 138]} elbow={[166, 160]} wrist={[140, 156]} palette={palette} />
          <MotionBadge animClass="chibi-anim-rock" animate={animate}>
            <ChibiHand kind="flat-palm-up" x={84} y={156} palette={palette} />
            <ChibiHand kind="flat-palm-up" x={136} y={156} palette={palette} />
          </MotionBadge>
        </g>
      );

    case 'terima kasih':
    case 'terima-kasih':
      return (
        <g>
          {relaxedLeft}
          <ArmSleeve shoulder={[75, 138]} elbow={[54, 148]} wrist={[92, 122]} palette={palette} />
          <MotionBadge animClass="chibi-anim-slide" animate={animate}>
            <ChibiHand kind="flat-palm-side" x={104} y={114} rotate={24} palette={palette} />
          </MotionBadge>
        </g>
      );

    case 'betul':
    case 'kuat':
      return (
        <g>
          {relaxedLeft}
          <ArmSleeve shoulder={[75, 138]} elbow={[50, 148]} wrist={[78, 134]} palette={palette} />
          <MotionBadge animClass="chibi-anim-pulse" animate={animate}>
            <ChibiHand kind="fist" x={82} y={126} rotate={-10} palette={palette} />
          </MotionBadge>
        </g>
      );

    case 'salah':
    case 'l':
      return (
        <g>
          {relaxedLeft}
          <ArmSleeve shoulder={[75, 138]} elbow={[50, 146]} wrist={[76, 128]} palette={palette} />
          <MotionBadge animClass="chibi-anim-rock" animate={animate}>
            <ChibiHand kind="y-hand" x={78} y={118} rotate={-12} palette={palette} />
          </MotionBadge>
        </g>
      );

    case 'laki-laki':
    case 'laki laki':
      return (
        <g>
          {relaxedLeft}
          <ArmSleeve shoulder={[75, 138]} elbow={[46, 118]} wrist={[62, 82]} palette={palette} />
          <MotionBadge animClass="chibi-anim-bob" animate={animate}>
            <ChibiHand kind="flat-palm-open" x={66} y={72} rotate={-18} scale={0.9} palette={palette} />
          </MotionBadge>
        </g>
      );

    case 'cinta':
    case 'ingin':
      return (
        <g>
          <ArmSleeve shoulder={[74, 138]} elbow={[58, 170]} wrist={[122, 152]} palette={palette} width={17} />
          <ChibiHand kind="flat-palm-side" x={128} y={148} rotate={-38} scale={0.9} palette={palette} />
          <ArmSleeve shoulder={[146, 138]} elbow={[162, 170]} wrist={[98, 152]} palette={palette} width={17} />
          <ChibiHand kind="flat-palm-side" x={92} y={148} rotate={38} scale={0.9} mirrorX palette={palette} />
        </g>
      );

    case 'sahabat':
    case 'hubungan':
    case 'x':
      return (
        <g>
          <ArmSleeve shoulder={[75, 138]} elbow={[56, 158]} wrist={[96, 148]} palette={palette} />
          <ArmSleeve shoulder={[145, 138]} elbow={[164, 158]} wrist={[124, 148]} palette={palette} />
          <MotionBadge animClass="chibi-anim-pulse" animate={animate}>
            <ChibiHand kind="point-up" x={104} y={140} rotate={32} palette={palette} />
            <ChibiHand kind="point-up" x={116} y={140} rotate={-32} mirrorX palette={palette} />
          </MotionBadge>
        </g>
      );

    case 'menulis':
    case 'waktu':
      return (
        <g>
          <ArmSleeve shoulder={[144, 138]} elbow={[164, 168]} wrist={[136, 168]} palette={palette} />
          <ChibiHand kind="flat-palm-up" x={118} y={168} palette={palette} />
          <ArmSleeve shoulder={[75, 138]} elbow={[54, 154]} wrist={[92, 146]} palette={palette} />
          <MotionBadge animClass="chibi-anim-slide" animate={animate}>
            <ChibiHand kind="ok-draw" x={112} y={148} palette={palette} />
          </MotionBadge>
        </g>
      );

    // === PATULI-ML ABJAD (A–Z two-hand & single-hand poses) ===
    case 'a':
    case 'w':
    case 'y':
    case 'm':
    case 'n':
      return (
        <g>
          <ArmSleeve shoulder={[75, 138]} elbow={[54, 158]} wrist={[92, 146]} palette={palette} />
          <ArmSleeve shoulder={[145, 138]} elbow={[166, 158]} wrist={[128, 146]} palette={palette} />
          <MotionBadge animClass="chibi-anim-pulse" animate={animate}>
            <ChibiHand kind="v-up" x={98} y={138} rotate={24} palette={palette} />
            <ChibiHand kind="v-up" x={122} y={138} rotate={-24} mirrorX palette={palette} />
          </MotionBadge>
        </g>
      );

    case 'b':
    case 'd':
    case 'k':
    case 'p':
    case 's':
    case 't':
    case 'h':
    case 'z':
      return (
        <g>
          <ArmSleeve shoulder={[145, 138]} elbow={[166, 158]} wrist={[126, 148]} palette={palette} />
          <ChibiHand kind="point-up" x={120} y={138} mirrorX palette={palette} />
          <ArmSleeve shoulder={[75, 138]} elbow={[54, 154]} wrist={[94, 142]} palette={palette} />
          <MotionBadge animClass="chibi-anim-bob" animate={animate}>
            <ChibiHand kind="c-cup" x={104} y={134} rotate={12} palette={palette} />
          </MotionBadge>
        </g>
      );

    case 'e':
    case 'f':
      return (
        <g>
          {relaxedLeft}
          <ArmSleeve shoulder={[75, 138]} elbow={[52, 146]} wrist={[80, 128]} palette={palette} />
          <MotionBadge animClass="chibi-anim-bob" animate={animate}>
            <ChibiHand kind="two-horizontal" x={86} y={122} rotate={-6} palette={palette} />
          </MotionBadge>
        </g>
      );

    default:
      return (
        <g>
          {relaxedLeft}
          {relaxedRight}
        </g>
      );
  }
}

export const ChibiSignDemonstrator: React.FC<ChibiSignDemonstratorProps> = ({
  character,
  signClass,
  size = 'md',
  className = '',
  animate = true,
  ariaLabel,
}) => {
  const normalized = signClass.trim().toLowerCase();
  const palette = PALETTES[character];
  const mood = getFacialMood(normalized);
  const headTilt = normalized === 'tidur' ? -11 : 0;
  const defaultAriaLabel = `Demonstrasi isyarat BISINDO ${signClass} oleh ${character === 'rafael' ? 'Rafael' : 'Kana'}`;

  return (
    <svg
      viewBox="0 0 220 220"
      className={`${SIZE_CLASSES[size]} select-none ${className}`}
      role="img"
      aria-label={ariaLabel ?? defaultAriaLabel}
    >
      {/* Subtle backdrop halo in dark mode so dark hair stays distinct on slate */}
      <circle cx="110" cy="112" r="84" className="fill-transparent dark:fill-[#1A8CFF]/10" />

      {/* Soft grounded studio floor oval */}
      <ellipse cx="110" cy="208" rx="56" ry="7" className="fill-[#E2E8F0] dark:fill-[#090E1A]" opacity="0.65" />

      {/* Torso behind head */}
      <ChibiTorso character={character} />

      {/* Chibi Head with character hair, eyes, expression, and Rafael's silver glasses */}
      <ChibiHead character={character} mood={mood} tiltDeg={headTilt} />

      {/* Foreground Articulated Arms, Hands & Motion Accents */}
      <SignPoseArms normalizedSign={normalized} palette={palette} animate={animate} />
    </svg>
  );
};

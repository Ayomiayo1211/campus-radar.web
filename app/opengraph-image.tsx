import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Campus Radar — Student news, campus updates and opportunities at FUNAAB';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 76px',
          background: '#102b66',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -110,
            top: -210,
            width: 620,
            height: 620,
            borderRadius: 310,
            border: '2px solid rgba(255,255,255,0.13)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 15,
            top: -90,
            width: 430,
            height: 430,
            borderRadius: 215,
            border: '2px solid rgba(255,255,255,0.10)',
            display: 'flex',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 18,
              height: 54,
              borderRadius: 9,
              background: '#f2b544',
              display: 'flex',
            }}
          />
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1 }}>
            CAMPUS RADAR
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 900 }}>
          <div
            style={{
              color: '#f2b544',
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 5,
              marginBottom: 22,
            }}
          >
            FUNAAB · CAMPUS &amp; BEYOND
          </div>
          <div
            style={{
              fontSize: 72,
              lineHeight: 1.08,
              fontWeight: 800,
              letterSpacing: -3,
            }}
          >
            Stories that
            <br />
            move campus.
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 27,
              lineHeight: 1.35,
              color: '#dce6fb',
            }}
          >
            Student news, campus updates and opportunities.
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255,255,255,0.28)',
            paddingTop: 22,
            fontSize: 19,
            color: '#dce6fb',
          }}
        >
          <div>www.campusradarfunaab.com.ng</div>
          <div style={{ color: '#f2b544', fontWeight: 700 }}>INFORM · CONNECT · ENGAGE</div>
        </div>
      </div>
    ),
    { ...size }
  );
}

import React from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, Audio } from 'remotion';

export const MyComp = ({ title, script }) => {
  const frame = useCurrentFrame();
  const text = script || 'Auto-generated short-form video';

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f172a', color: '#f8fafc', padding: 64, fontFamily: 'Arial, sans-serif' }}>
      <Sequence from={0} durationInFrames={60}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
          <div style={{ fontSize: 42, fontWeight: 700, marginBottom: 20 }}>{title}</div>
          <div style={{ fontSize: 28, lineHeight: 1.5, maxWidth: 960 }}>{text}</div>
        </div>
      </Sequence>
      <Sequence from={60} durationInFrames={60}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>
          {frame > 0 ? 'Follow for more practical systems and automation workflows.' : ''}
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};

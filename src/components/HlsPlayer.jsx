import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

const HlsPlayer = ({ src, autoPlay = true, controls = true }) => {
  const videoRef = useRef();

  useEffect(() => {
    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: function (xhr) {
          xhr.withCredentials = true; // ✅ 允許攜帶 cookie（如果後端驗證）
        }
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, function () {
        if (autoPlay) video.play();
      });

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari 原生支援 HLS
      video.src = src;
    }
  }, [src, autoPlay]);

  return (
    <video
      ref={videoRef}
      controls={controls}
      style={{ width: '100%', maxWidth: '800px' }}
    />
  );
};

export default HlsPlayer;
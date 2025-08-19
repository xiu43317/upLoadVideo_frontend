import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

const HlsPlayer = ({ src, autoPlay = false, controls = false }) => {
  const videoRef = useRef();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 進度（百分比）
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  // 快轉5秒
  const handleForward = () => {
    videoRef.current.currentTime += 5;
  };
  // 倒退5秒
  const handleBackward = () => {
    videoRef.current.currentTime -= 5;
  };
  // 播放/暫停
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  // 更新時間與進度
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      setProgress((current / total) * 100);
    }
  };
  // 記錄總時長
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };
  // 拖曳進度條
  const handleSeek = (e) => {
    const value = e.target.value;
    if (videoRef.current) {
      const seekTime = (value / 100) * videoRef.current.duration;
      videoRef.current.currentTime = seekTime;
      setProgress(value);
    }
  };
  // 倍速播放
  const changeSpeed = (rate) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };
  // 格式化時間
  const formatTime = (time) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };
  useEffect(() => {
    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: function (xhr) {
          xhr.withCredentials = true; // ✅ 允許攜帶 cookie（如果後端驗證）
        },
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, function () {
        if (autoPlay) video.play();
      });

      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari 原生支援 HLS
      video.src = src;
    }
  }, [src, autoPlay]);

  return (
    <>
      <video
        ref={videoRef}
        controls={controls}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        style={{ width: "100%", maxWidth: "800px", display: "block" }}
      />
      {/* 控制列 */}
      <div
        style={{
          width: "100%",
          maxWidth: "800px",
          marginTop: "10px",
          background: "#222",
          padding: "10px",
          borderRadius: "10px",
          color: "#fff",
        }}
      >
        <button onClick={togglePlay}>{isPlaying ? "⏸ 暫停" : "▶ 播放"}</button>
        <button onClick={handleBackward}>⏪ 倒退 5 秒</button>
        <button onClick={handleForward}>⏩ 快轉 5 秒</button>

        {/* 進度條 */}
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleSeek}
          style={{ width: "200px", margin: "0 10px" }}
        />

        {/* 時間顯示 */}
        <span>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        {/* 倍速控制 */}
        <select
          value={playbackRate}
          onChange={(e) => changeSpeed(Number(e.target.value))}
          style={{ marginLeft: "10px" }}
        >
          <option value={0.5}>0.5x</option>
          <option value={1}>1x</option>
          <option value={1.5}>1.5x</option>
          <option value={2}>2x</option>
        </select>
      </div>
    </>
  );
};

export default HlsPlayer;

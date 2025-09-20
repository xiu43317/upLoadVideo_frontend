import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import io from "socket.io-client";
import axios from "axios";

const socket = io("http://localhost:3000"); // 連線到後端

const HlsPlayer = ({ id, src, autoPlay = false, controls = false }) => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const inputRef = useRef();
  const didFetch = useRef(false); // flag
  const [danmus, setDanmus] = useState([]);
  const [showDanmu, setShowDanmu] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 進度（百分比）
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  // 彈幕物件
  class Danmu {
    constructor(text, time, color = "white", fontSize = 24, speed = 2) {
      this.text = text;
      this.time = time; // 關鍵：記錄對應的影片時間
      this.color = color;
      this.fontSize = fontSize;
      this.speed = speed;
      this.x = canvasRef.current?.width || 640;
      this.y = Math.random() * (canvasRef.current?.height - fontSize);
      this.width = 0;
      this.isActive = false;
    }
    init(ctx) {
      ctx.font = `${this.fontSize}px sans-serif`;
      this.width = ctx.measureText(this.text).width;
    }
    reset() {
      // 當影片 seek 時要重置
      this.x = canvasRef.current?.width || 640;
      this.isActive = false;
    }
    update(deltaTime) {
      this.x -= this.speed * (deltaTime / 16);
    }
    draw(ctx) {
      ctx.font = `${this.fontSize}px sans-serif`;
      ctx.fillStyle = this.color;
      ctx.fillText(this.text, this.x, this.y + this.fontSize);
    }
    // 轉成純物件，方便傳給後端
    toJSON() {
      return {
        text: this.text,
        time: this.time,
        color: this.color,
        fontSize: this.fontSize,
        speed: this.speed,
      };
    }
  }

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
  // 轉回秒數
  const parseTimeToSeconds = (timeStr) => {
    const [mins, secs] = timeStr.split(":").map(Number);
    return mins * 60 + secs;
  };
  const getDanmus = async () => {
    try {
      const result = await axios.post(
        "http://localhost:3000/findDanmus",
        { videoId: id },
        {
          withCredentials: true,
        }
      );
      console.log(result.data.danmus);
      result.data.danmus.forEach((d) => {
        const newDanmu = new Danmu(d.text, parseTimeToSeconds(d.time));
        setDanmus((prev) => [...prev, newDanmu]);
      });
    } catch (err) {
      console.log(err);
    }
  };
  // 發送彈幕
  const handleSend = () => {
    const text = inputRef.current.value.trim();
    if (!text) return;

    const newDanmu = {
      id,
      text,
      time: formatTime(videoRef.current.currentTime),
    };
    console.log(newDanmu);
    // 發送給 server（自己也會收到 newDanmu）
    socket.emit("newDanmu", newDanmu);
    inputRef.current.value = "";
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
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let animationId;
    let lastTime = 0;

    function animate(time) {
      const deltaTime = time - lastTime;
      lastTime = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const currentTime = videoRef.current.currentTime;

      // 啟動該出現的彈幕
      danmus.forEach((d) => {
        if (!d.isActive && currentTime >= d.time) {
          d.isActive = true;
          d.init(ctx);
        }
      });

      // ✅ 只有在影片播放時才更新位置
      if (!videoRef.current.paused) {
        danmus.forEach((d) => {
          if (d.isActive) {
            d.update(deltaTime);
          }
        });
      }

      // 不論暫停或播放，都需要畫畫面（暫停時畫面就定住）
      danmus.forEach((d) => {
        if (d.isActive) {
          d.draw(ctx);
        }
      });

      animationId = requestAnimationFrame(animate);
    }

    animationId = requestAnimationFrame(animate);

    // 監聽影片往回拉
    const handleSeek = () => {
      const currentTime = videoRef.current.currentTime;
      danmus.forEach((d) => {
        if (currentTime < d.time) {
          d.reset(); // 重置還沒到時間的彈幕
        } else {
          d.isActive = false; // 重新等待觸發
        }
      });
    };
    videoRef.current.addEventListener("seeked", handleSeek);

    return () => {
      cancelAnimationFrame(animationId);
      // videoRef.current.removeEventListener("seeked", handleSeek);
    };
  }, [danmus]);
  // 監聽 socket 新彈幕
  useEffect(() => {
    socket.on("danmuBroadcast", (danmu) => {
      console.log(danmu);
      const newDanmu = new Danmu(
        danmu.text,
        videoRef.current.currentTime + 0.5
      );
      setDanmus((prev) => [...prev, newDanmu]);
    });

    return () => {
      socket.off("danmuBroadcast");
    };
  }, []);
  useEffect(()=>{
    if(didFetch.current) return
    didFetch.current = true;
    getDanmus()
  },[])
  return (
    <>
      <video
        ref={videoRef}
        controls={controls}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        style={{ width: "100%", maxWidth: "800px", display: "block" }}
      />
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          maxWidth: "800px",
          height: "500px",
          display: showDanmu ? "block" : "none",
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
          // backgroundColor: "red"
        }}
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
          value={progress ? progress : "0"}
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
      <div style={{ marginTop: 10 }}>
        <input ref={inputRef} type="text" placeholder="輸入彈幕文字" />
        <button onClick={handleSend}>發送彈幕</button>
      </div>
      <div style={{ marginTop: 10 }}>
        <label>
          <input
            type="checkbox"
            checked={showDanmu}
            onChange={(e) => setShowDanmu(e.target.checked)}
          />
          顯示彈幕
        </label>
      </div>
    </>
  );
};

export default HlsPlayer;

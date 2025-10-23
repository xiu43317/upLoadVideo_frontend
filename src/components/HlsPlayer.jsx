import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import io from "socket.io-client";
import axios from "axios";
import TimelineCard from "./TimelineCard"; // ✅ 引入卡片元件

const socket = io("http://localhost:3000"); // 連線到後端

const HlsPlayer = ({ id, src, strDir, autoPlay = false, controls = false }) => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const inputRef = useRef();

  // 🟡 新增這些 state
  const [notes, setNotes] = useState([]); // 所有時間提示
  const [activeCard, setActiveCard] = useState(null); // 目前顯示的卡片
  const [noteInput, setNoteInput] = useState("");
  const didFetch = useRef(false); // flag
  // const [danmus, setDanmus] = useState([]);
  const danmusRef = useRef([]); // 存放彈幕物件，不觸發 re-render
  const [showDanmu, setShowDanmu] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 進度（百分比）
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [subtitleUrl, setSubtitleUrl] = useState(null);
  const [showSubtitle, setShowSubtitle] = useState(true);

  // 🟡 儲存卡片資訊（實務上這裡可以改成 axios POST 存到 MongoDB）
  const handleSaveNote = async () => {
    if (noteInput.trim() === "") return;
    await handleSendCard();

    // 偵測所有 URL
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = noteInput.match(urlRegex) || [];
    // 將 URL 從文字中去掉，留下純文字內容
    let content = noteInput;
    urls.forEach((u) => {
      content = content.replace(u, "");
    });

    const newNote = {
      time: videoRef.current.currentTime,
      content,
      links: urls,
    };

    setNotes((prev) => [...prev, newNote]);
    setNoteInput("");
  };
  // 儲存卡片
  const handleSendCard = async () => {
    const text = noteInput;
    if (!text) return;
    const newNote = {
      time: videoRef.current.currentTime,
      content: text,
    };
    try {
      const result = await axios.post(
        "http://localhost:3000/addCard",
        { videoId: id, cardData: newNote },
        {
          withCredentials: true,
        }
      );
      console.log(result);
    } catch (err) {
      console.log(err);
    }
  };
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
  // 🟡 當時間更新時，也檢查是否要顯示卡片
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      setProgress((current / total) * 100);
      // 找出當前時間應該顯示的卡片
      const found = notes.find(
        (n) => Math.abs(n.time - current) < 0.5 // 誤差 0.5 秒
      );

      // 如果找到了而且目前沒有顯示卡片，才觸發顯示
      if (found && (!activeCard || activeCard !== found)) {
        setActiveCard(found);
        // 三秒後自動關閉
        setTimeout(() => setActiveCard(null), 3000);
      }
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
  //抓取歷史彈幕
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
        danmusRef.current.push(newDanmu); // ✅ 不會觸發 React render
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
  //向後端發起得到卡片資訊
const getCards = async () => {
  try {
    const result = await axios.post(
      "http://localhost:3000/findCards",
      { videoId: id },
      { withCredentials: true }
    );

    const processedNotes = result.data.cards.map((data) => {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = data.content.match(urlRegex) || [];

      // 移除文字中的 URL
      let content = data.content;
      urls.forEach((u) => {
        content = content.replace(u, "");
      });

      return {
        time: data.time,
        content: content.trim(),
        links: urls,
      };
    });

    // 一次性設定 notes
    setNotes(processedNotes);
  } catch (err) {
    console.log(err);
  }
};

  // 抓取歷史卡片資訊
  useEffect(() => {
    getCards();
  }, [id]);
  // 抓取字幕
  useEffect(() => {
    console.log(strDir);
    const loadSubtitles = async () => {
      try {
        const response = await axios.get(
          strDir,
          { responseType: "text" } // 👈 回傳純文字格式
        );

        const blob = new Blob([response.data], { type: "text/vtt" });
        const blobUrl = URL.createObjectURL(blob);
        setSubtitleUrl(blobUrl);
      } catch (error) {
        console.error("❌ 字幕載入失敗:", error);
      }
    };

    loadSubtitles();
  }, [strDir]);
  // 建立track載入字幕
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !subtitleUrl) return;

    // 清除舊的 track，避免重複
    Array.from(video.querySelectorAll("track")).forEach((track) =>
      track.remove()
    );

    // 建立新的 track
    const track = document.createElement("track");
    track.kind = "subtitles";
    track.label = "繁體中文";
    track.srclang = "zh-TW";
    track.src = subtitleUrl;
    track.default = true;
    video.appendChild(track);
    // 當字幕載入完成後顯示
    setTimeout(() => {
      if (video.textTracks && video.textTracks[0]) {
        video.textTracks[0].mode = "showing";
        console.log("✅ 字幕載入成功，已顯示");
      }
    }, 500);
  }, [subtitleUrl]);
  // 開啟字幕偵測
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // 取得 track 元素
    const track = video.textTracks[0];
    if (!track) return;

    // 依照 checkbox 切換字幕顯示
    if (showSubtitle) {
      track.mode = "showing"; // 顯示字幕
    } else {
      track.mode = "hidden"; // 隱藏字幕（不移除）
    }
  }, [showSubtitle]);
  useEffect(() => {
    const video = videoRef.current;
    console.log(strDir);

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
        // const track = document.createElement("track");
        // track.kind = "subtitles";
        // track.src = strDir;
        // track.srclang = "zh-TW";
        // track.label = "繁體中文";
        // track.default = true;
        // video.appendChild(track);
        // video.textTracks[0].mode = "showing"; // ✅ 強制開啟字幕
      });
      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari 原生支援 HLS
      video.src = src;
    }
  }, [src, autoPlay, strDir]);
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
      danmusRef.current.forEach((d) => {
        if (!d.isActive && currentTime >= d.time) {
          d.isActive = true;
          d.init(ctx);
        }
      });

      // ✅ 只有在影片播放時才更新位置
      if (!videoRef.current.paused) {
        danmusRef.current.forEach((d) => {
          if (d.isActive) {
            d.update(deltaTime);
          }
        });
      }

      // 不論暫停或播放，都需要畫畫面（暫停時畫面就定住）
      danmusRef.current.forEach((d) => {
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
      danmusRef.current.forEach((d) => {
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
  }, []);
  // 監聽 socket 新彈幕
  useEffect(() => {
    socket.on("danmuBroadcast", (danmu) => {
      console.log(danmu);
      const newDanmu = new Danmu(
        danmu.text,
        videoRef.current.currentTime + 0.5
      );
      // setDanmus((prev) => [...prev, newDanmu]);
      danmusRef.current.push(newDanmu); // ✅ 不會觸發 React render
    });

    return () => {
      socket.off("danmuBroadcast");
    };
  }, []);
  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    getDanmus();
  }, []);
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
      {/* 🟡 這裡插入卡片元件 */}
      {activeCard && (
        <TimelineCard
          time={activeCard.time}
          content={activeCard.content}
          links={activeCard.links || []} // 多連結陣列
          onClose={() => setActiveCard(null)}
        />
      )}

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
      <div className="mt-2">
        <label>
          <input
            type="checkbox"
            checked={showSubtitle}
            onChange={(e) => setShowSubtitle(e.target.checked)}
          />
          顯示字幕
        </label>
      </div>
      {/* 🟡 新增提示輸入框 */}
      <div style={{ marginTop: "10px" }}>
        <textarea
          placeholder="輸入提示訊息，可附帶多個連結"
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          style={{ width: "100%", height: "60px", marginBottom: "4px" }}
        />
        <button onClick={handleSaveNote}>儲存提示</button>
      </div>
    </>
  );
};

export default HlsPlayer;

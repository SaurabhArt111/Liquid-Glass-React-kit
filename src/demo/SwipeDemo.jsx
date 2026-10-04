import { useEffect, useState } from "react";
import { LiquidSwipeView } from "../liquid-glass";
import { ChatIcon, MapIcon, PhotoIcon } from "./icons.jsx";

/* Three full-bleed pages. Bold colour + detail so the refraction of the bar is easy to see. */

const PHOTO_TILES = ["#ff5f7e", "#3f6bff", "#18d6c9", "#ffd166", "#8d4dff", "#ff8a4c"];

function PhotosPage() {
  return (
    <div className="sp sp--photos">
      <h3>Photos</h3>
      <p>Swipe left for the map →</p>
      <div className="sp-grid">
        {PHOTO_TILES.map((c, i) => (
          <div key={i} style={{ background: `linear-gradient(${140 + i * 30}deg, ${c}, #0f1330)` }} />
        ))}
      </div>
    </div>
  );
}

function MapPage() {
  return (
    <div className="sp sp--map">
      <h3>Map</h3>
      <p>Pins, roads and contours</p>
      <div className="sp-pin" style={{ left: "26%", top: "38%" }} />
      <div className="sp-pin" style={{ left: "62%", top: "52%" }} />
      <div className="sp-pin" style={{ left: "40%", top: "68%" }} />
    </div>
  );
}

function ChatPage() {
  return (
    <div className="sp sp--chat">
      <h3>Chat</h3>
      <div className="sp-bubbles">
        <span className="in">Did you see the glass nav?</span>
        <span className="out">It splits in two when you swipe</span>
        <span className="in">And melts back together</span>
        <span className="out">Liquid. 🫧</span>
        <span className="in">Try the other pages →</span>
      </div>
    </div>
  );
}

const PAGES = [
  { key: "photos", label: "Photos", icon: <PhotoIcon />, content: <PhotosPage /> },
  { key: "map", label: "Map", icon: <MapIcon />, content: <MapPage /> },
  { key: "chat", label: "Chat", icon: <ChatIcon />, content: <ChatPage /> },
];

/** Phone frame with swipeable pages and the split-lens tab bar. */
export function SwipePhone({ onIndexChange }) {
  const [vw, setVw] = useState(window.innerWidth);
  useEffect(() => {
    const on = () => setVw(window.innerWidth);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  const width = Math.max(260, Math.min(328, vw - 76));
  return (
    <div className="phone phone--swipe">
      <LiquidSwipeView width={width} height={588} pages={PAGES} onIndexChange={onIndexChange} edgeRadius={42} />
    </div>
  );
}

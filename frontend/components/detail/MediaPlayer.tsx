'use client';

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Loader2,
  Music,
  ChevronDown,
  Star,
  Share2,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';

export interface MediaPlayerHandle {
  seek: (seconds: number) => void;
}

interface MediaPlayerProps {
  src: string | null;
  onTimeUpdate: (t: number) => void;
  duration: number;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const MediaPlayer = forwardRef<MediaPlayerHandle, MediaPlayerProps>(
  ({ src, onTimeUpdate, duration }, ref) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const progressRef = useRef<HTMLDivElement | null>(null);
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [audioDuration, setAudioDuration] = useState(duration);
    const [volume, setVolume] = useState(1);
    const [muted, setMuted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useImperativeHandle(ref, () => ({
      seek: (seconds: number) => {
        if (audioRef.current) {
          audioRef.current.currentTime = seconds;
          setCurrentTime(seconds);
        }
      },
    }));

    useEffect(() => {
      const audio = audioRef.current;
      if (!audio || !src) return;

      const onTime = () => {
        setCurrentTime(audio.currentTime);
        onTimeUpdate(audio.currentTime);
      };
      const onLoaded = () => {
        setAudioDuration(audio.duration || duration);
        setLoading(false);
        setError(false);
      };
      const onWaiting = () => setLoading(true);
      const onCanPlay = () => setLoading(false);
      const onError = () => { setError(true); setLoading(false); };
      const onEnded = () => setPlaying(false);

      audio.addEventListener('timeupdate', onTime);
      audio.addEventListener('loadedmetadata', onLoaded);
      audio.addEventListener('waiting', onWaiting);
      audio.addEventListener('canplay', onCanPlay);
      audio.addEventListener('error', onError);
      audio.addEventListener('ended', onEnded);

      return () => {
        audio.removeEventListener('timeupdate', onTime);
        audio.removeEventListener('loadedmetadata', onLoaded);
        audio.removeEventListener('waiting', onWaiting);
        audio.removeEventListener('canplay', onCanPlay);
        audio.removeEventListener('error', onError);
        audio.removeEventListener('ended', onEnded);
      };
    }, [src, onTimeUpdate, duration]);

    const togglePlay = useCallback(() => {
      const audio = audioRef.current;
      if (!audio) return;
      if (playing) {
        audio.pause();
        setPlaying(false);
      } else {
        audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      }
    }, [playing]);

    const skip = useCallback((seconds: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = Math.max(0, Math.min(audioDuration, audio.currentTime + seconds));
    }, [audioDuration]);

    const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      const rect = progressRef.current?.getBoundingClientRect();
      if (!rect || !audioRef.current) return;
      const ratio = (e.clientX - rect.left) / rect.width;
      const t = ratio * audioDuration;
      audioRef.current.currentTime = t;
    }, [audioDuration]);

    const toggleMute = () => {
      if (!audioRef.current) return;
      audioRef.current.muted = !muted;
      setMuted(!muted);
    };

    const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseFloat(e.target.value);
      setVolume(v);
      if (audioRef.current) {
        audioRef.current.volume = v;
        setMuted(v === 0);
      }
    };

    const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

    if (!src) {
      return (
        <div className="card flex flex-col items-center justify-center py-10 text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Music size={24} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">No media attached to this meeting</p>
          <p className="text-xs text-gray-400">Transcript sync still works by clicking segments</p>
        </div>
      );
    }

    return (
      <div className="fixed bottom-0 left-0 md:left-[64px] right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-between px-6 z-40 select-none shadow-[0_-4px_16px_rgba(0,0,0,0.03)]">
        <audio ref={audioRef} src={src || undefined} preload="metadata" />

        {/* Progress bar stretching across the top edge */}
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          className="absolute top-0 left-0 right-0 h-1 bg-gray-100 cursor-pointer group"
          id="media-progress-bar"
        >
          <div
            className="h-full bg-violet-600 transition-all"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow border-2 border-violet-600 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 7px)` }}
          />
        </div>

        {/* Left: Time tracker */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-700 font-mono">
            {formatTime(currentTime)}
          </span>
          <span className="text-xs text-gray-400">/</span>
          <span className="text-xs text-gray-500 font-mono">
            {formatTime(audioDuration)}
          </span>
          <ChevronDown size={14} className="text-gray-400 cursor-pointer hover:text-gray-600 ml-1" />
        </div>

        {/* Center: Controls */}
        <div className="flex items-center gap-4">
          {/* Speed */}
          <span className="text-xs font-semibold text-gray-500 hover:text-gray-700 cursor-pointer px-2 py-1 rounded hover:bg-gray-50 transition-colors">
            1x
          </span>

          {/* Skip Back */}
          <button onClick={() => skip(-10)} className="text-gray-400 hover:text-gray-600 p-1.5 transition-colors" title="Back 10s">
            <SkipBack size={18} />
          </button>

          {/* Play/Pause Circle */}
          <button
            onClick={togglePlay}
            id="media-play-pause"
            className="w-9 h-9 rounded-full bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center transition-all shadow-md shadow-violet-500/20 hover:scale-105 active:scale-95 shrink-0"
          >
            {loading ? (
              <Loader2 size={16} className="spinner" />
            ) : playing ? (
              <Pause size={16} />
            ) : (
              <Play size={16} className="translate-x-0.5" />
            )}
          </button>

          {/* Skip Forward */}
          <button onClick={() => skip(10)} className="text-gray-400 hover:text-gray-600 p-1.5 transition-colors" title="Forward 10s">
            <SkipForward size={18} />
          </button>

          {/* Volume */}
          <div className="flex items-center gap-2 ml-2">
            <button onClick={toggleMute} className="text-gray-400 hover:text-gray-600 p-1 transition-colors">
              {muted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={handleVolume}
              className="w-16 h-1 accent-violet-600 cursor-pointer"
              aria-label="Volume"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button className="text-gray-400 hover:text-gray-600 p-1.5 transition-colors" title="Favorite">
            <Star size={16} />
          </button>
          <button className="text-gray-400 hover:text-gray-600 p-1.5 transition-colors" title="Share">
            <Share2 size={16} />
          </button>
          <div className="w-px h-4 bg-gray-200" />
          <button className="text-gray-400 hover:text-emerald-600 p-1.5 transition-colors" title="Like">
            <ThumbsUp size={16} />
          </button>
          <button className="text-gray-400 hover:text-red-600 p-1.5 transition-colors" title="Dislike">
            <ThumbsDown size={16} />
          </button>
        </div>
      </div>
    );
  }
);

MediaPlayer.displayName = 'MediaPlayer';
export default MediaPlayer;

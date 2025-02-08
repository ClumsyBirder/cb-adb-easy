import { useState, useEffect, useRef } from "react";

import { Play, Square, Download, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

export default function Screenrecord() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [recordedVideoData, setRecordedVideoData] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
        setRecordingProgress((prev) => Math.min(prev + 0.5, 100));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStartRecording = async () => {
    setIsLoading(true);
    try {
      const result = await window.pywebview.api.start_recording();
      if (result) {
        setIsRecording(true);
        setRecordingTime(0);
        setRecordingProgress(0);
        setRecordedVideoData(null);
        toast({
          title: "记录开始",
        });
      } else {
        toast({
          title: "记录录制失败，请再试一次。",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopRecording = async () => {
    setIsLoading(true);
    try {
      setIsRecording(false);
      const result = await window.pywebview.api.stop_recording();
      if (result && result.videoData) {
        setRecordedVideoData(result.videoData);
        toast({
          title: "记录停止",
          description: "录制成功完成",
        });
      } else {
        toast({
          title: "停止录制失败，请再试一次。",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplay = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  const handleDownload = async () => {
    if (recordedVideoData) {
      setIsLoading(true);
      try {
        const success =
          await window.pywebview.api.save_recording(recordedVideoData);
        if (success) {
          toast({
            title: "导出成功",
          });
        } else {
          toast({
            title: "保存失败",
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-white dark:bg-gray-800 p-6">
      <div className="flex flex-col items-center justify-center flex-grow">
        <div className="mb-8 text-center">
          {isRecording ? (
            <div className="text-2xl text-red-500 animate-pulse">
              录制: {formatTime(recordingTime)}
            </div>
          ) : (
            <div className="text-2xl text-muted-foreground">准备录制</div>
          )}
        </div>
        <div className="w-full max-w-md mb-8">
          <Progress value={recordingProgress} className="h-2" />
        </div>
        <div className="flex gap-4 mb-8">
          {!isRecording ? (
            <Button onClick={handleStartRecording} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Start Recording
            </Button>
          ) : (
            <Button
              onClick={handleStopRecording}
              disabled={isLoading}
              className="bg-primary/60"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Square className="mr-2 h-4 w-4" />
              )}
              Stop Recording
            </Button>
          )}
          {recordedVideoData && (
            <>
              <Button
                onClick={handleDownload}
                variant="outline"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download Recording
              </Button>
              <Button onClick={handleReplay} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Replay
              </Button>
            </>
          )}
        </div>
        {recordedVideoData && (
          <div className="w-[calc(100vh-7.9rem)]">
            <div className="relative w-full pt-[55%]">
              <video
                ref={videoRef}
                src={recordedVideoData}
                controls
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
                className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg object-contain bg-black"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

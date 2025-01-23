import { useState, useRef, useEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Download,
  Maximize2,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { cn } from "@/lib/utils";

interface ScreenshotInfo {
  width: number;
  height: number;
  size: string;
  image: string;
}

export function ScreenshotTab() {
  const [screenshot, setScreenshot] = useState<ScreenshotInfo>();
  const [isLoading, setIsLoading] = useState(false);
  const transformComponentRef = useRef(null);

  const fetchScreenshot = async () => {
    setIsLoading(true);
    try {
      const res = await window.pywebview.api.get_screenshot();
      setScreenshot(res);
    } catch (error) {
      console.error("Error refreshing screenshot:", error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchScreenshot().then((r) => console.log(r));
  }, []);
  const handleSave = () => {
    if (!screenshot) {
      console.error("No screenshot available to download");
      return;
    }
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${screenshot?.image}`;
    link.download = `screenshot.png`; // 你可以根据需要更改文件名和扩展名
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = async () => {
    if (!screenshot) {
      console.error("No screenshot available to copy");
      return;
    }

    try {
      // 创建一个隐藏的 <img> 元素
      const img = new Image();
      img.src = `data:image/png;base64,${screenshot.image}`;

      // 等待图像加载完成
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // 创建一个 Canvas 元素
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Failed to get 2D context");
      }

      // 将图像绘制到 Canvas 上
      ctx.drawImage(img, 0, 0);

      // 将 Canvas 内容转换为 Blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error("Failed to create blob");
        }

        // 创建 ClipboardItem
        const clipboardItem = new ClipboardItem({
          "image/png": blob,
        });

        // 将 ClipboardItem 写入剪贴板
        await navigator.clipboard.write([clipboardItem]);
        console.log("Screenshot copied to clipboard");
      }, "image/png");
    } catch (error) {
      console.error("Failed to copy screenshot:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={fetchScreenshot}
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
        <Separator orientation="vertical" className="h-4" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleCopy}
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleSave}
        >
          <Download className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-4" />

        <div className="ml-auto text-sm text-muted-foreground">
          {screenshot?.width}x{screenshot?.height} {screenshot?.size} MB
        </div>
      </div>

      <div className="relative flex-1">
        <TransformWrapper
          ref={transformComponentRef}
          initialScale={1}
          minScale={0.1}
          maxScale={4}
          centerOnInit
          wheel={{ wheelDisabled: true }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div className="absolute left-3 top-3 z-10 flex flex-col gap-3">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => zoomIn()}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => zoomOut()}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => resetTransform()}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
              <TransformComponent
                wrapperClass="!w-full !h-full"
                contentClass="!w-full !h-full flex items-center justify-center"
              >
                {screenshot && (
                  <img
                    src={"data:image/png;base64," + screenshot?.image}
                    alt=""
                    className={cn(
                      "max-h-full w-auto transition-opacity duration-200",
                      isLoading ? "opacity-50" : "opacity-100",
                    )}
                    style={{
                      maxWidth: "calc(100vw - 3rem)",
                      maxHeight: "calc(100vh - 13rem)",
                    }}
                  />
                )}
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>
    </div>
  );
}

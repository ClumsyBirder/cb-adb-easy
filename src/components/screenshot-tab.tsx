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
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

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
  };

  const handleCopy = async () => {
    if (!screenshot) {
      console.error("No screenshot available to copy");
      return;
    }

    try {
      const img = document.getElementById("image") as HTMLImageElement;
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Failed to get 2D context");
      }
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(async (blob) => {
        if (blob) {
          const clipboardItem = new ClipboardItem({
            "image/png": blob,
          });
          await navigator.clipboard.write([clipboardItem]);
          console.log("图片已复制到剪贴板");
        }
      }, "image/png");
      toast({
        description: "图片已复制到剪贴板",
      });
    } catch (error) {
      console.error("制图片失败:", error);
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
      <Separator orientation="horizontal" />
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
                    id="image"
                    src={`data:image/png;base64,${screenshot.image}`}
                    alt=""
                    className={cn(
                      "max-h-full w-auto transition-opacity duration-200",
                      isLoading ? "opacity-50" : "opacity-100",
                    )}
                    style={{
                      maxWidth: "calc(100vw - 3rem)",
                      maxHeight: "calc(100vh - 13.8rem)",
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

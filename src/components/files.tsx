import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  Download,
  Trash2,
  FolderPlus,
  ArrowLeft,
  FileIcon,
  FolderIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatFileSize } from "@/lib/utils";

interface FileEntry {
  name: string;
  path: string;
  size: number;
  is_dir: boolean;
  permissions: string;
  owner: string;
  group: string;
  modified: string;
}

export function Files() {
  const [currentPath, setCurrentPath] = useState("/");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const { toast } = useToast();

  const loadFiles = async (path: string) => {
    const result = await window.pywebview.api.list_files(path);
    setFiles(result);
    setCurrentPath(path);
  };

  useEffect(() => {
    loadFiles(currentPath).then((r) => console.log(r));
  }, []);

  const handleNavigate = async (entry: FileEntry) => {
    if (entry.is_dir) {
      await loadFiles(entry.path);
    }
  };

  const handleGoBack = async () => {
    const parentPath = currentPath.split("/").slice(0, -1).join("/") || "/";
    await loadFiles(parentPath);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName) return;
    const newPath = `${currentPath}/${newFolderName}`;
    const result = await window.pywebview.api.create_folder(newPath);

    if (result) {
      toast({ description: "文件夹创建成功" });
      await loadFiles(currentPath);
      setNewFolderName("");
    } else {
      toast({
        variant: "destructive",
        description: "文件创建失败",
      });
    }
  };

  const handleDelete = async (path: string) => {
    const result = await window.pywebview.api.delete_file(path);
    if (result) {
      toast({ description: "删除成功" });
      await loadFiles(currentPath);
    } else {
      toast({
        variant: "destructive",
        description: "删除失败",
      });
    }
  };

  const handleDownload = async (path: string) => {
    const result = await window.pywebview.api.download_file(path);
    if (result) {
      toast({ description: "下载成功" });
    } else {
      toast({
        variant: "destructive",
        description: "下载失败",
      });
    }
  };

  const handleUpload = async () => {
    const result = await window.pywebview.api.upload_file(currentPath);
    if (result) {
      toast({ description: "上传成功" });
      await loadFiles(currentPath);
    } else {
      toast({
        variant: "destructive",
        description: "上传失败",
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-2 border-b">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleGoBack}
          disabled={currentPath === "/"}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 text-sm text-muted-foreground overflow-hidden">
          {currentPath}
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <FolderPlus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新建文件夹</DialogTitle>
            </DialogHeader>
            <div className="flex gap-2">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="文件夹名称"
              />
              <Button onClick={handleCreateFolder}>创建</Button>
            </div>
          </DialogContent>
        </Dialog>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleUpload}
        >
          <Upload className="h-4 w-4" />
        </Button>
      </div>

      <div
        className="overflow-auto"
        style={{ maxHeight: "calc(100vh - 13rem)" }}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[500px]">名称</TableHead>
              <TableHead>大小</TableHead>
              <TableHead>修改时间</TableHead>
              <TableHead>权限</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.path}>
                <TableCell>
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => handleNavigate(file)}
                  >
                    {file.is_dir ? (
                      <FolderIcon className="h-4 w-4" />
                    ) : (
                      <FileIcon className="h-4 w-4" />
                    )}
                    {file.name}
                  </div>
                </TableCell>
                <TableCell>
                  {file.is_dir ? "-" : formatFileSize(file.size)}
                </TableCell>
                <TableCell>{file.modified}</TableCell>
                <TableCell>{file.permissions}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {!file.is_dir && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDownload(file.path)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDelete(file.path)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

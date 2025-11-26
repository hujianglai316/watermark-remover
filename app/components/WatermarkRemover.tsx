/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Upload, Download, Eraser, Check, Loader2, Image as ImageIcon, Undo2, X } from 'lucide-react';
import type { ReactSketchCanvasRef } from 'react-sketch-canvas';

// 动态导入画板，禁用 SSR
const ReactSketchCanvas = dynamic(
  () => import('react-sketch-canvas').then((mod) => mod.ReactSketchCanvas),
  { ssr: false }
);

export default function WatermarkRemover() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  
  const canvasRef = useRef<ReactSketchCanvasRef | null>(null);

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setProcessedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // 调用 API
  const handleRemoveWatermark = async () => {
    if (!canvasRef.current || !selectedImage) return;

    setIsProcessing(true);

    try {
      // 导出蒙版 (png)
      const maskData = await canvasRef.current.exportImage("png");
      
      const response = await fetch('/api/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: selectedImage,
          mask: maskData
        })
      });

      const data = await response.json();

      if (response.ok && data.url) {
        setProcessedImage(data.url);
      } else {
        alert("处理失败: " + (data.details || "网络错误或模型繁忙"));
      }
    } catch (error) {
      console.error(error);
      alert("请求发送失败");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setProcessedImage(null);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans">
      {/* 顶部导航 */}
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Eraser className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">CleanPic AI</span>
          </div>
          <div className="text-sm text-neutral-400">免费 • 高清 • 无限</div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* 状态1: 上传框 */}
        {!selectedImage && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] border-2 border-dashed border-neutral-800 rounded-3xl bg-neutral-900/30 hover:bg-neutral-900/50 hover:border-neutral-700 transition-all group cursor-pointer relative">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="w-20 h-20 bg-neutral-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Upload className="w-10 h-10 text-neutral-400 group-hover:text-white" />
            </div>
            <h2 className="text-2xl font-semibold mb-2 text-white">点击或拖拽上传图片</h2>
            <p className="text-neutral-500">支持 JPG, PNG, WEBP (最大 5MB)</p>
          </div>
        )}

        {/* 状态2: 操作界面 */}
        {selectedImage && (
          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* 左侧编辑器 */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <span className="bg-indigo-600 w-2 h-2 rounded-full animate-pulse"></span>
                  涂抹水印区域
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => canvasRef.current?.undo()} className="p-2 hover:bg-neutral-800 rounded-lg" title="撤销"><Undo2 className="w-5 h-5" /></button>
                  <button onClick={handleReset} className="p-2 hover:bg-red-900/30 text-red-400 rounded-lg" title="关闭"><X className="w-5 h-5" /></button>
                </div>
              </div>

              {/* 画板区域 */}
              <div className="relative w-full aspect-[4/3] bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 shadow-2xl">
                <img src={selectedImage} alt="Original" className="absolute inset-0 w-full h-full object-contain pointer-events-none z-0"/>
                <div className="absolute inset-0 z-10 opacity-60">
                   <ReactSketchCanvas
                    ref={canvasRef}
                    strokeWidth={brushSize}
                    strokeColor="white"
                    canvasColor="transparent"
                    className="w-full h-full"
                  />
                </div>
              </div>

              {/* 控制栏 */}
              <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 flex items-center gap-6">
                 <div className="flex-1">
                   <label className="text-xs text-neutral-500 mb-2 block uppercase font-semibold">画笔大小</label>
                   <input type="range" min="5" max="50" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full h-2 bg-neutral-700 rounded-lg cursor-pointer accent-indigo-500"/>
                 </div>
                 <button
                  onClick={handleRemoveWatermark}
                  disabled={isProcessing}
                  className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${isProcessing ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' : 'bg-white text-black hover:bg-indigo-50'}`}
                 >
                   {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> 修复中...</> : <><Check className="w-5 h-5" /> 开始去除</>}
                 </button>
              </div>
            </div>

            {/* 右侧结果预览 */}
            <div className="flex flex-col gap-4">
               <h3 className="text-lg font-medium text-neutral-400">处理结果</h3>
               <div className="w-full aspect-[4/3] bg-neutral-900/50 rounded-xl border border-neutral-800 flex items-center justify-center overflow-hidden relative group">
                  {processedImage ? (
                    <>
                      <img src={processedImage} alt="Processed" className="w-full h-full object-contain"/>
                      <a href={processedImage} download="clean_image.png" target="_blank" className="absolute bottom-6 right-6 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg translate-y-20 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2">
                        <Download className="w-5 h-5" /> 下载原图
                      </a>
                    </>
                  ) : (
                    <div className="text-center text-neutral-600">
                      <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p>{isProcessing ? "AI 正在计算像素..." : "等待处理..."}</p>
                    </div>
                  )}
               </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
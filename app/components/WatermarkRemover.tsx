/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Upload, Download, Eraser, Check, Loader2, Image as ImageIcon, Undo2, X, Sparkles } from 'lucide-react';
import type { ReactSketchCanvasRef } from 'react-sketch-canvas';

// 动态导入画板，禁用 SSR
const ReactSketchCanvas = dynamic(
  () => import('react-sketch-canvas').then((mod) => mod.ReactSketchCanvas),
  { ssr: false }
);

const loadingMessages = [
  "AI 正在识别像素...",
  "正在分析图像结构...",
  "正在重绘背景...",
  "正在优化细节...",
  "即将完成..."
];

export default function WatermarkRemover() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  
  // 新增：图片加载状态，确保画板在图片撑开容器后再渲染
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const canvasRef = useRef<ReactSketchCanvasRef | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isProcessing]);

  const handleImageUpload = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setProcessedImage(null);
        setImageLoaded(false); // 重置加载状态
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageUpload(file);
    }
  }, [handleImageUpload]);

  const handleRemoveWatermark = async () => {
    if (!canvasRef.current || !selectedImage) {
      alert("画布尚未就绪，请稍后再试");
      return;
    }

    setIsProcessing(true);
    setLoadingMessageIndex(0);

    try {
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
      alert("请求发送失败，请检查网络");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setProcessedImage(null);
    setIsProcessing(false);
    setSliderPosition(50);
    setImageLoaded(false);
  };

  // 滑块控制逻辑
  const handleSliderMouseDown = (e: React.MouseEvent) => {
    setIsDraggingSlider(true);
    updateSliderPosition(e);
  };

  const updateSliderPosition = (e: React.MouseEvent | MouseEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  useEffect(() => {
    if (isDraggingSlider) {
      const handleMouseMove = (e: MouseEvent) => updateSliderPosition(e);
      const handleMouseUp = () => setIsDraggingSlider(false);
      
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingSlider]);

  return (
    <div className="min-h-screen text-neutral-200 font-sans relative selection:bg-indigo-500/30">
      <div className="gradient-bg pointer-events-none">
        <div className="gradient-orb"></div>
        <div className="gradient-orb"></div>
        <div className="gradient-orb"></div>
      </div>

      <header className="glass sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 select-none">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg">
              <Eraser className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent">
              CleanPic AI
            </span>
          </div>
          <div className="text-sm text-neutral-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">免费 • 高清 • 无限</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {!selectedImage && (
          <div
            className={`glass-strong rounded-3xl min-h-[60vh] flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 cursor-pointer border-2 ${
              isDragging 
                ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]' 
                : 'border-dashed border-white/10 hover:border-white/20 hover:bg-white/5'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
            {isDragging && <div className="scan-line"></div>}
            <div className={`w-24 h-24 glass rounded-3xl flex items-center justify-center mb-8 transition-all duration-500 ${
              isDragging ? 'scale-110 rotate-12' : 'group-hover:scale-105'
            }`}>
              <Upload className={`w-10 h-10 ${isDragging ? 'text-indigo-400' : 'text-neutral-400'}`} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">
              {isDragging ? '松开即可上传' : '点击或拖拽上传图片'}
            </h2>
            <p className="text-neutral-500">支持 JPG, PNG, WEBP (最大 10MB)</p>
          </div>
        )}

        {selectedImage && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="glass-strong rounded-3xl p-6 border border-white/10">
              <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                <h3 className="text-xl font-semibold flex items-center gap-3">
                  <div className="w-2 h-8 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
                  涂抹水印区域
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => canvasRef.current?.undo()}
                    className="glass px-4 py-2 rounded-xl hover:bg-white/10 transition-all flex items-center gap-2 text-sm"
                  >
                    <Undo2 className="w-4 h-4" /> 撤销
                  </button>
                  <button
                    onClick={handleReset}
                    className="glass px-4 py-2 rounded-xl hover:bg-red-500/20 text-red-400 transition-all flex items-center gap-2 text-sm border-red-500/20"
                  >
                    <X className="w-4 h-4" /> 关闭
                  </button>
                </div>
              </div>

              {/* 核心修复区：这里是重点修改的地方
                1. inline-block: 容器大小由图片撑开
                2. onLoad: 图片加载完再设置 imageLoaded=true
                3. conditional rendering: 画板只有在 imageLoaded 为 true 时才渲染
              */}
              <div className="relative w-full flex justify-center bg-black/20 rounded-2xl overflow-hidden border border-white/5 p-1">
                <div className="relative inline-block max-w-full align-middle">
                  {/* 底图 */}
                  <img
                    src={selectedImage}
                    alt="Original"
                    onLoad={() => setImageLoaded(true)} // 关键：图片加载完通知React
                    className="block max-h-[70vh] w-auto object-contain pointer-events-none select-none" 
                    draggable={false}
                  />
                  
                  {/* 蒙版层 - 仅当图片加载完成后渲染 */}
                  {imageLoaded && (
                    <div className="absolute inset-0 z-10 cursor-crosshair touch-none">
                      <ReactSketchCanvas
                        ref={canvasRef}
                        width="100%"  // 强制宽高
                        height="100%"
                        strokeWidth={brushSize}
                        strokeColor="white"
                        canvasColor="transparent"
                        style={{ border: 'none' }}
                      />
                    </div>
                  )}
                  
                  {/* 加载中占位符 */}
                  {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 glass p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-6">
                <div className="flex-1 w-full sm:w-auto">
                  <div className="flex justify-between mb-2 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                    <span>画笔大小</span>
                    <span>{brushSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
                  />
                </div>
                <button
                  onClick={handleRemoveWatermark}
                  disabled={isProcessing || !imageLoaded}
                  className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 ${
                    isProcessing || !imageLoaded
                      ? 'bg-neutral-700 cursor-wait opacity-80'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/25'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      处理中...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      开始去除
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="glass-strong rounded-3xl p-6 border border-white/10 min-h-[300px] flex flex-col">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
                <div className="w-2 h-8 bg-gradient-to-b from-emerald-400 to-teal-600 rounded-full"></div>
                处理结果
              </h3>

              <div className="flex-1 flex items-center justify-center">
                {processedImage ? (
                  <div className="w-full space-y-6">
                    <div
                      ref={sliderRef}
                      className="relative w-full max-h-[70vh] aspect-auto rounded-2xl overflow-hidden cursor-ew-resize group select-none shadow-2xl"
                      onMouseDown={handleSliderMouseDown}
                      onTouchStart={() => setIsDraggingSlider(true)}
                    >
                      <img
                        src={processedImage}
                        alt="Processed"
                        className="block w-full h-full object-contain"
                      />
                      <div
                        className="absolute inset-0"
                        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                      >
                        <img
                          src={selectedImage}
                          alt="Original"
                          className="block w-full h-full object-contain"
                        />
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)]"></div>
                      </div>
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center text-indigo-600 z-20 pointer-events-none transform transition-transform group-hover:scale-110"
                        style={{ left: `calc(${sliderPosition}% - 20px)` }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                      </div>
                      <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur px-3 py-1 rounded text-xs font-bold text-white/80">原图</div>
                      <div className="absolute bottom-4 right-4 bg-indigo-600/80 backdrop-blur px-3 py-1 rounded text-xs font-bold text-white">修复后</div>
                    </div>
                    <div className="flex justify-center">
                      <a
                        href={processedImage}
                        download="clean_image.png"
                        target="_blank"
                        className="glass px-8 py-3 rounded-xl font-bold hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
                      >
                        <Download className="w-5 h-5" /> 下载高清原图
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    {isProcessing ? (
                      <div className="space-y-4">
                        <div className="relative w-20 h-20 mx-auto">
                          <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
                          <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                        </div>
                        <p className="text-lg font-medium text-indigo-300 animate-pulse">
                          {loadingMessages[loadingMessageIndex]}
                        </p>
                      </div>
                    ) : (
                      <div className="text-neutral-500 flex flex-col items-center">
                        <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                        <p>处理结果将在这里显示</p>
                      </div>
                    )}
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

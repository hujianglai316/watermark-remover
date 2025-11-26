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

// 加载状态文字数组
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
  
  const canvasRef = useRef<ReactSketchCanvasRef | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // 加载消息循环
  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isProcessing]);

  // 处理图片上传
  const handleImageUpload = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setProcessedImage(null);
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

  // 拖拽处理
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

  // 调用 API
  const handleRemoveWatermark = async () => {
    if (!canvasRef.current || !selectedImage) return;

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
      alert("请求发送失败");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setProcessedImage(null);
    setIsProcessing(false);
    setSliderPosition(50);
  };

  // 滑块控制
  const handleSliderMouseDown = (e: React.MouseEvent) => {
    setIsDraggingSlider(true);
    updateSliderPosition(e);
  };

  const handleSliderMouseMove = (e: React.MouseEvent) => {
    if (isDraggingSlider) {
      updateSliderPosition(e);
    }
  };

  const handleSliderMouseUp = () => {
    setIsDraggingSlider(false);
  };

  const updateSliderPosition = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  useEffect(() => {
    if (isDraggingSlider) {
      const handleMouseMove = (e: MouseEvent) => {
        if (sliderRef.current) {
          const rect = sliderRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
          setSliderPosition(percentage);
        }
      };

      const handleMouseUp = () => {
        setIsDraggingSlider(false);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingSlider]);

  return (
    <div className="min-h-screen text-neutral-200 font-sans relative">
      {/* 流动背景 */}
      <div className="gradient-bg">
        <div className="gradient-orb"></div>
        <div className="gradient-orb"></div>
        <div className="gradient-orb"></div>
      </div>

      {/* 顶部导航 */}
      <header className="glass sticky top-0 z-50 relative">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg">
              <Eraser className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent">
              CleanPic AI
            </span>
          </div>
          <div className="text-sm text-neutral-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>免费 • 高清 • 无限</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* 状态1: 上传框 */}
        {!selectedImage && (
          <div
            className={`glass-strong rounded-3xl min-h-[60vh] flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 ${
              isDragging ? 'drag-active scale-105' : 'hover:scale-[1.02]'
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
            
            {/* 扫描线动画 */}
            {isDragging && <div className="scan-line"></div>}
            
            <div className={`w-24 h-24 glass rounded-3xl flex items-center justify-center mb-8 transition-all duration-300 ${
              isDragging ? 'icon-bounce bg-indigo-500/20' : 'hover:bg-indigo-500/10'
            }`}>
              <Upload className={`w-12 h-12 transition-colors ${
                isDragging ? 'text-indigo-400' : 'text-neutral-400'
              }`} />
            </div>
            
            <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
              {isDragging ? '松开以上传' : '点击或拖拽上传图片'}
            </h2>
            <p className="text-neutral-400 text-lg">支持 JPG, PNG, WEBP (最大 5MB)</p>
            
            {isDragging && (
              <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none"></div>
            )}
          </div>
        )}

        {/* 状态2: 操作界面 */}
        {selectedImage && (
          <div className="space-y-8">
            {/* 编辑器区域 */}
            <div className="glass-strong rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold flex items-center gap-3">
                  <span className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse"></span>
                  <span className="bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent">
                    涂抹水印区域
                  </span>
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => canvasRef.current?.undo()}
                    className="glass p-3 rounded-xl hover:bg-white/10 transition-all"
                    title="撤销"
                  >
                    <Undo2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleReset}
                    className="glass p-3 rounded-xl hover:bg-red-500/20 text-red-400 transition-all"
                    title="关闭"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 画板区域 */}
              <div className="relative w-full aspect-[4/3] glass rounded-2xl overflow-hidden mb-6">
                <img
                  src={selectedImage}
                  alt="Original"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none z-0"
                />
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
              <div className="glass p-6 rounded-2xl flex items-center gap-6">
                <div className="flex-1">
                  <label className="text-xs text-neutral-400 mb-3 block uppercase font-semibold tracking-wider">
                    画笔大小: {brushSize}px
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full h-2 bg-neutral-800/50 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
                <button
                  onClick={handleRemoveWatermark}
                  disabled={isProcessing}
                  className={`px-8 py-4 rounded-xl font-semibold flex items-center gap-3 transition-all ${
                    isProcessing
                      ? 'glass text-neutral-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>处理中...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>开始去除</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 结果预览区域 */}
            <div className="glass-strong rounded-3xl p-6">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-3">
                <span className="bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent">
                  处理结果
                </span>
              </h3>

              {processedImage ? (
                <div className="relative">
                  {/* 对比滑块容器 */}
                  <div
                    ref={sliderRef}
                    className="slider-container relative w-full aspect-[4/3] rounded-2xl overflow-hidden glass"
                    onMouseDown={handleSliderMouseDown}
                    onMouseMove={handleSliderMouseMove}
                    onMouseUp={handleSliderMouseUp}
                    onMouseLeave={handleSliderMouseUp}
                  >
                    {/* 原图（左侧） */}
                    <div
                      className="absolute inset-0"
                      style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                    >
                      <img
                        src={selectedImage}
                        alt="Original"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* 处理后图片（右侧） */}
                    <div
                      className="absolute inset-0"
                      style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
                    >
                      <img
                        src={processedImage}
                        alt="Processed"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* 滑块控制 */}
                    <div
                      className="slider-handle"
                      style={{ left: `${sliderPosition}%` }}
                    ></div>

                    {/* 标签 */}
                    <div className="absolute top-4 left-4 glass px-4 py-2 rounded-lg text-sm font-semibold">
                      原图
                    </div>
                    <div className="absolute top-4 right-4 glass px-4 py-2 rounded-lg text-sm font-semibold">
                      处理后
                    </div>
                  </div>

                  {/* 下载按钮 */}
                  <div className="mt-6 flex justify-center">
                    <a
                      href={processedImage}
                      download="clean_image.png"
                      target="_blank"
                      className="glass-strong px-8 py-4 rounded-xl font-semibold flex items-center gap-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                    >
                      <Download className="w-5 h-5" />
                      <span>下载原图</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="w-full aspect-[4/3] glass rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
                  {isProcessing && (
                    <>
                      <div className="scan-line"></div>
                      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-transparent to-purple-500/10"></div>
                    </>
                  )}
                  
                  <div className="text-center z-10">
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-16 h-16 mx-auto mb-6 text-indigo-400 animate-spin" />
                        <p className="text-xl font-semibold mb-2 loading-text">
                          {loadingMessages[loadingMessageIndex]}
                        </p>
                        <p className="text-sm text-neutral-500">
                          请稍候，AI 正在努力处理中...
                        </p>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-16 h-16 mx-auto mb-4 text-neutral-600 opacity-30" />
                        <p className="text-neutral-500 text-lg">等待处理...</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

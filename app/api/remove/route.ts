import { NextResponse } from 'next/server';
import { client } from "@gradio/client";

// 设置函数最大运行时间为 60 秒 (Vercel 免费版限制)
export const maxDuration = 60;

// 使用 Hugging Face 上公开的 LaMa 模型 Space
const HF_SPACE_ID = "efederici/lama-inpainting-demo"; 

export async function POST(request: Request) {
  try {
    const { image, mask } = await request.json();

    console.log("正在连接 Hugging Face Space...");
    
    // 连接到 Space
    const app = await client(HF_SPACE_ID, {});

    // 调用预测接口
    // 该 Space 的 predict 接受两个参数：[原图, 蒙版]
    const result = (await app.predict("/predict", [
      image, 
      mask, 
    ])) as { data: unknown };

    // 解析结果
    // Gradio 返回的 data 通常是一个数组，第 0 项是结果图片的 URL 或 Base64
    const outputData = result.data as unknown[];
    const finalUrl = Array.isArray(outputData) ? outputData[0] : outputData;

    if (!finalUrl) {
      throw new Error("模型未返回有效图片");
    }

    return NextResponse.json({ url: finalUrl });

  } catch (error: any) {
    console.error("处理失败:", error);
    return NextResponse.json(
      { error: "处理失败，请稍后重试", details: error.message }, 
      { status: 500 }
    );
  }
}
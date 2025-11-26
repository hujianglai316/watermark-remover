import dynamic from 'next/dynamic';

// 动态导入组件，ssr: false 是关键！
const WatermarkRemover = dynamic(
  () => import('./components/WatermarkRemover'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-neutral-400">
        正在启动 CleanPic AI...
      </div>
    )
  }
);

export default function Home() {
  return <WatermarkRemover />;
}
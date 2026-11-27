export default function DashboardLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3 text-[#6B655E]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#B89B72] border-t-transparent" />
        <p className="text-xs font-medium tracking-wide">Đang tải không gian quản lý...</p>
      </div>
    </div>
  );
}

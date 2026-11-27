export default function PublicWeddingLoading() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#FAF8F5] px-4">
      <div className="flex flex-col items-center gap-3 text-[#6B655E]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#B89B72] border-t-transparent" />
        <p className="font-serif text-sm tracking-wide">Đang mở thiệp cưới...</p>
      </div>
    </main>
  );
}

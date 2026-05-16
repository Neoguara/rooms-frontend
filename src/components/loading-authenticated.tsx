export function LoadingAuthenticated() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center w-full h-full gap-2">
      <div className="relative size-12">
        <div className="absolute inset-0 rounded-full border-4 border-muted" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
      </div>
    </div>
  )
}

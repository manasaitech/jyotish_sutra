interface AssistantMessageProps {
  icon: string
  iconFill?: boolean
  children: React.ReactNode
}

export default function AssistantMessage({ icon, iconFill = true, children }: AssistantMessageProps) {
  return (
    <div className="flex gap-4 animate-fade-in-up">
      <div className="w-8 h-8 flex-shrink-0 bg-primary-fixed rounded-full flex items-center justify-center border border-primary/20">
        <span
          className="material-symbols-outlined text-primary text-sm"
          style={iconFill ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          {icon}
        </span>
      </div>
      <div className="max-w-[85%] bg-surface text-on-surface border border-outline-variant/60 rounded-2xl rounded-tl-none p-4 text-[16px] leading-6 shadow-sm">
        {children}
      </div>
    </div>
  )
}

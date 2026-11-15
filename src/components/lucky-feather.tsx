export function LuckyFeather({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 240 320" fill="none" aria-hidden="true" focusable="false">
    <path d="M53 282C62 219 82 95 170 40C192 29 218 30 217 62C216 131 154 220 78 251" fill="currentColor" opacity=".15" />
    <path d="M45 299C78 214 123 127 199 51M80 222L89 137M104 176L123 88M128 141L156 57M81 223L151 216M104 178L180 164M132 137L205 113" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M78 251C84 172 104 75 170 40C192 29 218 30 217 62C216 131 154 220 78 251Z" stroke="currentColor" strokeWidth="3" />
  </svg>;
}

export function RedPandaEmblem({
  size = 32,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="22" className="fill-[#152820] stroke-[#C5A776]/60" strokeWidth="1.5" />
      <path d="M12 19L15.5 9.5L22 15.5L12 19Z" fill="#C5A776" />
      <path d="M36 19L32.5 9.5L26 15.5L36 19Z" fill="#C5A776" />
      <path
        d="M12.5 24C12.5 17.5 17.5 13.5 24 13.5C30.5 13.5 35.5 17.5 35.5 24C35.5 30.8 30.3 35.5 24 35.5C17.7 35.5 12.5 30.8 12.5 24Z"
        fill="#B96C4A"
      />
      <ellipse cx="18.2" cy="22.5" rx="3.2" ry="2.6" fill="#F5F3EC" />
      <ellipse cx="29.8" cy="22.5" rx="3.2" ry="2.6" fill="#F5F3EC" />
      <circle cx="18.6" cy="23.2" r="1.35" fill="#081411" />
      <circle cx="29.4" cy="23.2" r="1.35" fill="#081411" />
      <path d="M16 28.5C18 32 21 33.5 24 33.5C27 33.5 30 32 32 28.5C29.5 27.5 27 27 24 27C21 27 18.5 27.5 16 28.5Z" fill="#F5F3EC" />
      <path d="M21.8 27.5L24 30L26.2 27.5H21.8Z" fill="#081411" />
      <path d="M15 30.5L12.5 28.5M33 30.5L35.5 28.5" stroke="#081411" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

import { cn } from "@/lib/utils";

interface LibraryLogoProps {
  className?: string;
  size?: number;
}

const LibraryLogo = ({ className, size = 24 }: LibraryLogoProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("fill-current", className)}
    >
      <path d="M21,6H3A1,1,0,0,0,2,7V17a1,1,0,0,0,1,1H21a1,1,0,0,0,1-1V7A1,1,0,0,0,21,6ZM11,15.76V8.24a.25.25,0,0,1,.37-.22l5.26,3.63a.25.25,0,0,1,0,.42l-5.26,3.48A.25.25,0,0,1,11,15.76ZM7,13a2,2,0,1,1,2-2A2,2,0,0,1,7,13Z" />
    </svg>
  );
};

export default LibraryLogo;

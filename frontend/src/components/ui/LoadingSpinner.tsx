// frontend/src/components/ui/LoadingSpinner.tsx
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
}

const sizeMap = {
  sm: "w-4 h-4",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

const LoadingSpinner = ({ size = "md", message }: LoadingSpinnerProps) => {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${sizeMap[size]} border-2 border-white/10 border-t-violet-500 rounded-full animate-spin`}
      />
      {message && (
        <p className="text-sm text-white/40 font-light tracking-wide">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
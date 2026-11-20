import BlogSceneStill from "@/components/three/BlogSceneStill";
import WebGLModel from "@/components/three/WebGLModel";
import { cn } from "@/lib/cn";

/**
 * Decorative blog visual. The only animated thing in the blog feature: all
 * motion lives inside WebGLModel -> BlogScene3DModel. Everything else on the
 * page is static. `small` is hidden on phones; `large` fills the blog hero.
 */
export default function BlogScene3D({
  size = "small",
  intensity = 1,
  interactive = true,
  className,
}: {
  size?: "small" | "large";
  /** 0 = still pose, 1 = default drift, 2 = a little more movement. */
  intensity?: number;
  /** Desktop pointer tilt. Touch devices always ignore it. */
  interactive?: boolean;
  className?: string;
}) {
  const large = size === "large";

  return (
    <WebGLModel
      model="blog"
      still={<BlogSceneStill />}
      className={cn(large ? "w-full max-w-[560px]" : "hidden w-full max-w-[280px] md:block", className)}
      style={{ aspectRatio: large ? "16 / 9" : "4 / 3" }}
      modelProps={{ intensity, interactive }}
    />
  );
}

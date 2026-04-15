import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // reactCompiler breaks @react-three/fiber (useFrame direct DOM mutation pattern)  
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei", "@react-three/postprocessing"],
};

export default nextConfig;

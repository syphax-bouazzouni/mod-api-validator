import type {NextConfig} from "next";

const nextConfig: NextConfig = {
    output: 'export',
    /* config options here */
    eslint: {
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors.
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },

    basePath: "/mod-api-validator",

};

export default nextConfig;

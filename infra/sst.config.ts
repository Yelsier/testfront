/// <reference path="../.sst/platform/config.d.ts" />

export default $config({
  app() {
    return { name: "cms-front", home: "aws" };
  },
  async run() {
    // Estáticos (S3 + CloudFront) para tu cliente (Vite)
    const assets = new sst.aws.StaticSite("Assets", {
      path: "apps/renderer",
      build: {
        command: "pnpm build",
        output: "dist"
      }
    });

    // Lambda function para SSR
    const handler = new sst.aws.Function("RendererHandler", {
      handler: "apps/renderer/handler.handler",
      url: true
    });

    // Outputs
    return {
      HandlerUrl: handler.url,
      StaticUrl: assets.url,
    };
  },
});

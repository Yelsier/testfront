/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app() {
    return { name: "cms-front", home: "aws" };
  },
  async run() {
    // 1. Bucket para páginas estáticas generadas + assets
    const bucket = new sst.aws.Bucket("CmsBucket", {
      public: true
    });

    // 2. Lambda SSR/ISR - genera páginas y las guarda en S3
    const handler = new sst.aws.Function("RendererHandler", {
      handler: "../apps/renderer/handler.handler",
      url: true,
      nodejs: {
        install: ["react", "react-dom", "@aws-sdk/client-s3"],
      },
      environment: {
        BUCKET_NAME: bucket.name,
        BUCKET_URL: bucket.domain,
      },
      permissions: [
        {
          actions: ["s3:PutObject", "s3:GetObject"],
          resources: [$interpolate`${bucket.arn}/*`]
        }
      ]
    });

    // Outputs
    return {
      LambdaUrl: handler.url,
      BucketUrl: $interpolate`https://${bucket.domain}`,
      BucketName: bucket.name,
    };
  },
});

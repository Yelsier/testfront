/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app() {
    return {
      name: "cms-front",
      home: "aws",
      removal: "remove" // Permite eliminar recursos fácilmente
    };
  },
  async run() {
    // Tags globales para todos los recursos
    const tags = {
      Project: "cms-front",
      Environment: $app.stage,
      ManagedBy: "SST",
      Stack: `cms-front-${$app.stage}`
    };
    // 1. Bucket para páginas estáticas generadas + assets
    const bucket = new sst.aws.Bucket("CmsBucket", {
      public: true,
      transform: {
        bucket: {
          tags: tags
        }
      }
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
        // CDN_URL se añadirá después
      },
      permissions: [
        {
          actions: ["s3:PutObject", "s3:GetObject"],
          resources: [$interpolate`${bucket.arn}/*`]
        }
      ],
      transform: {
        function: {
          tags: tags
        },
        role: {
          tags: tags
        }
      }
    });

    // 3. CloudFront para distribución global con caching edge
    const cdn = new sst.aws.Router("CdnRouter", {
      routes: {
        "/*": handler.url
      },
      transform: {
        cdn: {
          tags: tags
        }
      }
    });

    // Outputs
    return {
      CdnUrl: cdn.url, // ← Usa esta URL (CloudFront delante de Lambda)
      LambdaUrl: handler.url, // Direct access (para debugging)
      BucketUrl: $interpolate`https://${bucket.domain}`,
      BucketName: bucket.name,
    };
  },
});

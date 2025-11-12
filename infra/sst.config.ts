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
      runtime: "nodejs22.x",
      url: true,
      nodejs: {
        install: ["@aws-sdk/client-s3"],
      },
      // Copiar el directorio dist con los bundles RSC/SSR compilados
      copyFiles: [
        {
          from: "../apps/renderer/dist",
          to: "dist"
        }
      ],
      streaming: true,
      environment: {
        BUCKET_NAME: bucket.name,
        BUCKET_URL: bucket.domain,
      },
      permissions: [
        {
          actions: ["s3:PutObject", "s3:GetObject", "s3:ListBucket"],
          resources: [bucket.arn, $interpolate`${bucket.arn}/*`]
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

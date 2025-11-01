import express from "express";
import { handle } from "./server";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para servir assets estáticos de Vite
app.use(express.static("dist"));

// Todas las rutas van al SSR
app.get("*", async (req, res) => {
    try {
        const response = await handle({
            rawPath: req.path,
            headers: req.headers as Record<string, string>
        });

        const html = await response.text();

        // Copiar headers de la Response
        response.headers.forEach((value, key) => {
            res.setHeader(key, value);
        });

        res.status(response.status).send(html);
    } catch (error) {
        console.error("SSR Error:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Dev server running at http://localhost:${PORT}`);
    console.log(`📦 Mode: SSR Development`);
    console.log(`🔄 Using mocked API from server.tsx`);
});

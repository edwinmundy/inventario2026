const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PORT = 3000;
const HOST = "0.0.0.0";

const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

let clients = [];

// Obtener IP local
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

// Vigilar cambios de archivos
fs.watch(".", { recursive: true }, () => {
  console.log("🔄 Archivo modificado → recargando navegador");
  clients.forEach(res => res.write("data: reload\n\n"));
});

// Crear servidor
const server = http.createServer((req, res) => {

  console.log(`${req.method} ${req.url}`);

  // endpoint para live reload
  if (req.url === "/livereload") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    });

    clients.push(res);

    req.on("close", () => {
      clients = clients.filter(c => c !== res);
    });

    return;
  }

  let filePath = "." + req.url;

  if (filePath === "./") {
    filePath = "./index.html";
  }

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, content) => {

    if (err) {
      res.writeHead(404, { "Content-Type": "text/html" });
      res.end("<h1>404 - Página no encontrada</h1>");
      return;
    }

    // Inyectar script live reload
    if (ext === ".html") {
      content = content.toString().replace(
        "</body>",
        `
<script>
const evtSource = new EventSource('/livereload');
evtSource.onmessage = () => location.reload();
</script>
</body>`
      );
    }

    res.writeHead(200, {
      "Content-Type": contentType
    });

    res.end(content);
  });
});

const localIP = getLocalIP();

server.listen(PORT, HOST, () => {
  console.log(`
=========================================
🚀 SERVIDOR PRO CORRIENDO
=========================================

💻 Local:
http://localhost:${PORT}

🌐 Red:
http://${localIP}:${PORT}

📱 Celular:
http://${localIP}:${PORT}

✨ Funciones:
✔ Live Reload automático
✔ Compatible celular
✔ Servidor rápido
✔ Sin dependencias

=========================================
`);
});
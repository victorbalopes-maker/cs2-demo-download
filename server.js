import express from "express";
import Client from "ssh2-sftp-client";

const app = express();

// health check (Railway precisa disso)
app.get("/", (req, res) => {
  res.send("OK");
});

// download da demo
app.get("/demo", async (req, res) => {
  const file = req.query.file;
  const server = req.query.server || "1";
  const sftp = new Client();

  try {
    console.log("Conectando servidor:", server);
    await sftp.connect({
      host: process.env[`SFTP_HOST_${server}`],
      port: Number(process.env[`SFTP_PORT_${server}`]),
      username: process.env[`SFTP_USER_${server}`],
      password: process.env[`SFTP_PASS_${server}`]
    });
    console.log("Conectado!");

    const basePath = "/game/csgo/MatchZy/";
    const files = await sftp.list(basePath);
    const found = files.find(f => f.name === file);

    if (!found) {
      console.log("Arquivo NÃO encontrado:", file);
      return res.status(404).send("Arquivo não encontrado");
    }

    console.log("Arquivo encontrado:", file, "| Tamanho:", found.size);

    // Informa o tamanho total para o browser mostrar progresso correto
    res.setHeader("Content-Length", found.size);
    res.setHeader("Content-Disposition", `attachment; filename="${file}"`);
    res.setHeader("Content-Type", "application/octet-stream");

    // Stream direto SFTP → Response (sem carregar na memória)
    await sftp.get(basePath + file, res);

  } catch (err) {
    console.error("ERRO REAL:", err);
    if (!res.headersSent) {
      res.status(500).send("Erro ao baixar arquivo");
    }
  } finally {
    sftp.end();
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor rodando na porta", PORT);
});

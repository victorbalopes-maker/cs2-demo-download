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

  if (!file) {
    return res.status(400).send("Arquivo não informado");
  }

  const sftp = new Client();

  try {
    await sftp.connect({
      host: process.env[`SFTP_HOST_${server}`],
      port: Number(process.env[`SFTP_PORT_${server}`]),
      username: process.env[`SFTP_USER_${server}`],
      password: process.env[`SFTP_PASS_${server}`]
    });

    // ⚠️ ajuste se necessário
    const basePath = "/home/container/game/csgo/MatchZy/";

    const stream = await sftp.get(basePath + file);

    res.setHeader("Content-Disposition", `attachment; filename="${file}"`);
    res.setHeader("Content-Type", "application/octet-stream");

    stream.pipe(res);

  } catch (err) {
    console.error("ERRO REAL:", err);
    res.status(500).send("Erro ao baixar arquivo");
  } finally {
    sftp.end();
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor rodando na porta", PORT);
});

import express from "express";
import Client from "ssh2-sftp-client";
import fs from "fs";
import path from "path";
import os from "os";

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
  const tmpPath = path.join(os.tmpdir(), `demo_${Date.now()}_${file}`);

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
      await sftp.end();
      return res.status(404).send("Arquivo não encontrado");
    }

    console.log("Arquivo encontrado:", file, "| Tamanho:", found.size);
    console.log("Iniciando download SFTP para tmp...");

    // Baixa para arquivo temporário no Railway
    await sftp.fastGet(basePath + file, tmpPath, {
      chunkSize: 32768,
      concurrency: 1,
      step: (transferred, chunk, total) => {
        const pct = Math.round((transferred / total) * 100);
        console.log(`Progresso SFTP: ${pct}% (${transferred}/${total})`);
      }
    });

    console.log("Download SFTP completo! Servindo ao browser...");
    await sftp.end();

    // Serve o arquivo ao browser
    res.setHeader("Content-Length", found.size);
    res.setHeader("Content-Disposition", `attachment; filename="${file}"`);
    res.setHeader("Content-Type", "application/octet-stream");

    const readStream = fs.createReadStream(tmpPath);
    readStream.pipe(res);

    readStream.on("end", () => {
      console.log("Envio ao browser concluído. Removendo tmp...");
      fs.unlink(tmpPath, () => console.log("Tmp removido:", tmpPath));
    });

    readStream.on("error", (err) => {
      console.error("Erro ao ler tmp:", err);
      fs.unlink(tmpPath, () => {});
      if (!res.headersSent) res.status(500).send("Erro ao servir arquivo");
    });

  } catch (err) {
    console.error("ERRO REAL:", err);
    await sftp.end().catch(() => {});
    fs.unlink(tmpPath, () => {});
    if (!res.headersSent) res.status(500).send("Erro ao baixar arquivo");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor rodando na porta", PORT);
});

import express from "express";
import Client from "ssh2-sftp-client";

const app = express();

app.get("/demo", async (req, res) => {
  const file = req.query.file;
  const server = req.query.server || "1";

  const sftp = new Client();

  try {
    console.log("Conectando ao servidor:", server);

    await sftp.connect({
      host: process.env[`SFTP_HOST_${server}`],
      port: process.env[`SFTP_PORT_${server}`],
      username: process.env[`SFTP_USER_${server}`],
      password: process.env[`SFTP_PASS_${server}`]
    });

    console.log("Conectado com sucesso!");

    const path = `/game/csgo/MatchZy/`; // 👈 pasta base

    const files = await sftp.list(path);

    console.log("Arquivos encontrados:");
    console.log(files.map(f => f.name));

    const found = files.find(f => f.name === file);

    if (!found) {
      console.log("Arquivo NÃO encontrado:", file);
      return res.status(404).send("Arquivo não encontrado no servidor");
    }

    console.log("Arquivo encontrado:", file);

    const stream = await sftp.get(path + file);

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

app.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});

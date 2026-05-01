import express from "express";
import Client from "ssh2-sftp-client";

const app = express();

app.get("/demo", async (req, res) => {
  const file = req.query.file;

  if (!file) {
    return res.status(400).send("Arquivo não informado");
  }

  const sftp = new Client();

  try {
    await sftp.connect({
      host: process.env.SFTP_HOST,
      port: process.env.SFTP_PORT,
      username: process.env.SFTP_USER,
      password: process.env.SFTP_PASS
    });

    const path = `/home/container/game/csgo/MatchZy/${file}`;

    const stream = await sftp.get(path);

    res.setHeader("Content-Disposition", `attachment; filename="${file}"`);
    res.setHeader("Content-Type", "application/octet-stream");

    stream.pipe(res);

  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao baixar arquivo");
  } finally {
    sftp.end();
  }
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});

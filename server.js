import express from "express";
import Client from "ssh2-sftp-client";

const app = express();

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
      port: process.env[`SFTP_PORT_${server}`],
      username: process.env[`SFTP_USER_${server}`],
      password: process.env[`SFTP_PASS_${server}`]
    });

    const path = `/game/csgo/MatchZy/${file}`;

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

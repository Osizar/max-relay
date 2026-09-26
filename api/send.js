import https from "node:https";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Only POST allowed");
  }

  const userId = req.query.user_id;
  const token = req.headers["authorization"];

  const payload = JSON.stringify(req.body);

  const options = {
    hostname: "platform-api2.max.ru",
    path: "/messages?user_id=" + userId,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
      "Authorization": token
    },
    // Обходим проверку сертификата ТОЛЬКО для этого известного госдомена,
    // т.к. корневой УЦ Минцифры отсутствует в доверенных хранилищах.
    rejectUnauthorized: false
  };

  const proxyReq = https.request(options, (proxyRes) => {
    let data = "";
    proxyRes.on("data", (chunk) => (data += chunk));
    proxyRes.on("end", () => {
      res.status(proxyRes.statusCode).send(data);
    });
  });

  proxyReq.on("error", (e) => {
    res.status(502).send("Proxy error: " + e.message);
  });

  proxyReq.write(payload);
  proxyReq.end();
}

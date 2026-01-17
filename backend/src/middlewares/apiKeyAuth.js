export const apiKeyAuth = (req, res, next) => {
  const clientKey = req.header("x-api-key");
  const serverKey = process.env.API_KEY;

  if (!clientKey) {
    return res.status(401).json({ error: "Missing API key" });
  }

  if (clientKey !== serverKey) {
    return res.status(403).json({ error: "Invalid API key" });
  }

  next();
};

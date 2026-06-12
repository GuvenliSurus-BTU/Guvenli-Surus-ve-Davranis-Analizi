function health(_req, res) {
  res.json({ data: { status: 'ok', ts: new Date().toISOString() } });
}

module.exports = { health };

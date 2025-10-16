import app = require("./app");

const server = new app.BankAPI();

server.start().catch(console.error);

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});

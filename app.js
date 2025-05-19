const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

app.post("/webhook", async (req, res) => {
  // 🟡 Always log the full incoming payload
  console.log("📥 Incoming webhook body:");
  console.log(JSON.stringify(req.body, null, 2));

  const { attachments, contact } = req.body;

  if (!attachments || attachments.length === 0) {
    console.log("⚠️ No attachments found in this message.");
    return res.status(200).send("No attachments received");
  }

  const file = attachments[0];
  const fileUrl = file.url;
  const fileName = `${(contact?.name || "contact")}_${Date.now()}_${file.file_name}`;
  const filePath = path.join(__dirname, "downloads", fileName);

  // ✅ Ensure 'downloads' folder exists
  fs.mkdirSync(path.join(__dirname, "downloads"), { recursive: true });

  try {
    const response = await axios.get(fileUrl, { responseType: "stream" });
    const writer = fs.createWriteStream(filePath);

    response.data.pipe(writer);

    writer.on("finish", () => {
      console.log("✅ File downloaded to:", filePath);
      res.status(200).send("PDF downloaded successfully");
    });

    writer.on("error", (err) => {
      console.error("❌ Error saving file:", err);
      res.status(500).send("Failed to save file");
    });
  } catch (err) {
    console.error("❌ Error downloading file:", err.message);
    res.status(500).send("Failed to download file");
  }
});

app.listen(8080, () => {
  console.log("🚀 Webhook server running on http://localhost:8080");
});

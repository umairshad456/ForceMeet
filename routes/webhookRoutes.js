const express = require("express");
const router = express.Router();
const axios = require("axios")
const path = require('path')
const fs = require('fs')
const recordingModel = require('../models/recordingModel')

router.post("/stream-webhook", async (req, res) => {
  try {
    const event = req.body;

    const callId = event.call?.id
      ? event.call.id
      : event.call_cid.split(":")[1];

    console.log("event received", event)
    console.log("callId", callId)

    if (event.type === "call.recording_ready") {
      const { url, filename, start_time, end_time, session_id } = event.call_recording;

      // ensure upload directory exists
      const uploadDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }

      // File path to save
      const filePath = path.join(uploadDir, filename);

      // Download and save file in uploads folder
      const response = await axios.get(url, { responseType: "stream" });
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      console.log("File saved:", filePath);

      // Generate your own permanent URL
      const newUrl = `/uploads/${filename}`;

      console.log("newurl", newUrl)

      const savedRecording = await recordingModel.findOneAndUpdate(
        { callId: callId },
        {
          $push: {
            call_recordings: {
              filename,
              url: newUrl,
              start_time,
              end_time,
              sessionId: session_id
            }
          }
        },
        { upsert: true, new: true }
      )
      console.log("Saved Recording", savedRecording)

    }

    res.status(200).send({ message: "Webhook received and meeting saved" });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).send("Webhook failed");
  }
});


module.exports = router;

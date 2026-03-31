// server/routes/wta.ts
import express from "express";
import { Request, Response } from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

const SCRIPTS_DIR = path.resolve(process.cwd(), "scripts");
const LATEST_PATH = path.join(SCRIPTS_DIR, "wta_latest.json");
const CORRECTIONS_PATH = path.join(SCRIPTS_DIR, "wta_corrections.json");
const FRAMES_DIR = path.join(SCRIPTS_DIR, "wta_frames");

router.get("/latest", (_req: Request, res: Response) => {
  if (!fs.existsSync(LATEST_PATH)) {
    res.json({ videos: [], run_ts: null });
    return;
  }
  res.json(JSON.parse(fs.readFileSync(LATEST_PATH, "utf8")));
});

router.get("/corrections", (_req: Request, res: Response) => {
  if (!fs.existsSync(CORRECTIONS_PATH)) {
    res.json({});
    return;
  }
  res.json(JSON.parse(fs.readFileSync(CORRECTIONS_PATH, "utf8")));
});

router.post("/corrections", (req: Request, res: Response) => {
  fs.writeFileSync(CORRECTIONS_PATH, JSON.stringify(req.body, null, 2));
  res.json({ ok: true });
});

// Serve cached frame images
router.get("/frames/:videoId/:filename", (req: Request, res: Response) => {
  const { videoId, filename } = req.params;
  const filePath = path.join(FRAMES_DIR, videoId, filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "Frame not found" });
    return;
  }
  res.sendFile(filePath);
});

export default router;

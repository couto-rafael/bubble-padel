import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "../middlewares/auth";

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Apenas imagens são permitidas."));
    } else {
      cb(null, true);
    }
  },
});

// POST /api/upload/:bucket  (bucket = avatars | banners)
router.post(
  "/:bucket",
  requireAuth,
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bucket } = req.params;
      if (bucket !== "avatars" && bucket !== "banners") {
        res.status(400).json({ error: "Bucket inválido." });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: "Nenhum arquivo enviado." });
        return;
      }

      const userId = (req as any).userId as string;
      const ext = req.file.originalname.split(".").pop() ?? "jpg";
      const path = `${userId}/${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        res.status(500).json({ error: error.message });
        return;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      res.json({ url: data.publicUrl });
    } catch (err) {
      next(err);
    }
  }
);

export { router as uploadRoutes };

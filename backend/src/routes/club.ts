import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, AuthRequest } from "../middlewares/auth";

const router = Router();
const prisma = new PrismaClient();

// GET /api/club/profile
router.get("/profile", requireAuth, async (req: AuthRequest, res) => {
  try {
    const club = await prisma.club.findUnique({
      where: { userId: req.userId },
    });

    if (!club) {
      return res.status(404).json({ error: "Clube não encontrado" });
    }

    res.json({ data: club });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar perfil do clube" });
  }
});

// PATCH /api/club/profile
router.patch("/profile", requireAuth, async (req: AuthRequest, res) => {
  try {
    const {
      name,
      cnpj,
      phone,
      logoUrl,
      city,
      state,
      courts,
      matchDuration,
      defaultStartTime,
      defaultEndTime,
    } = req.body;

    const club = await prisma.club.update({
      where: { userId: req.userId },
      data: {
        ...(name !== undefined && { name }),
        ...(cnpj !== undefined && { cnpj }),
        ...(phone !== undefined && { phone }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(courts !== undefined && { courts }),
        ...(matchDuration !== undefined && { matchDuration }),
        ...(defaultStartTime !== undefined && { defaultStartTime }),
        ...(defaultEndTime !== undefined && { defaultEndTime }),
      },
    });

    res.json({ data: club });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar perfil do clube" });
  }
});

export { router as clubRoutes };

import { Router } from "express";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

export const authRoutes = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  type: z.enum(["CLUB", "ATHLETE"]),
  // Dados extras dependendo do tipo
  cnpj: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /api/auth/register
authRoutes.post("/register", async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const exists = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (exists) {
      return res.status(400).json({ error: "Email já cadastrado" });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        type: data.type,
        ...(data.type === "CLUB" && {
          club: {
            create: {
              name: data.name,
              cnpj: data.cnpj,
              city: data.city || "",
              state: data.state || "",
            },
          },
        }),
        ...(data.type === "ATHLETE" && {
          athlete: {
            create: { fullName: data.name },
          },
        }),
      },
      include: { club: true, athlete: true },
    });

    const clubId = user.club?.id;
    const token = jwt.sign(
      { userId: user.id, userType: user.type, clubId },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );

    return res.status(201).json({
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          type: user.type,
          clubId,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
authRoutes.post("/login", async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { club: true },
    });

    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      return res.status(401).json({ error: "Email ou senha incorretos" });
    }

    const token = jwt.sign(
      { userId: user.id, userType: user.type, clubId: user.club?.id },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );

    return res.json({
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          type: user.type,
          clubId: user.club?.id,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

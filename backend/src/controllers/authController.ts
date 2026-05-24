import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { registerSchema, loginSchema, changePasswordSchema, updateProfileSchema } from '../utils/validation';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return next(new AppError(400, 'DUPLICATE_ENTRY', 'Email already registered'));
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: 'MEMBER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken({ id: user.id });

    res.status(201).json({
      success: true,
      data: { user, accessToken, refreshToken },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.isActive) {
      return next(new AppError(401, 'AUTH_INVALID', 'Invalid email or password'));
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      return next(new AppError(401, 'AUTH_INVALID', 'Invalid email or password'));
    }

    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    const accessToken = generateAccessToken(userResponse);
    const refreshToken = generateRefreshToken({ id: user.id });

    res.status(200).json({
      success: true,
      data: { user: userResponse, accessToken, refreshToken },
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return next(new AppError(400, 'VALIDATION_ERROR', 'Refresh token is required'));
    }

    try {
      const decoded = verifyRefreshToken(refreshToken);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || !user.isActive) {
        return next(new AppError(401, 'AUTH_INVALID', 'Invalid refresh token user'));
      }

      const userPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = generateAccessToken(userPayload);

      res.status(200).json({
        success: true,
        data: { accessToken },
      });
    } catch (err) {
      return next(new AppError(401, 'AUTH_INVALID', 'Refresh token is expired or invalid'));
    }
  } catch (error) {
    next(error);
  }
}

export async function logout(_req: Request, res: Response) {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError(401, 'AUTH_INVALID', 'Unauthorized'));
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      return next(new AppError(404, 'NOT_FOUND', 'User not found'));
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError(401, 'AUTH_INVALID', 'Unauthorized'));
    }

    const data = updateProfileSchema.parse(req.body);

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError(401, 'AUTH_INVALID', 'Unauthorized'));
    }

    const data = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return next(new AppError(404, 'NOT_FOUND', 'User not found'));
    }

    const isMatch = await bcrypt.compare(data.oldPassword, user.passwordHash);
    if (!isMatch) {
      return next(new AppError(400, 'VALIDATION_ERROR', 'Incorrect old password'));
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(data.newPassword, salt);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: newPasswordHash },
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function searchUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query.query as string || '';

    const users = await prisma.user.findMany({
      where: query ? {
        OR: [
          { email: { contains: query } },
          { name: { contains: query } }
        ],
        isActive: true,
      } : {
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
      },
      take: 10,
    });

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
}

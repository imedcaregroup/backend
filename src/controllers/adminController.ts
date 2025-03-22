import { Request, Response } from "express";
import prisma from "../config/db";
import { sendErrorResponse, sendSuccessResponse } from "../utils/response";
import logger from "../utils/logger";
import { comparePasswords, generateJWT, hashPassword } from "../utils/helpers";
import { AdminRequest } from "../types";
import { Prisma } from "@prisma/client";

/**
 * NOTE: Several TypeScript errors are occurring because the Prisma client doesn't
 * recognize the 'admin' model. This typically happens when the Prisma client
 * hasn't been regenerated after schema changes.
 *
 * To fix this, run:
 * npx prisma generate
 *
 * This will update the Prisma client to include all models from your schema.
 */

const AdminController = () => {


  // SUPER_ADMIN: Create Admin + Medical in one go
  const createAdminWithMedical = async (req: AdminRequest, res: Response) => {
    try {
      const { name, email, password, role = "ADMIN", medical } = req.body;

      if (
        !medical?.name ||
        !medical?.lat ||
        !medical?.lng ||
        !medical?.address
      ) {
        return sendErrorResponse({
          res,
          error: "Medical name, lat, lng, and address are required",
          statusCode: 400,
        });
      }

      const existingAdmin = await prisma.admin.findUnique({ where: { email } });
      if (existingAdmin) {
        return sendErrorResponse({
          res,
          error: "Admin with this email already exists",
          statusCode: 400,
        });
      }

      const hashedPassword = await hashPassword(password);

      const newAdmin = await prisma.admin.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: role as "ADMIN" | "SUPER_ADMIN",
        },
      });

      const newMedical = await prisma.medical.create({
        data: {
          name: medical.name,
          lat: medical.lat,
          lng: medical.lng,
          address: medical.address,
          iconUrl: medical.iconUrl ?? "", // optional
          contact: medical.contact ?? null,
          services: medical.services ?? "",
          admin: {
            connect: { id: newAdmin.id },
          },
        },
      });

      return sendSuccessResponse({
        res,
        data: {
          admin: {
            id: newAdmin.id,
            name: newAdmin.name,
            email: newAdmin.email,
            role: newAdmin.role,
          },
          medical: newMedical,
        },
        message: "Admin and medical created successfully",
      });
    } catch (error: any) {
      logger.error(`Error creating admin with medical: ${error.message}`);
      return sendErrorResponse({
        res,
        error: error.message,
        statusCode: 500,
      });
    }
  };

  // Login admin
  const loginAdmin = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Find admin by email
      const admin = await prisma.admin.findUnique({
        where: { email },
      });

      if (!admin) {
        return sendErrorResponse({
          res,
          error: "Invalid credentials",
          statusCode: 401,
        });
      }

      // Compare passwords
      const passwordMatch = await comparePasswords(password, admin.password);

      if (!passwordMatch) {
        return sendErrorResponse({
          res,
          error: "Invalid credentials",
          statusCode: 401,
        });
      }

      // Generate JWT token
      const token = await generateJWT({
        _id: admin.id,
        type: "ADMIN_AUTH",
      });

      // Return admin data and token
      const { password: _, ...adminData } = admin;

      return sendSuccessResponse({
        res,
        data: {
          admin: adminData,
          token,
        },
        message: "Login successful",
      });
    } catch (error) {
      logger.error(`Error logging in admin: ${error.message}`);
      return sendErrorResponse({
        res,
        error: error.message,
        statusCode: 500,
      });
    }
  };

  // Get admin profile
  const getProfile = async (req: AdminRequest, res: Response) => {
    try {
      if (!req.admin) {
        return sendErrorResponse({
          res,
          error: "Unauthorized",
          statusCode: 401,
        });
      }

      const adminId = req.admin._id;

      const admin = await prisma.admin.findUnique({
        where: { id: adminId },
      });

      if (!admin) {
        return sendErrorResponse({
          res,
          error: "Admin not found",
          statusCode: 404,
        });
      }

      // Remove password from response
      const { password: _, ...adminData } = admin;

      return sendSuccessResponse({
        res,
        data: adminData,
        message: "Admin profile retrieved successfully",
      });
    } catch (error) {
      logger.error(`Error getting admin profile: ${error.message}`);
      return sendErrorResponse({
        res,
        error: error.message,
        statusCode: 500,
      });
    }
  };

  // Update admin profile
  const updateProfile = async (req: AdminRequest, res: Response) => {
    try {
      if (!req.admin) {
        return sendErrorResponse({
          res,
          error: "Unauthorized",
          statusCode: 401,
        });
      }

      const adminId = req.admin._id;
      const { name, email } = req.body;

      // Update admin
      const updatedAdmin = await prisma.admin.update({
        where: { id: adminId },
        data: {
          name: name || undefined,
          email: email || undefined,
        },
      });

      // Remove password from response
      const { password: _, ...adminData } = updatedAdmin;

      return sendSuccessResponse({
        res,
        data: adminData,
        message: "Admin profile updated successfully",
      });
    } catch (error) {
      logger.error(`Error updating admin profile: ${error.message}`);
      return sendErrorResponse({
        res,
        error: error.message,
        statusCode: 500,
      });
    }
  };

  // Change admin password
  const changePassword = async (req: AdminRequest, res: Response) => {
    try {
      if (!req.admin) {
        return sendErrorResponse({
          res,
          error: "Unauthorized",
          statusCode: 401,
        });
      }

      const adminId = req.admin._id;
      const { currentPassword, newPassword } = req.body;

      // Get admin
      const admin = await prisma.admin.findUnique({
        where: { id: adminId },
      });

      if (!admin) {
        return sendErrorResponse({
          res,
          error: "Admin not found",
          statusCode: 404,
        });
      }

      // Verify current password
      const passwordMatch = await comparePasswords(
        currentPassword,
        admin.password,
      );

      if (!passwordMatch) {
        return sendErrorResponse({
          res,
          error: "Current password is incorrect",
          statusCode: 400,
        });
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      await prisma.admin.update({
        where: { id: adminId },
        data: {
          password: hashedPassword,
        },
      });

      return sendSuccessResponse({
        res,
        message: "Password changed successfully",
      });
    } catch (error) {
      logger.error(`Error changing admin password: ${error.message}`);
      return sendErrorResponse({
        res,
        error: error.message,
        statusCode: 500,
      });
    }
  };

  // Get all admins (super admin only)
  const getAllAdmins = async (req: AdminRequest, res: Response) => {
    try {
      const admins = await prisma.admin.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return sendSuccessResponse({
        res,
        data: admins,
        message: "All admins retrieved successfully",
      });
    } catch (error) {
      logger.error(`Error getting all admins: ${error.message}`);
      return sendErrorResponse({
        res,
        error: error.message,
        statusCode: 500,
      });
    }
  };

  // Get all medicals with admin filtering based on role
  const getAllMedicals = async (req: AdminRequest, res: Response) => {
    try {
      if (!req.admin) {
        return sendErrorResponse({
          res,
          error: "Unauthorized",
          statusCode: 401,
        });
      }

      const adminId = req.admin._id;
      const adminRole = req.admin.role;

      // Create where clause based on admin role
      const whereClause = adminRole === "SUPER_ADMIN" ? {} : { adminId };

      const medicals = await prisma.medical.findMany({
        where: whereClause as Prisma.MedicalWhereInput,
        include: {
          availabilities: true,
          medicalCatrgories: {
            include: {
              subCategory: true,
            },
          },
        },
      });

      return sendSuccessResponse({
        res,
        data: medicals,
        message: "Medicals retrieved successfully",
      });
    } catch (error) {
      logger.error(`Error getting medicals: ${error.message}`);
      return sendErrorResponse({
        res,
        error: error.message,
        statusCode: 500,
      });
    }
  };

  // Get all orders with admin filtering based on role
  const getAllOrders = async (req: AdminRequest, res: Response) => {
    try {
      if (!req.admin) {
        return sendErrorResponse({
          res,
          error: "Unauthorized",
          statusCode: 401,
        });
      }

      const adminId = req.admin._id;
      const adminRole = req.admin.role;

      // Create where clause based on admin role
      const whereClause = adminRole === "SUPER_ADMIN" ? {} : { adminId };

      const orders = await prisma.order.findMany({
        where: whereClause as Prisma.OrderWhereInput,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              mobileNumber: true,
            },
          },
          medical: true,
          Category: true,
          Service: true,
          orderSubCategories: {
            include: {
              subCategory: true,
            },
          },
        },
      });

      return sendSuccessResponse({
        res,
        data: orders,
        message: "Orders retrieved successfully",
      });
    } catch (error) {
      logger.error(`Error getting orders: ${error.message}`);
      return sendErrorResponse({
        res,
        error: error.message,
        statusCode: 500,
      });
    }
  };

  // Update admin role (super admin only)
  const updateAdminRole = async (req: AdminRequest, res: Response) => {
    try {
      const { adminId, role } = req.body;

      if (!adminId || !role) {
        return sendErrorResponse({
          res,
          error: "Admin ID and role are required",
          statusCode: 400,
        });
      }

      // Check if admin exists
      const adminExists = await prisma.admin.findUnique({
        where: { id: adminId },
      });

      if (!adminExists) {
        return sendErrorResponse({
          res,
          error: "Admin not found",
          statusCode: 404,
        });
      }

      // Update admin role
      const updatedAdmin = await prisma.admin.update({
        where: { id: adminId },
        data: {
          role: role as "ADMIN" | "SUPER_ADMIN",
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return sendSuccessResponse({
        res,
        data: updatedAdmin,
        message: "Admin role updated successfully",
      });
    } catch (error) {
      logger.error(`Error updating admin role: ${error.message}`);
      return sendErrorResponse({
        res,
        error: error.message,
        statusCode: 500,
      });
    }
  };

  // Delete admin (super admin only)
  const deleteAdmin = async (req: AdminRequest, res: Response) => {
    try {
      const { adminId } = req.params;

      if (!adminId) {
        return sendErrorResponse({
          res,
          error: "Admin ID is required",
          statusCode: 400,
        });
      }

      // Check if admin exists
      const adminExists = await prisma.admin.findUnique({
        where: { id: parseInt(adminId) },
      });

      if (!adminExists) {
        return sendErrorResponse({
          res,
          error: "Admin not found",
          statusCode: 404,
        });
      }

      // Prevent super admin from deleting themselves
      if (req.admin && adminExists.id === req.admin._id) {
        return sendErrorResponse({
          res,
          error: "You cannot delete your own account",
          statusCode: 400,
        });
      }

      // Delete admin
      await prisma.admin.delete({
        where: { id: parseInt(adminId) },
      });

      return sendSuccessResponse({
        res,
        message: "Admin deleted successfully",
      });
    } catch (error) {
      logger.error(`Error deleting admin: ${error.message}`);
      return sendErrorResponse({
        res,
        error: error.message,
        statusCode: 500,
      });
    }
  };

  return {
    createAdminWithMedical,
    loginAdmin,
    getProfile,
    updateProfile,
    changePassword,
    getAllAdmins,
    getAllMedicals,
    getAllOrders,
    updateAdminRole,
    deleteAdmin,
  };
};

export default AdminController;

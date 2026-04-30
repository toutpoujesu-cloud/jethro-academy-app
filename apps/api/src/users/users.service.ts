import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { IJwtPayload } from '@jethro/shared';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { InviteInstructorDto } from './dto/invite-instructor.dto';
import { AssignRoleDto } from './dto/assign-role.dto';

// Safe user fields — never return passwordHash
const SAFE_USER_SELECT = {
  id:          true,
  email:       true,
  firstName:   true,
  lastName:    true,
  role:        true,
  status:      true,
  avatarUrl:   true,
  bio:         true,
  phoneNumber: true,
  country:     true,
  timezone:    true,
  createdAt:   true,
  updatedAt:   true,
};

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── List users (Admin+) ────────────────────────────────────────────────────
  async findAll(params: { role?: UserRole; status?: UserStatus; page?: number; limit?: number }) {
    const { role, status, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(role   ? { role }   : {}),
      ...(status ? { status } : {}),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({ where, select: SAFE_USER_SELECT, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Get one user ───────────────────────────────────────────────────────────
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: SAFE_USER_SELECT,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ── Update own profile (or admin updating any user) ───────────────────────
  async update(id: string, dto: UpdateUserDto, requester: IJwtPayload) {
    // Non-admins can only update their own profile
    if (requester.role === UserRole.LEARNER || requester.role === UserRole.INSTRUCTOR) {
      if (requester.sub !== id) {
        throw new ForbiddenException('You can only update your own profile');
      }
    }

    await this.findOne(id); // ensure exists

    return this.prisma.user.update({
      where:  { id },
      data:   dto,
      select: SAFE_USER_SELECT,
    });
  }

  // ── Soft delete (Super Admin only) ────────────────────────────────────────
  async remove(id: string, requester: IJwtPayload) {
    if (requester.sub === id) {
      throw new BadRequestException('You cannot delete your own account');
    }

    const user = await this.findOne(id);

    // Prevent deleting other Super Admins
    if (user.role === UserRole.SUPER_ADMIN && requester.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only Super Admins can remove other Super Admins');
    }

    await this.prisma.user.update({
      where: { id },
      data:  { deletedAt: new Date(), status: UserStatus.INACTIVE },
    });

    this.logger.warn(`User soft-deleted: ${id} by ${requester.email}`);
    return { message: 'User deactivated successfully' };
  }

  // ── Assign role (Super Admin only) ────────────────────────────────────────
  async assignRole(id: string, dto: AssignRoleDto, requester: IJwtPayload) {
    if (requester.sub === id) {
      throw new BadRequestException('You cannot change your own role');
    }

    await this.findOne(id);

    const updated = await this.prisma.user.update({
      where:  { id },
      data:   { role: dto.role },
      select: SAFE_USER_SELECT,
    });

    this.logger.log(`Role assigned: ${id} → ${dto.role} by ${requester.email}`);
    return updated;
  }

  // ── Invite instructor ─────────────────────────────────────────────────────
  async inviteInstructor(dto: InviteInstructorDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const inviteToken = uuidv4();
    const inviteTokenExpiry = new Date();
    inviteTokenExpiry.setDate(inviteTokenExpiry.getDate() + 7); // 7-day invite

    const user = await this.prisma.user.create({
      data: {
        email:             dto.email.toLowerCase().trim(),
        passwordHash:      '', // Will be set when instructor accepts invite
        firstName:         dto.firstName.trim(),
        lastName:          dto.lastName.trim(),
        bio:               dto.bio,
        role:              UserRole.INSTRUCTOR,
        status:            UserStatus.INVITED,
        inviteToken,
        inviteTokenExpiry,
      },
      select: SAFE_USER_SELECT,
    });

    this.logger.log(`Instructor invited: ${user.email}`);

    // TODO: Send invite email via EmailService
    // await this.emailService.sendInstructorInvite(user.email, user.firstName, inviteToken);

    return {
      user,
      inviteToken, // Return for now; in production only send via email
      message: `Invitation sent to ${user.email}. Token expires in 7 days.`,
    };
  }

  // ── Accept invite (set password) ──────────────────────────────────────────
  async acceptInvite(token: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { inviteToken: token } });

    if (!user || user.status !== UserStatus.INVITED) {
      throw new NotFoundException('Invite token is invalid');
    }

    if (user.inviteTokenExpiry && user.inviteTokenExpiry < new Date()) {
      throw new BadRequestException('Invite token has expired. Please request a new invitation.');
    }

    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(password, 12);

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        status:            UserStatus.ACTIVE,
        inviteToken:       null,
        inviteTokenExpiry: null,
      },
      select: SAFE_USER_SELECT,
    });

    this.logger.log(`Instructor accepted invite: ${updated.email}`);
    return updated;
  }
}

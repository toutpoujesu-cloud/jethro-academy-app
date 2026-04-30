import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { IJwtPayload } from '@jethro/shared';
import { PaymentsService } from './payments.service';
import { CreateCheckoutDto, GrantAccessDto } from './dto/create-checkout.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // POST /api/v1/payments/checkout
  @Post('checkout')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a Stripe checkout session for a course' })
  createCheckout(@Body() dto: CreateCheckoutDto, @CurrentUser() user: IJwtPayload) {
    return this.paymentsService.createCheckout(dto, user);
  }

  // POST /api/v1/payments/webhook — no auth, raw body required
  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook endpoint (called by Stripe, not clients)' })
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(req.rawBody!, signature);
  }

  // GET /api/v1/payments/history
  @Get('history')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: "Get learner's own payment history" })
  getHistory(@CurrentUser() user: IJwtPayload) {
    return this.paymentsService.getHistory(user);
  }

  // POST /api/v1/payments/grant-access — Admin+
  @Post('grant-access')
  @Roles(UserRole.CONTENT_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Manually grant course access to a learner (Admin+)' })
  grantAccess(@Body() dto: GrantAccessDto, @CurrentUser() granter: IJwtPayload) {
    return this.paymentsService.grantAccess(dto, granter);
  }
}

import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

// Guards Buzzle super-admin endpoints (/buzzle-admin/*).
// Accepts EITHER:
//   1. A real user JWT session with canAccessFullAdminPanel=true
//   2. A workspace-scoped API key belonging to the Buzzle admin
//      workspace (Agence-buzzle) — we accept API keys here because
//      operational scripts (Clément's cron, migrations, etc.) call
//      us with API keys, not user sessions.
//
// Rejects unauthenticated calls and non-admin user sessions.

const BUZZLE_ADMIN_WORKSPACE_SUBDOMAIN = 'agence-buzzle';

export class BuzzleSuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;

    const user = request.user as
      | { canAccessFullAdminPanel?: boolean }
      | undefined;
    const workspace = request.workspace as
      | { subdomain?: string }
      | undefined;
    const apiKey = request.apiKey as { id?: string } | undefined;

    if (user?.canAccessFullAdminPanel === true) {
      return true;
    }

    if (
      apiKey !== undefined &&
      workspace?.subdomain === BUZZLE_ADMIN_WORKSPACE_SUBDOMAIN
    ) {
      return true;
    }

    throw new ForbiddenException(
      'Buzzle super admin required. Sign in with a canAccessFullAdminPanel=true user or use an API key from the Agence-buzzle workspace.',
    );
  }
}

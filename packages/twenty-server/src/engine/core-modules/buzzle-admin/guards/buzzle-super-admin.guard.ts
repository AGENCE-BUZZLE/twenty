import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

// Guards Buzzle super-admin endpoints (/buzzle-admin/*).
// Accepts EITHER:
//   1. A real user JWT session with canAccessFullAdminPanel=true
//      (this is the primary path Clément's contact@agence-buzzle.com)
//   2. A workspace-scoped API key belonging to a whitelisted admin
//      workspace subdomain we accept API keys here because
//      operational scripts (crons, migrations, n8n) call us with API
//      keys, not user sessions.
//
// The whitelist is intentionally small (Clément's admin container
// workspace subdomains). Rejects unauthenticated calls, non-admin
// user sessions, and API keys from client workspaces.

const BUZZLE_ADMIN_WORKSPACE_SUBDOMAINS: readonly string[] = [
  'gestion',
  'agence-buzzle', // legacy, kept for backward compat during migration
];

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
      workspace?.subdomain !== undefined &&
      BUZZLE_ADMIN_WORKSPACE_SUBDOMAINS.includes(workspace.subdomain)
    ) {
      return true;
    }

    throw new ForbiddenException(
      'Buzzle super admin required. Sign in with a canAccessFullAdminPanel=true user or use an API key from the Gestion admin workspace.',
    );
  }
}

import { ProjectStatus, WebsiteProject } from '../models/project';

export interface TransitionActor {
  id: string;
  role: string;
  name: string;
}

export interface TransitionContext {
  actor: TransitionActor;
  project: WebsiteProject;
  isCustomerWorkflow?: boolean; // true only when invoked via approveVersion or requestRevision
  versionId?: string;
  approvedVersionId?: string;
  deliveredUrl?: string;
  deliveryNotes?: string;
  hasCustomerApproval?: boolean;
  revisionCount?: number;
  revisionLimit?: number;
  note?: string;
}

export interface TransitionValidationResult {
  allowed: boolean;
  statusCode?: 400 | 403;
  reason?: string;
}

/**
 * Exact canonical transition validator for WebCraftAI Phase 13.
 * Authoritative server-side state machine enforcement.
 */
export function canTransitionProjectStatus(
  currentStatus: ProjectStatus,
  nextStatus: ProjectStatus,
  actor: TransitionActor,
  context: TransitionContext
): TransitionValidationResult {
  const normalizedRole = actor.role.toLowerCase();

  // 1. Role Authorization Checks
  if (normalizedRole === 'vendor') {
    return {
      allowed: false,
      statusCode: 403,
      reason: 'Forbidden: Vendors are not authorized to view or transition website projects.'
    };
  }

  // 2. Customer Direct Mutation Protection
  // Customers cannot directly invoke status mutations.
  // They may only transition status via the dedicated approveVersion (REVIEW -> COMPLETED)
  // or requestRevision (REVIEW -> IN_PROGRESS) workflows.
  if (normalizedRole === 'user' || normalizedRole === 'customer') {
    if (!context.isCustomerWorkflow) {
      return {
        allowed: false,
        statusCode: 403,
        reason: 'Forbidden: Customers cannot mutate project status directly. Use the review/approval or revision endpoints.'
      };
    }

    // Customer must own the project
    if (context.project.customerId !== actor.id) {
      return {
        allowed: false,
        statusCode: 403,
        reason: 'Forbidden: You do not own this website project.'
      };
    }
  }

  // 3. Terminal Status Locks
  if (currentStatus === 'DELIVERED') {
    return {
      allowed: false,
      statusCode: 400,
      reason: `Invalid transition: Project is in terminal status 'DELIVERED' and cannot be transitioned to '${nextStatus}'.`
    };
  }

  if (currentStatus === 'CANCELLED') {
    return {
      allowed: false,
      statusCode: 400,
      reason: `Invalid transition: Project is in terminal status 'CANCELLED' and cannot be transitioned to '${nextStatus}'.`
    };
  }

  // 4. Same Status No-Op or Redundant Transition
  if (currentStatus === nextStatus) {
    return {
      allowed: false,
      statusCode: 400,
      reason: `Project is already in '${currentStatus}' status.`
    };
  }

  // 5. Canonical Transition Rules
  switch (currentStatus) {
    case 'PLANNING': {
      if (nextStatus === 'ASSIGNED') {
        // Must be staff assigning
        if (normalizedRole !== 'admin' && normalizedRole !== 'manager') {
          return { allowed: false, statusCode: 403, reason: 'Only Admin or Manager can assign a project.' };
        }
        return { allowed: true };
      }
      if (nextStatus === 'CANCELLED') {
        if (normalizedRole !== 'admin' && normalizedRole !== 'manager') {
          return { allowed: false, statusCode: 403, reason: 'Only Admin or Manager can cancel a project in planning.' };
        }
        return { allowed: true };
      }
      return {
        allowed: false,
        statusCode: 400,
        reason: `Invalid transition from 'PLANNING' to '${nextStatus}'. Allowed: ASSIGNED, CANCELLED.`
      };
    }

    case 'ASSIGNED': {
      if (nextStatus === 'IN_PROGRESS') {
        if (normalizedRole !== 'admin' && normalizedRole !== 'manager') {
          return { allowed: false, statusCode: 403, reason: 'Only Admin or Manager can move project to IN_PROGRESS.' };
        }
        return { allowed: true };
      }
      if (nextStatus === 'CANCELLED') {
        if (normalizedRole !== 'admin' && normalizedRole !== 'manager') {
          return { allowed: false, statusCode: 403, reason: 'Only Admin or Manager can cancel an assigned project.' };
        }
        return { allowed: true };
      }
      return {
        allowed: false,
        statusCode: 400,
        reason: `Invalid transition from 'ASSIGNED' to '${nextStatus}'. Allowed: IN_PROGRESS, CANCELLED.`
      };
    }

    case 'IN_PROGRESS': {
      if (nextStatus === 'REVIEW') {
        if (normalizedRole !== 'admin' && normalizedRole !== 'manager') {
          return { allowed: false, statusCode: 403, reason: 'Only Admin or Manager can submit project for customer REVIEW.' };
        }
        return { allowed: true };
      }
      if (nextStatus === 'ON_HOLD') {
        if (normalizedRole !== 'admin' && normalizedRole !== 'manager') {
          return { allowed: false, statusCode: 403, reason: 'Only Admin or Manager can put project ON_HOLD.' };
        }
        return { allowed: true };
      }
      if (nextStatus === 'CANCELLED') {
        if (normalizedRole !== 'admin' && normalizedRole !== 'manager') {
          return { allowed: false, statusCode: 403, reason: 'Only Admin or Manager can cancel an in-progress project.' };
        }
        return { allowed: true };
      }
      return {
        allowed: false,
        statusCode: 400,
        reason: `Invalid transition from 'IN_PROGRESS' to '${nextStatus}'. Allowed: REVIEW, ON_HOLD, CANCELLED.`
      };
    }

    case 'ON_HOLD': {
      if (nextStatus === 'IN_PROGRESS') {
        if (normalizedRole !== 'admin' && normalizedRole !== 'manager') {
          return { allowed: false, statusCode: 403, reason: 'Only Admin or Manager can resume project to IN_PROGRESS.' };
        }
        return { allowed: true };
      }
      if (nextStatus === 'CANCELLED') {
        if (normalizedRole !== 'admin' && normalizedRole !== 'manager') {
          return { allowed: false, statusCode: 403, reason: 'Only Admin or Manager can cancel a project on hold.' };
        }
        return { allowed: true };
      }
      return {
        allowed: false,
        statusCode: 400,
        reason: `Invalid transition from 'ON_HOLD' to '${nextStatus}'. Allowed: IN_PROGRESS, CANCELLED.`
      };
    }

    case 'REVIEW': {
      // Transition A: Customer approves website -> COMPLETED
      if (nextStatus === 'COMPLETED') {
        if (!context.isCustomerWorkflow && normalizedRole !== 'admin' && normalizedRole !== 'manager') {
          return {
            allowed: false,
            statusCode: 403,
            reason: 'Customer approval must be performed by the project owner.'
          };
        }
        return { allowed: true };
      }

      // Transition B: Customer requests revision -> IN_PROGRESS
      if (nextStatus === 'IN_PROGRESS') {
        // Validate revision limit
        const count = context.revisionCount ?? context.project.revisionCount ?? 0;
        const limit = context.revisionLimit ?? context.project.revisionLimit ?? 3;
        if (count >= limit) {
          return {
            allowed: false,
            statusCode: 400,
            reason: `Revision limit exceeded. This package allows up to ${limit} revisions (${count} already used).`
          };
        }
        return { allowed: true };
      }

      return {
        allowed: false,
        statusCode: 400,
        reason: `Invalid transition from 'REVIEW' to '${nextStatus}'. In REVIEW, project can only transition to 'COMPLETED' (via Approval) or 'IN_PROGRESS' (via Revision request).`
      };
    }

    case 'COMPLETED': {
      // Allowed transition: COMPLETED -> DELIVERED (Admin/Manager only)
      if (nextStatus === 'DELIVERED') {
        if (normalizedRole !== 'admin' && normalizedRole !== 'manager') {
          return {
            allowed: false,
            statusCode: 403,
            reason: 'Forbidden: Only authorized Admin or Manager can deliver a completed project.'
          };
        }

        // Delivery prerequisite 1: Customer approval must exist
        if (!context.hasCustomerApproval && !context.project.approvalId) {
          return {
            allowed: false,
            statusCode: 400,
            reason: 'Cannot deliver project: Valid customer approval record does not exist for this project.'
          };
        }

        // Delivery prerequisite 2: Real delivery link/file
        const url = context.deliveredUrl || context.project.deliveredUrl;
        if (!url || typeof url !== 'string' || url.trim().length < 5) {
          return {
            allowed: false,
            statusCode: 400,
            reason: 'Cannot deliver project: A valid real delivery URL or artifact link is required.'
          };
        }

        return { allowed: true };
      }

      // Backward transitions strictly forbidden:
      // COMPLETED -> IN_PROGRESS is forbidden
      // COMPLETED -> REVIEW is forbidden
      return {
        allowed: false,
        statusCode: 400,
        reason: `Invalid transition from 'COMPLETED' to '${nextStatus}'. Completed projects cannot be reopened to '${nextStatus}'. Allowed transition: DELIVERED.`
      };
    }

    default:
      return {
        allowed: false,
        statusCode: 400,
        reason: `Unrecognized current project status '${currentStatus}'.`
      };
  }
}

export class ProjectTransitionError extends Error {
  public statusCode: 400 | 403;
  constructor(message: string, statusCode: 400 | 403 = 400) {
    super(message);
    this.name = 'ProjectTransitionError';
    this.statusCode = statusCode;
  }
}

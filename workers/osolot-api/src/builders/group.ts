import {
  groupAdmissionTypeSchema,
  groupDetailSchema,
  groupSummarySchema,
  groupVisibilitySchema,
  membershipRoleSchema,
  membershipStatusSchema,
  type GroupDetail,
  type GroupSummary,
} from "@osolot/shared";
import type { Group, Membership } from "../../supabase-types/table-types";
import type { MembershipWithProfile } from "../lib/permissions/group";
import type { PostWithOwner } from "../lib/permissions/post";
import { toMembershipSummary } from "./membership";
import { toPostSummary } from "./post";

export interface ViewerMembershipInfo {
  status: string;
  role: string;
}

export function toGroupSummary(
  group: Group,
  viewerMembership?: ViewerMembershipInfo | null,
): GroupSummary {
  return groupSummarySchema.parse({
    id: group.id,
    name: group.name,
    description: group.description,
    visibility: groupVisibilitySchema.parse(group.visibility),
    admissionType: groupAdmissionTypeSchema.parse(group.admission_type),
    membershipStatus: viewerMembership
      ? membershipStatusSchema.parse(viewerMembership.status)
      : undefined,
    membershipRole: viewerMembership
      ? membershipRoleSchema.parse(viewerMembership.role)
      : undefined,
  });
}

export function buildGroupDetail(input: {
  group: Group;
  members: MembershipWithProfile[];
  sharedPosts: PostWithOwner[];
  viewerMembership?: ViewerMembershipInfo | null;
}): GroupDetail {
  return groupDetailSchema.parse({
    summary: toGroupSummary(input.group, input.viewerMembership),
    members: input.members.map((m) =>
      toMembershipSummary(m, m.profiles, m.groups),
    ),
    applicationQuestion: input.group.application_question,
    sharedPosts: input.sharedPosts.map((p) => toPostSummary(p)),
  });
}

export function viewerMembershipFromRow(
  membership: Membership | null,
): ViewerMembershipInfo | null {
  if (!membership) return null;
  return { status: membership.status, role: membership.role };
}

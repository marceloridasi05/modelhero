// ACL types kept for interface compatibility - no longer backed by GCS

const ACL_POLICY_METADATA_KEY = "custom:aclPolicy";

// The type of the access group.
export enum ObjectAccessGroupType {}

// The logic user group that can access the object.
export interface ObjectAccessGroup {
  type: ObjectAccessGroupType;
  id: string;
}

export enum ObjectPermission {
  READ = "read",
  WRITE = "write",
}

export interface ObjectAclRule {
  group: ObjectAccessGroup;
  permission: ObjectPermission;
}

export interface ObjectAclPolicy {
  owner: string;
  visibility: "public" | "private";
  aclRules?: Array<ObjectAclRule>;
}

// Stub implementations - local storage does not use GCS ACL metadata

export async function setObjectAclPolicy(
  _objectFile: string,
  _aclPolicy: ObjectAclPolicy,
): Promise<void> {
  // No-op for local storage
}

export async function getObjectAclPolicy(
  _objectFile: string,
): Promise<ObjectAclPolicy | null> {
  return null;
}

export async function canAccessObject({
  userId: _userId,
  objectFile: _objectFile,
  requestedPermission,
}: {
  userId?: string;
  objectFile: string;
  requestedPermission: ObjectPermission;
}): Promise<boolean> {
  // For local storage, all objects are accessible
  return requestedPermission === ObjectPermission.READ;
}

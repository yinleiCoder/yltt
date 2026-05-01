export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
}

export const PERMISSIONS = {
  // User management
  VIEW_USERS: 'view_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',

  // Content management
  CREATE_STORY: 'create_story',
  EDIT_STORY: 'edit_story',
  DELETE_STORY: 'delete_story',
  CREATE_PHOTO: 'create_photo',
  DELETE_PHOTO: 'delete_photo',
  CREATE_VIDEO: 'create_video',
  DELETE_VIDEO: 'delete_video',

  // Blessings & Comments
  CREATE_BLESSING: 'create_blessing',
  CREATE_COMMENT: 'create_comment',
  DELETE_COMMENT: 'delete_comment',
}

const rolePermissions = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.USER]: [
    PERMISSIONS.CREATE_BLESSING,
    PERMISSIONS.CREATE_COMMENT,
  ],
}

export function hasPermission(role, permission) {
  return rolePermissions[role]?.includes(permission) ?? false
}

export function isAdmin(role) {
  return role === ROLES.ADMIN
}

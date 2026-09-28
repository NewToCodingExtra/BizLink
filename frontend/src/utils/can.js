export function hasRole(page, role) {
  return page.props.auth?.roles?.includes(role);
}
export function can(page, permission) {
  return page.props.auth?.permissions?.includes(permission);
}

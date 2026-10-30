const DETAIL_MESSAGES: Record<string, string> = {
  "Invalid Google token": "El inicio de sesión con Google no es válido.",
  "Invalid refresh token": "Tu sesión ha expirado. Vuelve a iniciar sesión.",
  "Missing authentication token": "Debes iniciar sesión para continuar.",
  "Invalid or expired token": "Tu sesión ha expirado. Vuelve a iniciar sesión.",
  "Invalid token type": "Tu sesión no es válida. Vuelve a iniciar sesión.",
  "Invalid token payload": "Tu sesión no es válida. Vuelve a iniciar sesión.",
  "User not found": "No encontramos tu cuenta.",
  "User already belongs to a family": "Ya perteneces a un grupo familiar.",
  "User does not belong to a family": "Aún no perteneces a ningún grupo familiar.",
  "Family not found": "No encontramos el grupo familiar.",
  "Only admins can manage members": "Solo los administradores pueden gestionar integrantes.",
  "Member not found": "No encontramos a ese integrante en el grupo.",
  "Admins cannot remove themselves": "No puedes expulsarte a ti mismo del grupo.",
  "A family must keep at least one admin": "El grupo debe conservar al menos un administrador.",
  "Only admins can create invitations": "Solo los administradores pueden generar invitaciones.",
  "Invalid invitation token": "La invitación no es válida.",
  "Invitation already used": "Esta invitación ya fue utilizada.",
  "Invitation expired": "Esta invitación ha expirado.",
  "Invitation family not found": "El grupo de la invitación ya no existe.",
  "Family has reached maximum member limit": "El grupo alcanzó el límite de 10 integrantes.",
};

const STATUS_MESSAGES: Record<number, string> = {
  400: "La solicitud no es válida.",
  401: "Tu sesión no es válida. Vuelve a iniciar sesión.",
  403: "No tienes permisos para realizar esta acción.",
  404: "No encontramos el recurso solicitado.",
  422: "Revisa los datos ingresados e inténtalo de nuevo.",
};

export function translateApiError(status: number, detail?: unknown): string {
  if (typeof detail === "string" && DETAIL_MESSAGES[detail]) {
    return DETAIL_MESSAGES[detail];
  }

  if (detail && typeof detail === "object" && !Array.isArray(detail)) {
    const message = (detail as { message?: unknown }).message;
    if (typeof message === "string" && DETAIL_MESSAGES[message]) {
      return DETAIL_MESSAGES[message];
    }
  }

  return STATUS_MESSAGES[status] ?? "Ocurrió un error inesperado. Inténtalo de nuevo.";
}

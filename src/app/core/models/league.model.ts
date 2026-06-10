export interface League {
  id:          string;
  name:        string;
  code:        string;   // Código de invitación (ej: "MANO2026")
  createdBy:   string;   // uid del admin que la creó
  createdAt:   Date;
  memberCount: number;
  isDefault:   boolean;  // true solo para "Mano tengo fe"
}

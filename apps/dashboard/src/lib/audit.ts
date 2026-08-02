import { prisma } from "@gameverse/database";

export interface AuditLogEntry {
  actorId?: string;
  action: string;
  targetEntity: string;
  targetId?: string;
  changesJson?: Record<string, unknown>;
  ipAddress?: string;
}

export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        action: entry.action,
        targetEntity: entry.targetEntity,
        targetId: entry.targetId ?? null,
        changesJson: entry.changesJson ? JSON.parse(JSON.stringify(entry.changesJson)) : undefined,
        ipAddress: entry.ipAddress ?? null,
      },
    });
  } catch {
    // Audit log failures should never block the main operation
  }
}

export interface IBlacklist {
  userId: string;
  email: string;
  reason: string;
  bannedAt: Date;
  bannedBy: string;
  expiresAt?: Date; // null = ban vĩnh viễn
  deviceInfo?: {
    deviceId: string;
    userAgent: string;
    ipAddress: string;
  };
}

-- CreateEnum
ALTER TABLE `TeamMembership`
  ADD COLUMN `accessLevel` ENUM('VIEW', 'SHARE', 'FULL') NOT NULL DEFAULT 'FULL',
  ADD COLUMN `revokedAt` DATETIME(3) NULL,
  ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- AlterTable TeamInvite
ALTER TABLE `TeamInvite`
  ADD COLUMN `role` ENUM('ADMIN', 'TEAM_LEAD') NOT NULL DEFAULT 'TEAM_LEAD',
  ADD COLUMN `accessLevel` ENUM('VIEW', 'SHARE', 'FULL') NOT NULL DEFAULT 'FULL',
  ADD COLUMN `tokenHash` VARCHAR(191) NULL,
  ADD COLUMN `expiresAt` DATETIME(3) NULL,
  ADD COLUMN `acceptedAt` DATETIME(3) NULL;

-- Backfill invite tokens for any existing rows (revoked / unusable)
UPDATE `TeamInvite`
SET
  `tokenHash` = CONCAT('legacy_', `id`),
  `expiresAt` = COALESCE(`expiresAt`, NOW())
WHERE `tokenHash` IS NULL;

ALTER TABLE `TeamInvite`
  MODIFY `tokenHash` VARCHAR(191) NOT NULL,
  MODIFY `expiresAt` DATETIME(3) NOT NULL;

CREATE UNIQUE INDEX `TeamInvite_tokenHash_key` ON `TeamInvite`(`tokenHash`);

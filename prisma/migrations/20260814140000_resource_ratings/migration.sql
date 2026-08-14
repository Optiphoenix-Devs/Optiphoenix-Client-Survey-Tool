ALTER TABLE `Question`
  MODIFY `type` ENUM(
    'SHORT_TEXT',
    'LONG_TEXT',
    'SINGLE_CHOICE',
    'MULTIPLE_CHOICE',
    'COMMENT',
    'SUGGESTION',
    'RATING',
    'RESOURCE_RATING',
    'YES_NO'
  ) NOT NULL;

CREATE TABLE `Resource` (
  `id` VARCHAR(191) NOT NULL,
  `clientId` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `Resource_clientId_idx` ON `Resource`(`clientId`);

ALTER TABLE `Resource`
  ADD CONSTRAINT `Resource_clientId_fkey`
  FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

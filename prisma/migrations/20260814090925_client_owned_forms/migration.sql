-- DropForeignKey
ALTER TABLE `Answer` DROP FOREIGN KEY `Answer_questionId_fkey`;

-- DropIndex
DROP INDEX `Answer_questionId_fkey` ON `Answer`;

-- AlterTable
ALTER TABLE `ClientSurvey` ADD COLUMN `formSnapshot` JSON NULL,
    ADD COLUMN `retainUntil` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Form` ADD COLUMN `clientId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Question` MODIFY `type` ENUM('SHORT_TEXT', 'LONG_TEXT', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'COMMENT', 'SUGGESTION', 'RATING', 'YES_NO') NOT NULL;

-- CreateIndex
CREATE INDEX `Form_clientId_idx` ON `Form`(`clientId`);

-- AddForeignKey
ALTER TABLE `Form` ADD CONSTRAINT `Form_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Answer` ADD CONSTRAINT `Answer_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Remove leftover team-level forms that were never attached to a client
DELETE FROM `Form` WHERE `clientId` IS NULL;

-- Unique public link lives on the form itself
ALTER TABLE `Form` ADD COLUMN `publicToken` VARCHAR(191) NULL;

UPDATE `Form`
SET `publicToken` = REPLACE(UUID(), '-', '')
WHERE `publicToken` IS NULL;

ALTER TABLE `Form` MODIFY `publicToken` VARCHAR(191) NOT NULL;
CREATE UNIQUE INDEX `Form_publicToken_key` ON `Form`(`publicToken`);

-- Forms always belong to one client
ALTER TABLE `Form` MODIFY `clientId` VARCHAR(191) NOT NULL;

-- Unpublish must not keep a special archived copy of the form
ALTER TABLE `ClientSurvey` DROP COLUMN `formSnapshot`,
    DROP COLUMN `retainUntil`;

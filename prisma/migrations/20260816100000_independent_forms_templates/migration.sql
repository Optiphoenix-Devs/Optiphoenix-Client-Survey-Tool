-- Make forms independent of team/client, and add reusable templates.

ALTER TABLE `Form` DROP FOREIGN KEY `Form_teamId_fkey`;
ALTER TABLE `Form` DROP FOREIGN KEY `Form_clientId_fkey`;
ALTER TABLE `ClientSurvey` DROP FOREIGN KEY `ClientSurvey_clientId_fkey`;

ALTER TABLE `Form` MODIFY `teamId` VARCHAR(191) NULL;
ALTER TABLE `Form` MODIFY `clientId` VARCHAR(191) NULL;
ALTER TABLE `Form` ADD COLUMN `sourceTemplateId` VARCHAR(191) NULL;

ALTER TABLE `ClientSurvey` MODIFY `clientId` VARCHAR(191) NULL;

CREATE TABLE `FormTemplate` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FormTemplate_createdById_idx`(`createdById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `FormTemplateQuestion` (
    `id` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NOT NULL,
    `type` ENUM('SHORT_TEXT', 'LONG_TEXT', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'DROPDOWN', 'COMMENT', 'SUGGESTION', 'RATING', 'RESOURCE_RATING', 'YES_NO') NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `order` INTEGER NOT NULL,
    `required` BOOLEAN NOT NULL DEFAULT false,
    `options` JSON NULL,

    INDEX `FormTemplateQuestion_templateId_order_idx`(`templateId`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `Form_createdById_idx` ON `Form`(`createdById`);
CREATE INDEX `Form_sourceTemplateId_idx` ON `Form`(`sourceTemplateId`);

ALTER TABLE `Form` ADD CONSTRAINT `Form_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Form` ADD CONSTRAINT `Form_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Form` ADD CONSTRAINT `Form_sourceTemplateId_fkey` FOREIGN KEY (`sourceTemplateId`) REFERENCES `FormTemplate`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `FormTemplate` ADD CONSTRAINT `FormTemplate_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `FormTemplateQuestion` ADD CONSTRAINT `FormTemplateQuestion_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `FormTemplate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ClientSurvey` ADD CONSTRAINT `ClientSurvey_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

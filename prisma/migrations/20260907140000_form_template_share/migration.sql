-- CreateTable
CREATE TABLE `FormTemplateShare` (
    `id` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `sharedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `FormTemplateShare_templateId_email_key`(`templateId`, `email`),
    INDEX `FormTemplateShare_email_idx`(`email`),
    INDEX `FormTemplateShare_userId_idx`(`userId`),
    INDEX `FormTemplateShare_templateId_idx`(`templateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FormTemplateShare` ADD CONSTRAINT `FormTemplateShare_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `FormTemplate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FormTemplateShare` ADD CONSTRAINT `FormTemplateShare_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FormTemplateShare` ADD CONSTRAINT `FormTemplateShare_sharedById_fkey` FOREIGN KEY (`sharedById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

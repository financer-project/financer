-- AlterTable
ALTER TABLE `AdminSettings` ADD COLUMN `transactionTemplateCronTime` VARCHAR(191) NOT NULL DEFAULT '00:00';

-- AlterTable
ALTER TABLE `Transaction` ADD COLUMN `transactionTemplateId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `TransactionTemplate` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `type` ENUM('INCOME', 'EXPENSE', 'TRANSFER') NOT NULL,
    `amount` DOUBLE NOT NULL,
    `frequency` ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY') NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `nextDueDate` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `accountId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NULL,
    `counterpartyId` VARCHAR(191) NULL,
    `householdId` VARCHAR(191) NOT NULL,
    `createdById` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_transactionTemplateId_fkey` FOREIGN KEY (`transactionTemplateId`) REFERENCES `TransactionTemplate`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransactionTemplate` ADD CONSTRAINT `TransactionTemplate_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransactionTemplate` ADD CONSTRAINT `TransactionTemplate_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransactionTemplate` ADD CONSTRAINT `TransactionTemplate_counterpartyId_fkey` FOREIGN KEY (`counterpartyId`) REFERENCES `Counterparty`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransactionTemplate` ADD CONSTRAINT `TransactionTemplate_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransactionTemplate` ADD CONSTRAINT `TransactionTemplate_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

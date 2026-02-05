-- AlterTable
ALTER TABLE `HouseholdMembership` ADD COLUMN `defaultAccountId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `HouseholdMembership` ADD CONSTRAINT `HouseholdMembership_defaultAccountId_fkey` FOREIGN KEY (`defaultAccountId`) REFERENCES `Account`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

# Import System

This directory contains the code for the import system, which allows users to import transactions from CSV files.

## File Storage

Import files are stored on the filesystem in the `data/imports/[id]/import.csv` directory, where `[id]` is the ID of the import job. This directory is automatically created when an import job is created.

The `data` directory is ignored by Git, so import files will not be committed to the repository.

## Import Process

1. The user uploads a CSV file through the Import Wizard.
2. The file is saved to the filesystem in the `data/imports/[id]/import.csv` directory.
3. The import job is created with a reference to the file path.
4. The import job is processed in the background using the job queue.
5. The import processor reads the file from the filesystem and processes it to create transactions.

## File Cleanup

Currently, there is no automatic cleanup of import files. In a production environment, you might want to add a job to clean up old import files.
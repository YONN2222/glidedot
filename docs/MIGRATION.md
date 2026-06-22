# Import, Export & Backup (Migration)

Glide provides multiple ways to move data in and out of the system. This is crucial for initial onboarding, CI/CD integrations, and disaster recovery.

## 1. Translations (Import / Export)
Translations are the core data of your project. Glide supports importing and exporting them on a per-language basis.

- **Exporting:** Returns a flat JSON key-value map (e.g., `{"header.title": "Welcome"}`).
- **Importing:** Accepts a JSON map. You can optionally set the `importAsPending` flag to force all imported translations into the "Pending Review" status rather than automatically approving them. Missing keys are created on the fly.

## 2. Conventions (Import / Export)
Setting up Naming Conventions (Templates, Variables, Glossary) can be tedious. Glide allows you to export your entire conventions rule-set as a JSON file and import it into another project.

- **Payload:** The JSON contains three arrays: `templates`, `variables`, and `glossary`.
- **Behavior:** When importing, Glide updates existing terms/variables with the same name and inserts new ones. Existing templates with the same name are overwritten.

## 3. Automated S3 Backups (Disaster Recovery)
For self-hosted instances, Glide includes an automated backup service.
- **Process:** The service safely copies the entire SQLite database (`sqlite.db`) and uploads it to an S3-compatible storage bucket (AWS S3, MinIO, Cloudflare R2).
- **Configuration:** Requires configuring S3 credentials (Access Key, Secret Key, Bucket Name, Region, Endpoint) in the system settings.

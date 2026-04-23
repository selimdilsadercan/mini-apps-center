# Backend & Database Standards

## 1. Database Architecture (Supabase/PostgreSQL)

### 1.1. Schema Isolation
- Every independent service must have its own dedicated schema (e.g., `kiler`, `tournament`, `subcenter`).
- The `public` schema should only contain global tables like `users` or shared metadata.

### 1.2. Table Management
- **Root Table Definition**: Each service directory must contain a `table.sql` file that represents the **ideal/latest state** of the database structure for that service.
- **Migrations**: 
  - Any changes to an existing table MUST be performed via migration files located in a `migrations/` folder.
  - Migration files should follow the naming convention `01_description.up.sql`.
  - When a table is updated via migration, the root `table.sql` must also be updated to reflect the new state.

### 1.3. Function Management (RPC)
- **Location**: All RPC functions must be stored in a `functions/` folder within the service directory.
- **Cleanup Requirement**: Every function SQL file **MUST** start with a `DROP FUNCTION IF EXISTS ...` statement.
  - This is critical for clearing old versions of the function, especially when migrating from the `public` schema to a dedicated service schema.
  - Example: `DROP FUNCTION IF EXISTS public.old_function_name(param_type);`
- **Schema Qualification**: Functions should be created within the service's schema and explicitly reference tables using the schema prefix.

## 2. Backend Logic (Encore.dev)

### 2.1. RPC Integration
- Use `supabase.rpc("schema.function_name", { params })` to call database logic.
- Avoid complex business logic inside TypeScript if it can be handled more efficiently within a PostgreSQL function.

### 2.2. Table Access
- When direct table access is necessary, always specify the schema: `supabase.schema("service_name").from("table_name")`.

---

## Session Summary (Migration to Schema Architecture)
The following services have been successfully migrated to the dedicated schema + RPC architecture:
1. **Kiler**: `kiler` schema
2. **Tournament**: `tournament` schema
3. **ITU Yemekhane**: `itu_yemekhane` schema
4. **Subcenter**: `subcenter` schema
5. **Recipe**: `recipe` schema

All direct `public` table accesses have been replaced with schema-qualified RPC calls.

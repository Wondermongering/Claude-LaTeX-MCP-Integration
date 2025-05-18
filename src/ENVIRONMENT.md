# Environment Configuration

This project uses environment variables to configure the MCP server and external services. Copy the provided `.env.example` from the repository root to `.env` and update the values for your environment. The server automatically loads variables from this file.

`src/.env` was removed from version control to avoid storing configuration files inside the source tree. Keep your `.env` file at the project root and make sure it is excluded from git by the `.gitignore` rules.

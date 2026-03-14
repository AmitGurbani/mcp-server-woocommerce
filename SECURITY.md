# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

### How to Report

1. **GitHub Security Advisories** (preferred): Go to [Security Advisories](https://github.com/AmitGurbani/mcp-server-woocommerce/security/advisories/new) and create a new advisory.
2. **Email**: Send details to the maintainer via the email listed on the [GitHub profile](https://github.com/AmitGurbani).

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 1 week
- **Fix or mitigation**: Dependent on severity, targeting 30 days for critical issues

## Scope

This project handles sensitive credentials and the following areas are in scope:

- **WooCommerce API key handling** — consumer key and consumer secret are passed via environment variables and used for API authentication
- **MCP transport security** — stdio (local) and HTTP (remote) transports. HTTP mode requires bearer token (`MCP_AUTH_TOKEN`) or OAuth 2.1 via Auth0
- **Authentication tokens** — `MCP_AUTH_TOKEN` and OAuth credentials must be kept secret; never commit to version control
- **Dependency vulnerabilities** — third-party packages that introduce security risks
- **Input validation** — parameters passed to WooCommerce API endpoints

### Out of Scope

- Vulnerabilities in WooCommerce itself (report to [WooCommerce](https://patchstack.com/database/vendor/woocommerce))
- Vulnerabilities in the MCP SDK (report to [Anthropic](https://github.com/modelcontextprotocol/sdk))
- Issues requiring physical access to the host machine

## Best Practices for Users

- **Never commit** `.env` files or API credentials to version control
- **Use read-only API keys** when possible (WooCommerce supports key-level permissions)
- **Restrict network access** to the WooCommerce API to trusted hosts
- Run the MCP server in a **sandboxed environment** when used with untrusted AI clients

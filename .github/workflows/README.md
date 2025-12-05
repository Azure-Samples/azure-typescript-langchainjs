# GitHub Actions Workflows

This directory contains GitHub Actions workflows for the Azure TypeScript LangChainJS repository.

## Available Workflows

### 1. Validate Workflows (`validate-workflows.yml`)

This workflow automatically validates all GitHub Actions workflows in the repository to ensure they are properly configured and using up-to-date actions.

**Features:**
- **Syntax Validation**: Uses `actionlint` to validate workflow YAML syntax and check for common issues
- **Action Availability Check**: Verifies that all referenced GitHub Actions are still available
- **Version Tracking**: Lists all actions and their versions in use
- **Automated Reports**: Generates a detailed report of all actions and their status

**When it runs:**
- On push/pull request when workflow files are modified
- Weekly on Mondays at 9:00 AM UTC (scheduled check for outdated actions)
- Manually via workflow dispatch

**Jobs:**
1. **validate-workflows**: Runs actionlint to check syntax and best practices
2. **detect-outdated-actions**: Extracts and analyzes all actions used in workflows, checks availability, and compares with latest versions
3. **summary**: Provides a consolidated summary of all validation jobs

**Outputs:**
- A downloadable report artifact containing all actions and versions in use
- GitHub step summary with validation results

### 2. CI (`ci.yml`)

Continuous integration workflow that builds and tests the project.

**When it runs:**
- On push to the `main` branch
- On pull requests to the `main` branch
- Manually via workflow dispatch

**Jobs:**
1. **build**: Installs dependencies and builds the project

## Validation Tools

### actionlint
A static checker for GitHub Actions workflow files. It catches common mistakes and enforces best practices.

**Installation:**
```bash
bash <(curl https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash)
```

**Usage:**
```bash
actionlint .github/workflows/*.yml
```

## Best Practices

1. **Pin Actions to Specific Versions**: Always use specific commit SHAs or version tags (e.g., `actions/checkout@v4`) instead of branches
2. **Keep Actions Updated**: Regularly review and update actions to their latest versions
3. **Test Workflow Changes**: Use workflow dispatch or create test branches to validate changes before merging
4. **Review Weekly Reports**: Check the scheduled validation runs to identify outdated actions

## Adding New Workflows

When adding new workflows:

1. Create your workflow file in `.github/workflows/`
2. Ensure it passes `actionlint` validation locally:
   ```bash
   actionlint .github/workflows/your-new-workflow.yml
   ```
3. Commit and push - the validate-workflows workflow will automatically check your new file
4. Review the validation results in the GitHub Actions tab

## Troubleshooting

### Workflow Validation Failures

If the validate-workflows workflow fails:

1. Check the job logs for specific error messages
2. Run `actionlint` locally to get detailed error information
3. Fix the issues and push the changes
4. The validation will run automatically on your next push

### Common Issues

- **Syntax Errors**: Check YAML indentation and syntax
- **Deprecated Actions**: Update to the latest version of the action
- **Unknown Actions**: Verify the action name and that the repository is public
- **Shell Script Issues**: Ensure proper quoting and use of variables in shell scripts

## Security Considerations

- Only use actions from trusted sources (verified creators or well-known organizations)
- Pin actions to specific commit SHAs for maximum security
- Review action source code before using new actions
- Keep actions updated to receive security patches

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [actionlint Repository](https://github.com/rhysd/actionlint)
- [GitHub Actions Security Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)

# Backend Issues

This directory contains documentation for issues that need to be addressed in the backend (quarkus-crud) repository.

## Purpose

When frontend development uncovers issues that appear to originate from backend API behavior, we document them here before reporting them to the backend team. This ensures:

1. **Clear Communication**: Issues are thoroughly analyzed and documented before being reported
2. **Complete Context**: Backend team has all necessary information to reproduce and fix issues
3. **Traceability**: We maintain a record of issues discovered during frontend development
4. **Collaboration**: Facilitates coordination between frontend and backend teams

## Issue Document Template

Each issue document should include:

### Required Sections
- **Issue Summary**: Brief description of the problem
- **Environment Information**: OS, browser, network conditions
- **Steps to Reproduce**: Detailed steps showing the issue
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Technical Analysis**: Code references, API calls, hypothesis about root cause

### Recommended Sections
- **Proposed Solutions**: Multiple potential fixes with pros/cons
- **API Details to Investigate**: Specific questions for backend team
- **Testing**: E2E tests created, backend test recommendations
- **Related Code Files**: Frontend and backend file references
- **Workarounds**: Temporary solutions users can employ
- **Priority**: Severity assessment
- **Labels**: Categorization tags

## Reporting Process

1. **Frontend Developer** discovers an issue during development or testing
2. **Create Issue Document** in this directory following the template
3. **Create E2E Test** (if applicable) that reproduces the issue
4. **Human Team Member** reports the issue to backend team via Slack
5. **Backend Team** investigates and implements fix
6. **Frontend Team** verifies fix with E2E tests
7. **Mark as Resolved** in the issue document

## Current Issues

### Open Issues
- [organizer-cannot-save-quiz.md](./organizer-cannot-save-quiz.md) - Event organizers unable to save quizzes

### Resolved Issues
(None yet)

## Notes

- These documents are NOT a substitute for proper issue tracking in the backend repository
- They serve as a bridge between frontend discovery and backend tracking
- Once reported to backend team, reference their issue/PR numbers in these documents
- Update documents with resolution details when fixed

## Contact

- **Frontend Team**: kimino_hint repository
- **Backend Team**: quarkus-crud repository (https://github.com/yuki-js/quarkus-crud)

# Staging Deployment Guide

This document describes how to deploy to the staging environment for testing changes before production.

## Overview

The GameOverview project uses a git tag-based staging deployment strategy. Staging deployments are triggered by creating git tags with specific patterns.

## Staging Environment

- **URL**: https://nextbestgame-staging.robertforpresent.workers.dev
- **Database**: Separate D1 database (`gameoverview-staging-db`)
- **KV Namespace**: Separate KV namespace for feature flags
- **Environment**: `staging`

## Deployment Methods

### Manual Deployment

Deploy directly using makefile:

```bash
make deploy
```

---
title: npm
tags: [npm, node, javascript, package-manager]
---

## Init & Config

```bash
npm init
npm init -y
npm config get registry
npm config set registry https://registry.npmjs.org/
npm login
npm logout
npm whoami
```

## Install

```bash
npm install
npm install lodash
npm install -D typescript eslint
npm install -g pnpm
npm ci                           # clean install from lockfile (CI)
npm install lodash@4.17.21
npm install github:user/repo
```

## Scripts

```bash
npm run build
npm run test -- --watch
npm run lint -- --fix
npm exec vitest
npx create-vite@latest
```

## Publish

```bash
npm version patch|minor|major
npm publish
npm publish --access public        # scoped packages
npm unpublish package@1.0.0       # use sparingly; policy applies
```

## Info & Search

```bash
npm ls
npm ls --depth=0
npm outdated
npm view lodash version
npm view lodash dependencies
npm search express
```

## Update

```bash
npm update
npm update lodash
npx npm-check-updates -u           # bump package.json ranges (install ncu separately)
```

## Security

```bash
npm audit
npm audit fix
npm audit fix --force
```

## Workspaces

```bash
# package.json: "workspaces": ["packages/*"]
npm install
npm install ws-name -w packages/app
npm run build --workspaces
npm exec --workspace packages/core eslint .
```

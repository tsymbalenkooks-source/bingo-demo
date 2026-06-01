# 75-Ball Bingo Demo

Static browser demo for a private 75-ball bingo call-and-check workflow.

## Deploy With GitHub Pages

1. Create a new GitHub repository.
2. Upload these files to the repository root:
   - `index.html`
   - `bingo-demo.css`
   - `bingo-demo.js`
   - `README.md`
3. Open the repository settings.
4. Go to **Pages**.
5. Set **Source** to **Deploy from a branch**.
6. Select the `main` branch and `/root`.
7. Save.

GitHub will publish the site at:

```text
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY-NAME/
```

No backend, database, payment system, or gambling feature is included.

## Deploy With GitHub CLI

Install and sign in to GitHub CLI first:

```sh
gh auth login
```

Then run:

```sh
chmod +x deploy-github.sh
./deploy-github.sh bingo-demo
```

If `git` is not available yet, use the no-git deploy script:

```sh
chmod +x deploy-github-no-git.sh
./deploy-github-no-git.sh bingo-demo
```

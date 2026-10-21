# deadsignal.studio deployment

The production domain already resolves to the existing Namecheap shared hosting and has an active HTTPS certificate. No DNS change is needed. cPanel's document root is `~/public_html`.

## Publish a tested GitHub commit

1. Work locally, run `npm test`, regenerate intentional asset changes with `npm run manifest`, then run `npm run verify:assets`.
2. Review and push the desired source commit to this public repository. GitHub Actions checks it; pushes do not automatically replace production.
3. In the authorized cPanel terminal, clone the repository into a new private source folder or update your existing clean source checkout. Select the exact reviewed commit.
4. Run `bash tools/deploy-cpanel.sh` from that checkout.
5. Open https://deadsignal.studio, walk into the café and verify the model loads. Compare published hashes with `docs/runtime-manifest.json` when diagnosing stale caches.

The script requires Git, Python 3, rsync and Bash, already present on the existing host. It validates every runtime hash, stages the new `dist/` contents while preserving the host's existing `.htaccess`, `.well-known`, CGI directory and other files, then switches the document root. The prior document root is retained in a private `~/dsv-backup-<UTC timestamp>` directory. It prints that path and the published source SHA.

## Rollback

Use the exact printed backup path. Rename the current `public_html` to a new private recovery folder, restore the backup as `public_html`, and restore its prior directory permissions (0750 on this host). Preserve the failed build for diagnosis. Verify HTTPS and the page after switching.

## Any static host

The contents of `dist/` are a standalone static site. They can be uploaded to another HTTPS document root without Node, Python, a backend, secrets or Meshy authentication. Serve JavaScript as JavaScript, JSON as JSON and GLBs as `model/gltf-binary` or `application/octet-stream`. Keep the relative directory structure intact.

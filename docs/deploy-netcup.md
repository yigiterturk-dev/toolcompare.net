# Netcup deploy (toolcompare.net)

Production runs on the netcup VPS `159.195.158.36` (IPv6
`2a0a:4cc0:c2:8b3a:d46a:54ff:fe87:b488`).

## Layout

- App: `/opt/toolcompare.net` (git checkout of `main`)
- Service: `toolcompare.service`, port **3020**
- Reverse proxy: `legafetch-caddy` container, Caddyfile at
  `/opt/legafetch/caddy/Caddyfile`
- Firewall: port 3020 allowed only from `172.18.0.0/16` (Docker network)

## Deploy

```bash
ssh netcup
/opt/toolcompare.net/scripts/deploy-netcup.sh
```

The script pulls `main`, refreshes the price snapshot, runs `npm ci`, runs the
test suite, builds, and restarts the unit. Tests run before the build: a code
failure stops the deploy while the old process is still serving.

## Auto-deploy without GitHub Actions

GitHub Actions is disabled on this repository. `toolcompare-autodeploy.timer`
checks `origin/main` every 10 minutes and runs the deploy script only when the
commit changed. The price snapshot is kept on the server at
`/opt/toolcompare-data/fiyat-gecmisi.json` (daily archives in `arsiv/`), so it
survives `git reset --hard` and does not depend on Actions.

```bash
systemctl status toolcompare-autodeploy.timer
systemctl start toolcompare-autodeploy.service   # deploy now
journalctl -u toolcompare-autodeploy.service -n 50
```

## Reverse proxy block

```caddy
toolcompare.net, www.toolcompare.net {
    import secure
    header {
        Strict-Transport-Security "max-age=63072000; includeSubDomains"
        -Server
    }
    encode zstd gzip
    @www host www.toolcompare.net
    redir @www https://toolcompare.net{uri} permanent
    reverse_proxy 172.18.0.1:3020 {
        header_up X-Forwarded-Proto {scheme}
        header_up X-Forwarded-Host {host}
    }
}
```

Reload after editing: `docker exec legafetch-caddy caddy reload --config /etc/caddy/Caddyfile`.

## DNS

Hostinger DNS: `@ A` and `@ AAAA` point to netcup; `www` is a CNAME to the apex.
DNS is managed through the Hostinger API token in `~/.config/nocturn/hostinger.env`
(on the workstation).

## Price history storage

`src/data/fiyat-gecmisi.json` in git is only a baseline. The live history is
`/opt/toolcompare-data/fiyat-gecmisi.json`; the deploy script restores it before
running `npm run fiyat:gecmis`, then copies the result back and archives it.
Do not delete that directory unless you intentionally want to reset the log.

## Backups

`toolcompare-backup.timer` writes a daily tar of `/opt/toolcompare-data`
(price history), `subscribers.json`, an optional `.env.production`, the Caddyfile
and the deploy units to `/opt/toolcompare-backups/`, keeping 14 days. It also
copies the archive to the hetzner host (`root@89.167.52.36`) under
`/opt/toolcompare-backups/`, keeping 30 days there. If the offsite host is
unreachable the local archive is kept and the failure is logged.

```bash
systemctl status toolcompare-backup.timer
systemctl start toolcompare-backup.service
```

Restore example:

```bash
tar -xzf /opt/toolcompare-backups/toolcompare-YYYY-MM-DD-HHMM.tar.gz -C /
```

## Uptime monitoring

- Jarvis on netcup watches `https://toolcompare.net` (10 min interval) and can
  restart the `toolcompare` unit; alerts go through its Telegram/mail setup.
- The hetzner host runs `toolcompare-uptime.timer` every 5 minutes against
  `https://toolcompare.net/stack`. After three consecutive failures it sends a
  Telegram alert and sends a recovery message when the site returns.
- Telegram credentials live in `/etc/toolcompare-alert.env` on hetzner (0600).

## Weekly GSC summary

`toolcompare-gsc.timer` runs Monday 09:00 and sends a Telegram summary of the
last 28 days (vs the previous 28), top pages and the count of 4–20th-position
pages with no clicks. The JSON snapshot is written to
`/opt/toolcompare-data/gsc-haftalik.json`.

- Service account key: `/etc/toolcompare-gsc/service-account.json` (0600)
- Telegram env: `/etc/toolcompare-gsc/env` (0600)
- Unit: `/etc/systemd/system/toolcompare-gsc.service` + `.timer`

```bash
systemctl start toolcompare-gsc.service
journalctl -u toolcompare-gsc.service -n 30
```

## Environment

No `.env.production` is present on the server. Public pages and `/api/tools`
work from the JSON catalog; database-backed endpoints (newsletter, admin) need
the production environment variables before they work.

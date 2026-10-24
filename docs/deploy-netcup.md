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

The script pulls `main`, runs `npm ci`, builds, and restarts the unit. A build
takes a few minutes; requests during the build may fail until the restart.

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

## Environment

No `.env.production` is present on the server. Public pages and `/api/tools`
work from the JSON catalog; database-backed endpoints (newsletter, admin) need
the production environment variables before they work.


# SSL for Moodle on Lightsail (Nginx)

This guide covers two ways to enable HTTPS for a Moodle installation running on **Ubuntu + Nginx**.

- **Option A (IP only): Self-signed certificate**
  - Works without a domain.
  - Browsers will show a security warning.
- **Option B (Recommended): Domain + Let’s Encrypt (certbot)**
  - Requires a domain name that resolves to your server.
  - Trusted by browsers.

## Before you start

- **Ports**
  - HTTP-01 validation requires inbound `TCP 80`.
  - HTTPS requires inbound `TCP 443`.
  - On Lightsail you must allow the ports in **Lightsail Networking** and, if enabled, in `ufw` on the VM.
- **Nginx**
  - You should already have a working HTTP site serving Moodle.
- **Backups**
  - Keep a copy of your current Nginx config before making changes.

## Assumptions

- Your Moodle code lives at `/var/www/html/sites/moodle`.
- Your Moodle public web root is `/var/www/html/sites/moodle/public`.
- You already have Nginx serving Moodle on port `80`.

## Option A: Self-signed SSL (no domain)

### 1) Create a self-signed certificate

This uses your server public IP (`<SERVER_IP>`).

```bash
sudo apt-get update
sudo apt-get install -y openssl

sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/moodle-selfsigned.key \
  -out /etc/ssl/certs/moodle-selfsigned.crt \
  -subj "/C=US/ST=State/L=City/O=Org/CN=<SERVER_IP>" \
  -addext "subjectAltName=IP:<SERVER_IP>"
```

### 2) Create an HTTPS server block for Nginx

This uses your server public IP (`<SERVER_IP>`).

```bash
sudo tee /etc/nginx/sites-available/moodle-ssl.conf > /dev/null <<'EOF'
server {
    listen 443 ssl;
    server_name <SERVER_IP>;

    root /var/www/html/sites/moodle/public;
    index index.php index.html index.htm;

    ssl_certificate /etc/ssl/certs/moodle-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/moodle-selfsigned.key;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ [^/]\.php(/|$) {
        fastcgi_split_path_info ^(.+\.php)(/.+)$;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param PATH_INFO $fastcgi_path_info;
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
    }

    location ~ /\.ht {
        deny all;
    }
}
EOF
```

### 3) Enable the site and reload Nginx

```bash
sudo ln -sf /etc/nginx/sites-available/moodle-ssl.conf /etc/nginx/sites-enabled/moodle-ssl.conf
sudo nginx -t
sudo systemctl reload nginx
```

### 4) Open port 443 in Lightsail and Ubuntu firewall

- In Lightsail Networking: allow inbound `TCP 443`.

On Ubuntu:

```bash
sudo ufw allow 'Nginx Full'
```

### 5) Access the site

Open:

- `https://54.93.245.151`

Your browser will show a warning because the certificate is self-signed.

## Option B: Let’s Encrypt SSL (domain required)

### 1) Set up DNS

You need a domain (e.g. `<DOMAIN>`) pointing to your server’s public IP (`<SERVER_IP>`):

- Create an `A` record for `<DOMAIN>` -> `<SERVER_IP>`

Wait until it resolves:

```bash
nslookup <DOMAIN>
```

Also verify HTTP is reachable (required for HTTP-01):

```bash
curl -I http://<DOMAIN>
```

### 2) Install certbot

Certbot’s recommended installation on many systems is via **snap**. If you prefer `apt`, you can still use the `apt` packages, but keep in mind they may not always be the newest Certbot.

#### Option B1 (recommended): snap

```bash
sudo apt-get update
sudo apt-get install -y snapd

sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/local/bin/certbot
```

#### Option B2: apt

```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
```

### 3) Obtain and install the certificate

```bash
sudo certbot --nginx -d <DOMAIN>
```

Certbot will update your Nginx config and reload Nginx.

If you prefer to manage Nginx config yourself, you can obtain a cert without auto-editing Nginx:

```bash
sudo certbot certonly --nginx -d <DOMAIN>
```

### 4) Confirm renewal is set

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

You can also check timers directly:

```bash
systemctl list-timers | grep -i certbot
```

### 5) Update Moodle `wwwroot` if needed

If Moodle was installed using `http://...` and you switch to `https://...`, you must update references.

1) Update `config.php`:

- Change `$CFG->wwwroot` from `http://...` to `https://...`.

2) Update stored content URLs (only if you need to rewrite existing stored links/content):

From the Moodle code folder:

```bash
cd /var/www/html/sites/moodle
sudo php admin/tool/replace/cli/replace.php --search=//oldsitehost --replace=//newsitehost --shorten --non-interactive
```

If you are using a reverse proxy / load balancer that terminates SSL in front of Moodle, you may need to set `$CFG->sslproxy = true;` and ensure your proxy sets `X-Forwarded-Proto: https`.

## Recommended Nginx HTTP -> HTTPS redirect

After HTTPS is working, ensure your port 80 server block redirects to HTTPS (and still allows ACME challenges if you renew via HTTP-01):

```nginx
server {
    listen 80;
    server_name <DOMAIN>;

    location ^~ /.well-known/acme-challenge/ {
        root /var/www/html;
        try_files $uri =404;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}
```

## Validation

```bash
sudo nginx -t
sudo systemctl reload nginx
curl -I https://<DOMAIN>
```

From a browser, confirm:

- The certificate is valid.
- You can log in.
- Mixed-content warnings are not present.

## Common issues

### Certbot fails when using only an IP

Let’s Encrypt does not issue certificates for bare IP addresses in the typical HTTP validation flow. Use a domain or use the self-signed option.

### Certbot fails with HTTP-01 challenge errors

Common causes:

- Port `80` is closed in Lightsail or blocked by `ufw`.
- DNS for `<DOMAIN>` does not point to `<SERVER_IP>`.
- Another server block is catching the challenge path.

Things to check:

```bash
sudo nginx -T | sed -n '1,200p'
curl -I http://<DOMAIN>/.well-known/acme-challenge/test
```

### Nginx shows the default site instead of Moodle

Check enabled sites:

```bash
ls -la /etc/nginx/sites-enabled/
sudo nginx -T | sed -n '1,200p'
```

Then ensure your Moodle server block is enabled and not overridden.

### Port 443 open in Ubuntu but not reachable

You must open it in both places:

- Lightsail Networking inbound rules
- Ubuntu firewall (`ufw`) rules

Also confirm Nginx is actually listening:

```bash
sudo ss -lntp | grep -E ':80|:443'
```


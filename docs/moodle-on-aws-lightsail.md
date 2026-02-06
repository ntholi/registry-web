# Moodle on AWS Lightsail (Ubuntu + LAMP)

This guide walks through provisioning an AWS Lightsail Ubuntu instance using the Lightsail console, installing a LAMP stack, installing Moodle with the CLI installer, wiring cron, and enabling HTTPS.

## Prerequisites

- AWS account with Lightsail access.
- AWS CLI installed and configured on your local machine (optional, only if you want to automate provisioning).
- A registered domain name (optional but recommended for HTTPS).
- Local SSH client.

## 1) Provision a Lightsail instance (UI)

Use the Lightsail console at https://lightsail.aws.amazon.com/ls/webapp/home/instances.

### 1.1 Create instance

1) Select Create instance.
2) Choose a region and availability zone close to your users.
3) Pick a blueprint: Ubuntu.
4) Choose a plan size that fits your load.
5) Name the instance and create it.

### 1.2 Configure networking

1) Open the instance.
2) Go to Networking.
3) Add or ensure inbound rules for:
   - SSH 22
   - HTTP 80
   - HTTPS 443

### 1.3 Allocate and attach a static IP

1) Open the Networking tab.
2) Create a static IP.
3) Attach it to your instance.

### 1.4 Find the public IP

The public IP is shown on the instance card and in the Networking tab.

### 1.5 SSH into the instance

Download your Lightsail default key pair from the Lightsail console, then connect:

```bash
ssh -i /path/to/LightsailDefaultKey.pem ubuntu@PUBLIC_IP
```

## 2) OS update and LAMP install

Update packages, then install the default LAMP stack.

```bash
sudo apt-get update
sudo apt-get install lamp-server^
```

Verify Apache is up:

```bash
curl -I http://localhost
```

## 3) Secure the database

MariaDB on Ubuntu uses the secure installation helper. Depending on version, the command is either `mariadb-secure-installation` or the legacy name.

```bash
sudo mariadb-secure-installation
```

Create a database and user for Moodle:

```bash
sudo mysql -u root
```

```sql
CREATE DATABASE moodle DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'moodle'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON moodle.* TO 'moodle'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 4) Download and place Moodle

Use the latest stable package from Moodle downloads. This is the recommended approach for production. The GitHub repo is best for development or if you need a specific unreleased fix.

```bash
cd /tmp
wget https://download.moodle.org/latest.tgz
sudo tar -xzf latest.tgz
sudo mv moodle /var/www/moodle
```

Create Moodle data directory and set permissions:

```bash
sudo mkdir -p /var/moodledata
sudo chown -R www-data:www-data /var/moodledata /var/www/moodle
sudo chmod -R 2770 /var/moodledata
```

## 4.1) Should you use GitHub instead of the release download?

Recommendation: use the official release package for production.

Use GitHub only when you need one of the following:
- A specific unreleased patch or branch.
- Contributing or developing plugins with a matching core branch.
- Tracking a stable branch for controlled updates.

If you choose GitHub, use a stable branch (for example, MOODLE_405_STABLE) and keep updates deliberate.

## 5) Apache site configuration

Create an Apache vhost for Moodle.

```bash
sudo tee /etc/apache2/sites-available/moodle.conf > /dev/null <<'EOF'
<VirtualHost *:80>
    ServerName YOUR_DOMAIN
    DocumentRoot /var/www/moodle

    <Directory /var/www/moodle>
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/moodle-error.log
    CustomLog ${APACHE_LOG_DIR}/moodle-access.log combined
</VirtualHost>
EOF

sudo a2enmod rewrite
sudo a2ensite moodle
sudo a2dissite 000-default
sudo systemctl reload apache2
```

If you are not using a domain yet, you can temporarily set ServerName to the public IP.

## 6) Run the Moodle CLI installer

Moodle includes a CLI installer that creates config.php and initializes the database.

```bash
sudo -u www-data /usr/bin/php /var/www/moodle/admin/cli/install.php \
  --lang=en \
  --wwwroot=http://YOUR_DOMAIN \
  --dataroot=/var/moodledata \
  --dbtype=mariadb \
  --dbhost=localhost \
  --dbname=moodle \
  --dbuser=moodle \
  --dbpass='STRONG_PASSWORD_HERE' \
  --fullname='Your Moodle Site' \
  --shortname='Moodle' \
  --adminuser=admin \
  --adminpass='STRONG_ADMIN_PASSWORD' \
  --adminemail=admin@example.com \
  --agree-license \
  --non-interactive
```

## 7) Configure cron

Moodle requires cron to run every minute.

```bash
sudo crontab -u www-data -e
```

Add this line:

```bash
* * * * * /usr/bin/php /var/www/moodle/admin/cli/cron.php >/dev/null
```

You can list or run tasks manually if needed:

```bash
sudo -u www-data /usr/bin/php /var/www/moodle/admin/cli/cron.php --list
sudo -u www-data /usr/bin/php /var/www/moodle/admin/cli/scheduled_task.php --list
```

## 8) Enable HTTPS (Certbot + Apache)

Install Certbot via snap and enable HTTPS.

```bash
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/local/bin/certbot
sudo certbot --apache
sudo certbot renew --dry-run
```

## 9) Post-install checks

- Visit http://YOUR_DOMAIN and https://YOUR_DOMAIN.
- Log in as the admin user and complete any web-based setup prompts.
- Check the scheduled task status in Site administration > Server > Tasks.

## 10) Upgrades (CLI)

When upgrading Moodle, use the CLI upgrader.

```bash
sudo -u www-data /usr/bin/php /var/www/moodle/admin/cli/upgrade.php
```

## Sources

- Lightsail console: https://lightsail.aws.amazon.com/ls/webapp/home/instances
- Ubuntu LAMP stack commands: https://help.ubuntu.com/community/ApacheMySQLPHP
- Moodle CLI installer options: https://raw.githubusercontent.com/moodle/moodle/main/admin/cli/install.php
- Moodle CLI cron: https://raw.githubusercontent.com/moodle/moodle/main/admin/cli/cron.php
- Moodle scheduled tasks CLI: https://raw.githubusercontent.com/moodle/moodle/main/admin/cli/scheduled_task.php
- Moodle CLI upgrade: https://raw.githubusercontent.com/moodle/moodle/main/admin/cli/upgrade.php
- Certbot Apache instructions: https://certbot.eff.org/instructions?ws=apache&os=ubuntufocal
- MariaDB secure installation notes: https://mariadb.com/kb/en/mysql_secure_installation/
